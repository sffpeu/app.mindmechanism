'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

const STORAGE_KEY = 'layersLargeBackgroundClockOpacityPercent'
/** Previous app stored a 0–1 multiplier; large clock used base 0.03 × multiplier. */
const LEGACY_INTENSITY_STORAGE_KEY = 'layersClockIntensity'
const LEGACY_LARGE_BG_BASE_OPACITY = 0.03

export const LAYERS_LARGE_BG_CLOCK_OPACITY_DEFAULT_PERCENT = 3

const MIN_PERCENT = 0
const MAX_PERCENT = 100

type LayersDisplaySettingsContextValue = {
  largeBackgroundClockOpacityPercent: number
  setLargeBackgroundClockOpacityPercent: (percent: number) => void
}

const LayersDisplaySettingsContext = createContext<LayersDisplaySettingsContextValue | null>(null)

function clampPercent(n: number): number {
  if (Number.isNaN(n)) return LAYERS_LARGE_BG_CLOCK_OPACITY_DEFAULT_PERCENT
  return Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, Math.round(n)))
}

export function LayersDisplaySettingsProvider({ children }: { children: ReactNode }) {
  const [largeBackgroundClockOpacityPercent, setPercentState] = useState(
    LAYERS_LARGE_BG_CLOCK_OPACITY_DEFAULT_PERCENT
  )
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw != null) {
        const parsed = Number.parseInt(raw, 10)
        if (!Number.isNaN(parsed)) {
          setPercentState(clampPercent(parsed))
        }
      } else {
        const legacyRaw = localStorage.getItem(LEGACY_INTENSITY_STORAGE_KEY)
        if (legacyRaw != null) {
          const legacy = Number.parseFloat(legacyRaw)
          if (!Number.isNaN(legacy)) {
            const clamped01 = Math.min(1, Math.max(0, legacy))
            const migrated = clampPercent(
              Math.round(100 * LEGACY_LARGE_BG_BASE_OPACITY * clamped01)
            )
            setPercentState(migrated)
            localStorage.setItem(STORAGE_KEY, String(migrated))
          }
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true)
  }, [])

  const setLargeBackgroundClockOpacityPercent = useCallback((percent: number) => {
    const next = clampPercent(percent)
    setPercentState(next)
    try {
      localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue == null) return
      const parsed = Number.parseInt(e.newValue, 10)
      if (!Number.isNaN(parsed)) setPercentState(clampPercent(parsed))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [hydrated])

  return (
    <LayersDisplaySettingsContext.Provider
      value={{ largeBackgroundClockOpacityPercent, setLargeBackgroundClockOpacityPercent }}
    >
      {children}
    </LayersDisplaySettingsContext.Provider>
  )
}

export function useLayersDisplaySettings(): LayersDisplaySettingsContextValue {
  const ctx = useContext(LayersDisplaySettingsContext)
  if (!ctx) {
    throw new Error('useLayersDisplaySettings must be used within LayersDisplaySettingsProvider')
  }
  return ctx
}
