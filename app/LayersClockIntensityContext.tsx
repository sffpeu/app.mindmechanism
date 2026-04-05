'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'layersClockIntensity'

/** Base opacity for the large hover/focus clock on /layers (scaled by intensity). */
export const LAYERS_LARGE_BG_CLOCK_BASE_OPACITY = 0.03

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 1
  return Math.min(1, Math.max(0, n))
}

interface LayersClockIntensityContextType {
  /** 0–1; scales stacked background clocks and the large hover clock together. */
  layersClockIntensity: number
  setLayersClockIntensity: (value: number) => void
}

const LayersClockIntensityContext = createContext<LayersClockIntensityContextType>({
  layersClockIntensity: 1,
  setLayersClockIntensity: () => {},
})

export function LayersClockIntensityProvider({ children }: { children: React.ReactNode }) {
  const [layersClockIntensity, setIntensityState] = useState(1)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw == null) return
      const parsed = clamp01(parseFloat(raw))
      setIntensityState(parsed)
    } catch {
      /* ignore */
    }
  }, [])

  const setLayersClockIntensity = useCallback((value: number) => {
    const next = clamp01(value)
    setIntensityState(next)
    try {
      localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <LayersClockIntensityContext.Provider value={{ layersClockIntensity, setLayersClockIntensity }}>
      {children}
    </LayersClockIntensityContext.Provider>
  )
}

export function useLayersClockIntensity() {
  return useContext(LayersClockIntensityContext)
}
