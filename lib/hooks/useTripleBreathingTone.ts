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

const MAX_GAIN_SYNTH = 0.065
const MAX_GAIN_DRONE = 0.052

/**
 * Three wheels: sine or looped drones, same breathing envelope, respects Sound settings.
 */
export function useTripleBreathingTone(
  clockIndexA: number,
  clockIndexB: number,
  clockIndexC: number,
  muted: boolean
) {
  const mutedRef = useRef(muted)
  mutedRef.current = muted

  const settingsHydrated = useSettingsHydrated()

  const {
    tonesEnabled,
    toneVolume,
    toneMode,
    clockToneMuted,
    droneClockGain,
  } = useSettings()

  const settingsRef = useRef({
    tonesEnabled,
    toneVolume,
    toneMode: toneMode ?? 'drone',
    mutedA: clockToneMuted[clockIndexA] ?? false,
    mutedB: clockToneMuted[clockIndexB] ?? false,
    mutedC: clockToneMuted[clockIndexC] ?? false,
    gainA: droneClockGain[clockIndexA] ?? 1,
    gainB: droneClockGain[clockIndexB] ?? 1,
    gainC: droneClockGain[clockIndexC] ?? 1,
  })
  settingsRef.current = {
    tonesEnabled,
    toneVolume,
    toneMode: toneMode ?? 'drone',
    mutedA: clockToneMuted[clockIndexA] ?? false,
    mutedB: clockToneMuted[clockIndexB] ?? false,
    mutedC: clockToneMuted[clockIndexC] ?? false,
    gainA: droneClockGain[clockIndexA] ?? 1,
    gainB: droneClockGain[clockIndexB] ?? 1,
    gainC: droneClockGain[clockIndexC] ?? 1,
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

    const gainA = ctx.createGain()
    const gainB = ctx.createGain()
    const gainC = ctx.createGain()
    gainA.gain.setValueAtTime(0, ctx.currentTime)
    gainB.gain.setValueAtTime(0, ctx.currentTime)
    gainC.gain.setValueAtTime(0, ctx.currentTime)
    gainA.connect(ctx.destination)
    gainB.connect(ctx.destination)
    gainC.connect(ctx.destination)

    let oscA: OscillatorNode | null = null
    let oscB: OscillatorNode | null = null
    let oscC: OscillatorNode | null = null
    let srcA: AudioBufferSourceNode | null = null
    let srcB: AudioBufferSourceNode | null = null
    let srcC: AudioBufferSourceNode | null = null
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

    const makeOsc = (hz: number, g: GainNode) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(20, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(30, hz),
        ctx.currentTime + FREQ_FADE_IN_S
      )
      g.gain.setValueAtTime(0, ctx.currentTime)
      osc.connect(g)
      try {
        osc.start()
      } catch {
        /* already running */
      }
      return osc
    }

    const startSynthetic = () => {
      const hzA = audibleHzFromClockTone(CLOCK_TONE_HZ[clockIndexA] ?? CLOCK_TONE_HZ[0])
      const hzB = audibleHzFromClockTone(CLOCK_TONE_HZ[clockIndexB] ?? CLOCK_TONE_HZ[0])
      const hzC = audibleHzFromClockTone(CLOCK_TONE_HZ[clockIndexC] ?? CLOCK_TONE_HZ[0])
      oscA = makeOsc(hzA, gainA)
      oscB = makeOsc(hzB, gainB)
      oscC = makeOsc(hzC, gainC)
    }

    const startDrone = async () => {
      try {
        const [bufA, bufB, bufC] = await Promise.all([
          decodeDroneSample(ctx, clockIndexA, isCancelled),
          decodeDroneSample(ctx, clockIndexB, isCancelled),
          decodeDroneSample(ctx, clockIndexC, isCancelled),
        ])
        if (cancelled) return
        const a = ctx.createBufferSource()
        a.buffer = bufA
        a.loop = true
        a.connect(gainA)
        a.start()
        srcA = a
        const b = ctx.createBufferSource()
        b.buffer = bufB
        b.loop = true
        b.connect(gainB)
        b.start()
        srcB = b
        const c = ctx.createBufferSource()
        c.buffer = bufC
        c.loop = true
        c.connect(gainC)
        c.start()
        srcC = c
      } catch (e) {
        console.warn('[TripleBreathingTone] Drone load failed, using sine', e)
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
      const multA = s.toneMode === 'drone' ? Math.max(0, Math.min(2, s.gainA)) : 1
      const multB = s.toneMode === 'drone' ? Math.max(0, Math.min(2, s.gainB)) : 1
      const multC = s.toneMode === 'drone' ? Math.max(0, Math.min(2, s.gainC)) : 1

      const gA =
        gate || s.mutedA
          ? 0
          : breath * peak * levelMult * s.toneVolume * multA
      const gB =
        gate || s.mutedB
          ? 0
          : breath * peak * levelMult * s.toneVolume * multB
      const gC =
        gate || s.mutedC
          ? 0
          : breath * peak * levelMult * s.toneVolume * multC

      gainA.gain.setTargetAtTime(gA, now, 0.04)
      gainB.gain.setTargetAtTime(gB, now, 0.04)
      gainC.gain.setTargetAtTime(gC, now, 0.04)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      cancelled = true
      window.removeEventListener('pointerdown', tryResume)
      window.removeEventListener('keydown', tryResume)
      document.removeEventListener('visibilitychange', onVis)
      cancelAnimationFrame(rafId)
      try {
        srcA?.stop()
        srcA?.disconnect()
        srcB?.stop()
        srcB?.disconnect()
        srcC?.stop()
        srcC?.disconnect()
      } catch {
        /* ignore */
      }
      try {
        oscA?.stop()
        oscA?.disconnect()
        oscB?.stop()
        oscB?.disconnect()
        oscC?.stop()
        oscC?.disconnect()
      } catch {
        /* ignore */
      }
      gainA.disconnect()
      gainB.disconnect()
      gainC.disconnect()
      void ctx.close()
    }
  }, [clockIndexA, clockIndexB, clockIndexC, toneMode, settingsHydrated])
}
