'use client'

import { useTheme } from '@/app/ThemeContext'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

const STORAGE_KEY = 'layersLargeBackgroundClockOpacityPercent'
/** Previous app stored a 0–1 multiplier; large clock used base 0.03 × multiplier. */
const LEGACY_INTENSITY_STORAGE_KEY = 'layersClockIntensity'
const LEGACY_LARGE_BG_BASE_OPACITY = 0.03

/** Used when no value is saved and the app is in light mode. */
export const LAYERS_LARGE_BG_CLOCK_OPACITY_DEFAULT_LIGHT_PERCENT = 3
/** Used when no value is saved and the app is in dark mode. */
export const LAYERS_LARGE_BG_CLOCK_OPACITY_DEFAULT_DARK_PERCENT = 5

const MIN_PERCENT = 0
const MAX_PERCENT = 100

type LayersDisplaySettingsContextValue = {
  /** Effective opacity (saved override, or 3% light / 5% dark). */
  largeBackgroundClockOpacityPercent: number
  setLargeBackgroundClockOpacityPercent: (percent: number) => void
}

const LayersDisplaySettingsContext = createContext<LayersDisplaySettingsContextValue | null>(null)

function clampPercent(n: number): number {
  if (Number.isNaN(n)) return LAYERS_LARGE_BG_CLOCK_OPACITY_DEFAULT_LIGHT_PERCENT
  return Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, Math.round(n)))
}

export function LayersDisplaySettingsProvider({ children }: { children: ReactNode }) {
  const { isDarkMode } = useTheme()
  /** `null` = follow theme defaults (3% light, 5% dark). */
  const [overridePercent, setOverridePercent] = useState<number | null>(null)
  const [hydrated, setHydrated] = useState(false)

  const themeDefaultPercent = isDarkMode
    ? LAYERS_LARGE_BG_CLOCK_OPACITY_DEFAULT_DARK_PERCENT
    : LAYERS_LARGE_BG_CLOCK_OPACITY_DEFAULT_LIGHT_PERCENT

  const largeBackgroundClockOpacityPercent = useMemo(
    () => (overridePercent !== null ? overridePercent : themeDefaultPercent),
    [overridePercent, themeDefaultPercent]
  )

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw != null) {
        const parsed = Number.parseInt(raw, 10)
        if (!Number.isNaN(parsed)) {
          setOverridePercent(clampPercent(parsed))
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
            setOverridePercent(migrated)
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
    setOverridePercent(next)
    try {
      localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return
      if (e.newValue == null) {
        setOverridePercent(null)
        return
      }
      const parsed = Number.parseInt(e.newValue, 10)
      if (!Number.isNaN(parsed)) setOverridePercent(clampPercent(parsed))
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
