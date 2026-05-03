'use client'

import { useEffect, useRef } from 'react'
import {
  CLOCK_BREATH_PERIOD_MS,
  CLOCK_TONE_HZ,
  audibleHzFromClockTone,
  breathIntensity01,
} from '@/lib/clockToneHz'

const FREQ_FADE_IN_S = 3.5
/** Lower ceiling per oscillator so three tones together don't clip */
const MAX_GAIN = 0.065

const SOUND_CHECK_MS = 2200
const LEVEL_RAMP_MS = 5200
const START_LEVEL = 0.028
const SOUND_CHECK_END_LEVEL = 0.11

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

function masterLevelMult(elapsed: number): number {
  if (elapsed < SOUND_CHECK_MS) {
    return START_LEVEL + (SOUND_CHECK_END_LEVEL - START_LEVEL) * (elapsed / SOUND_CHECK_MS)
  }
  const rampEnd = SOUND_CHECK_MS + LEVEL_RAMP_MS
  if (elapsed < rampEnd) {
    const u = (elapsed - SOUND_CHECK_MS) / LEVEL_RAMP_MS
    return SOUND_CHECK_END_LEVEL + (1 - SOUND_CHECK_END_LEVEL) * easeOutCubic(u)
  }
  return 1
}

/**
 * Plays three sine tones simultaneously (one per wheel) in a single AudioContext.
 * All tones breathe in phase on the 60-second envelope.
 */
export function useTripleBreathingTone(
  clockIndexA: number,
  clockIndexB: number,
  clockIndexC: number,
  muted: boolean
) {
  const mutedRef = useRef(muted)
  mutedRef.current = muted

  useEffect(() => {
    if (typeof window === 'undefined') return

    let ctx: AudioContext
    try {
      ctx = new AudioContext()
    } catch {
      return
    }

    const hzA = audibleHzFromClockTone(CLOCK_TONE_HZ[clockIndexA] ?? CLOCK_TONE_HZ[0])
    const hzB = audibleHzFromClockTone(CLOCK_TONE_HZ[clockIndexB] ?? CLOCK_TONE_HZ[0])
    const hzC = audibleHzFromClockTone(CLOCK_TONE_HZ[clockIndexC] ?? CLOCK_TONE_HZ[0])

    const makeOsc = (hz: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(20, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(30, hz),
        ctx.currentTime + FREQ_FADE_IN_S
      )
      gain.gain.setValueAtTime(0, ctx.currentTime)
      osc.connect(gain)
      gain.connect(ctx.destination)
      try { osc.start() } catch { /* already running */ }
      return { osc, gain }
    }

    const a = makeOsc(hzA)
    const b = makeOsc(hzB)
    const c = makeOsc(hzC)

    void ctx.resume()

    const tryResume = () => { if (ctx.state === 'suspended') void ctx.resume() }
    window.addEventListener('pointerdown', tryResume, { passive: true })
    window.addEventListener('keydown', tryResume, { passive: true })
    const onVis = () => { if (document.visibilityState === 'visible') tryResume() }
    document.addEventListener('visibilitychange', onVis)

    const t0 = performance.now()
    let rafId: number

    const tick = () => {
      const elapsed = performance.now() - t0
      const phase = (elapsed % CLOCK_BREATH_PERIOD_MS) / CLOCK_BREATH_PERIOD_MS
      const breath = breathIntensity01(phase)
      const levelMult = masterLevelMult(elapsed)
      const g = mutedRef.current ? 0 : breath * MAX_GAIN * levelMult
      const now = ctx.currentTime
      a.gain.gain.setTargetAtTime(g, now, 0.04)
      b.gain.gain.setTargetAtTime(g, now, 0.04)
      c.gain.gain.setTargetAtTime(g, now, 0.04)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('pointerdown', tryResume)
      window.removeEventListener('keydown', tryResume)
      document.removeEventListener('visibilitychange', onVis)
      cancelAnimationFrame(rafId)
      try {
        a.osc.stop(); a.osc.disconnect(); a.gain.disconnect()
        b.osc.stop(); b.osc.disconnect(); b.gain.disconnect()
        c.osc.stop(); c.osc.disconnect(); c.gain.disconnect()
      } catch { /* ignore */ }
      void ctx.close()
    }
  }, [clockIndexA, clockIndexB, clockIndexC])
}
