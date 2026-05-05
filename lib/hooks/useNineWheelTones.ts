'use client'

import { useEffect, useRef } from 'react'
import { useSettings } from '@/lib/hooks/useSettings'
import { useSettingsHydrated } from '@/lib/hooks/useSettingsHydrated'
import { FREQ_FADE_IN_S, masterLevelMult } from '@/lib/breathingToneEnvelope'
import { decodeDroneSample } from '@/lib/droneSample'
import {
  CLOCK_BREATH_PERIOD_MS,
  CLOCK_TONE_HZ,
  audibleHzFromClockTone,
  breathIntensity01,
} from '@/lib/clockToneHz'

// Nine simultaneous channels — scale down proportionally from triple
const MAX_GAIN_SYNTH = 0.022
const MAX_GAIN_DRONE = 0.018

const ALL_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const

/**
 * All nine wheel tones playing together in a single AudioContext.
 * Respects Settings → Node frequencies (master volume, per-node mute, tone mode, drone levels).
 */
export function useNineWheelTones(muted: boolean) {
  const mutedRef = useRef(muted)
  mutedRef.current = muted

  const settingsHydrated = useSettingsHydrated()
  const { tonesEnabled, toneVolume, toneMode, clockToneMuted, droneClockGain } = useSettings()

  const settingsRef = useRef({
    tonesEnabled,
    toneVolume,
    toneMode: toneMode ?? 'drone',
    perMuted: clockToneMuted as Record<number, boolean>,
    perGain: droneClockGain as Record<number, number>,
  })
  settingsRef.current = {
    tonesEnabled,
    toneVolume,
    toneMode: toneMode ?? 'drone',
    perMuted: clockToneMuted as Record<number, boolean>,
    perGain: droneClockGain as Record<number, number>,
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!settingsHydrated) return

    const mode: 'synthetic' | 'drone' = toneMode === 'synthetic' ? 'synthetic' : 'drone'
    let ctx: AudioContext
    try {
      ctx = new AudioContext()
    } catch {
      return
    }

    const gains = ALL_INDICES.map(() => {
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, ctx.currentTime)
      g.connect(ctx.destination)
      return g
    })

    const oscs: (OscillatorNode | null)[] = ALL_INDICES.map(() => null)
    const srcs: (AudioBufferSourceNode | null)[] = ALL_INDICES.map(() => null)
    let cancelled = false
    const isCancelled = () => cancelled

    const tryResume = () => {
      if (ctx.state === 'suspended') void ctx.resume()
    }
    window.addEventListener('pointerdown', tryResume, { passive: true })
    window.addEventListener('keydown', tryResume, { passive: true })
    const onVis = () => {
      if (document.visibilityState === 'visible') tryResume()
    }
    document.addEventListener('visibilitychange', onVis)

    const startSynthetic = () => {
      ALL_INDICES.forEach((i) => {
        const hz = audibleHzFromClockTone(CLOCK_TONE_HZ[i] ?? CLOCK_TONE_HZ[0])
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(20, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(30, hz),
          ctx.currentTime + FREQ_FADE_IN_S
        )
        osc.connect(gains[i]!)
        try { osc.start() } catch { /* already running */ }
        oscs[i] = osc
      })
    }

    const startDrone = async () => {
      try {
        const buffers = await Promise.all(
          ALL_INDICES.map((i) => decodeDroneSample(ctx, i, isCancelled))
        )
        if (cancelled) return
        ALL_INDICES.forEach((i) => {
          const src = ctx.createBufferSource()
          src.buffer = buffers[i]!
          src.loop = true
          src.connect(gains[i]!)
          src.start()
          srcs[i] = src
        })
      } catch (e) {
        console.warn('[NineWheelTones] Drone load failed, using sine', e)
        if (!cancelled) startSynthetic()
      }
    }

    if (mode === 'drone') void startDrone()
    else startSynthetic()

    void ctx.resume()

    const t0 = performance.now()
    let rafId: number

    const tick = () => {
      const elapsed = performance.now() - t0
      const phase = (elapsed % CLOCK_BREATH_PERIOD_MS) / CLOCK_BREATH_PERIOD_MS
      const breath = breathIntensity01(phase)
      const levelMult = masterLevelMult(elapsed)
      const s = settingsRef.current
      const now = ctx.currentTime
      const gate = !s.tonesEnabled || mutedRef.current
      const peak = s.toneMode === 'drone' ? MAX_GAIN_DRONE : MAX_GAIN_SYNTH

      ALL_INDICES.forEach((i) => {
        const perMuted = s.perMuted[i] ?? false
        const droneMult = s.toneMode === 'drone' ? Math.max(0, Math.min(2, s.perGain[i] ?? 1)) : 1
        const g = gate || perMuted ? 0 : breath * peak * levelMult * s.toneVolume * droneMult
        gains[i]!.gain.setTargetAtTime(g, now, 0.04)
      })

      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      cancelled = true
      window.removeEventListener('pointerdown', tryResume)
      window.removeEventListener('keydown', tryResume)
      document.removeEventListener('visibilitychange', onVis)
      cancelAnimationFrame(rafId)
      srcs.forEach((src) => {
        try { src?.stop(); src?.disconnect() } catch { /* ignore */ }
      })
      oscs.forEach((osc) => {
        try { osc?.stop(); osc?.disconnect() } catch { /* ignore */ }
      })
      gains.forEach((g) => g.disconnect())
      void ctx.close()
    }
  }, [toneMode, settingsHydrated])
}
