'use client'

/**
 * useHueSync — synchronises the active clock's colour to Philips Hue lights.
 *
 * Usage (on any clock page):
 *   useHueSync(CLOCK_INDEX)
 *
 * Reads bridge IP, API key, brightness, and light ID allowlist from useSettings.
 * Fires on mount and whenever clockIndex changes. Debounced to avoid flooding
 * the bridge during rapid navigation.
 */

import { useEffect, useRef } from 'react'
import { useSettings } from '@/lib/hooks/useSettings'
import { clockIndexToHueState } from '@/lib/hueColors'

const DEBOUNCE_MS = 300

export function useHueSync(clockIndex: number) {
  const {
    hueEnabled,
    hueBridgeIp,
    hueApiKey,
    hueBrightness,
    hueLightIds,
    hueTransitionSec,
    hueUseAllLights,
  } = useSettings()

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!hueEnabled || !hueBridgeIp || !hueApiKey) return
    if (!hueUseAllLights && hueLightIds.length === 0) return

    // Debounce: cancel any pending call from a previous render
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      const state = clockIndexToHueState(clockIndex, hueBrightness, hueTransitionSec)

      fetch('/api/hue/lights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bridgeIp: hueBridgeIp,
          apiKey: hueApiKey,
          state,
          lightIds: hueUseAllLights ? undefined : hueLightIds,
        }),
      }).catch((err) => {
        // Non-fatal — light sync failure should never disrupt the session
        console.warn('[HueSync] Light update failed:', err)
      })
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [
    clockIndex,
    hueEnabled,
    hueBridgeIp,
    hueApiKey,
    hueBrightness,
    hueLightIds,
    hueTransitionSec,
    hueUseAllLights,
  ])
}
