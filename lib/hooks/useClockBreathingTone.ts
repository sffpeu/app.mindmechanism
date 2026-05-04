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

const MAX_GAIN_SYNTH = 0.12
const MAX_GAIN_DRONE = 0.11

/**
 * Breathing tone on single-node clock pages: synthetic sine or looped planet drone
 * sample, with gain following the same ~60s curve as the clock glow. Respects
 * Settings → Node frequencies (master volume, per-node mute, tone mode, drone levels).
 */
export function useClockBreathingTone(clockIndex: number, muted: boolean) {
  const rafRef = useRef<number>(0)
  const mutedRef = useRef(muted)
  mutedRef.current = muted

  const settingsHydrated = useSettingsHydrated()

  const {
    tonesEnabled,
    toneVolume,
    clockToneMuted,
    toneMode,
    droneClockGain,
  } = useSettings()

  const settingsRef = useRef({
    tonesEnabled,
    toneVolume,
    clockMuted: clockToneMuted[clockIndex] ?? false,
    toneMode: toneMode ?? 'drone',
    droneGain: droneClockGain[clockIndex] ?? 1,
  })
  settingsRef.current = {
    tonesEnabled,
    toneVolume,
    clockMuted: clockToneMuted[clockIndex] ?? false,
    toneMode: toneMode ?? 'drone',
    droneGain: droneClockGain[clockIndex] ?? 1,
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

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.connect(ctx.destination)

    let osc: OscillatorNode | null = null
    let source: AudioBufferSourceNode | null = null
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
      const raw = CLOCK_TONE_HZ[clockIndex] ?? CLOCK_TONE_HZ[0]
      const targetHz = audibleHzFromClockTone(raw)
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.setValueAtTime(20, ctx.currentTime)
      o.frequency.exponentialRampToValueAtTime(
        Math.max(30, targetHz),
        ctx.currentTime + FREQ_FADE_IN_S
      )
      o.connect(gain)
      try {
        o.start()
      } catch {
        /* already started */
      }
      osc = o
    }

    const startDrone = async () => {
      try {
        const buffer = await decodeDroneSample(ctx, clockIndex, isCancelled)
        if (cancelled) return
        const src = ctx.createBufferSource()
        src.buffer = buffer
        src.loop = true
        src.connect(gain)
        src.start()
        source = src
      } catch (e) {
        console.warn('[ClockBreathingTone] Drone sample failed, using sine', e)
        if (!cancelled) startSynthetic()
      }
    }

    if (mode === 'drone') {
      void startDrone()
    } else {
      startSynthetic()
    }

    void ctx.resume()

    const t0 = performance.now()

    const tick = () => {
      const elapsed = performance.now() - t0
      const phase = (elapsed % CLOCK_BREATH_PERIOD_MS) / CLOCK_BREATH_PERIOD_MS
      const breath = breathIntensity01(phase)
      const levelMult = masterLevelMult(elapsed)
      const s = settingsRef.current
      const now = ctx.currentTime

      if (!s.tonesEnabled || s.clockMuted || mutedRef.current) {
        gain.gain.setTargetAtTime(0, now, 0.04)
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const peak = s.toneMode === 'drone' ? MAX_GAIN_DRONE : MAX_GAIN_SYNTH
      const droneMult = s.toneMode === 'drone' ? Math.max(0, Math.min(2, s.droneGain)) : 1
      const g = breath * peak * levelMult * s.toneVolume * droneMult
      gain.gain.setTargetAtTime(g, now, 0.04)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelled = true
      window.removeEventListener('pointerdown', tryResume)
      window.removeEventListener('keydown', tryResume)
      document.removeEventListener('visibilitychange', onVis)
      cancelAnimationFrame(rafRef.current)
      try {
        source?.stop()
        source?.disconnect()
      } catch {
        /* ignore */
      }
      try {
        osc?.stop()
        osc?.disconnect()
      } catch {
        /* ignore */
      }
      gain.disconnect()
      void ctx.close()
    }
  }, [clockIndex, toneMode, settingsHydrated])
}
