'use client'

import { useEffect, useRef } from 'react'
import {
  CLOCK_BREATH_PERIOD_MS,
  CLOCK_TONE_HZ,
  audibleHzFromClockTone,
  breathIntensity01,
} from '@/lib/clockToneHz'

const FREQ_FADE_IN_S = 3.5
const MAX_GAIN = 0.12

/** Quiet “sound check” phase: breathing applies but overall level stays very low, then ramps up */
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
 * Plays a sine tone per clock index: frequency fades up on start; loudness follows
 * the same ~60s breathing curve as the clock glow. Begins at very low level during
 * the sound-check window, then ramps to full breathing response.
 */
export function useClockBreathingTone(clockIndex: number, muted: boolean) {
  const rafRef = useRef<number>(0)
  const mutedRef = useRef(muted)
  mutedRef.current = muted

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = CLOCK_TONE_HZ[clockIndex] ?? CLOCK_TONE_HZ[0]
    const targetHz = audibleHzFromClockTone(raw)

    let ctx: AudioContext
    try {
      ctx = new AudioContext()
    } catch {
      return
    }

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(20, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(30, targetHz),
      ctx.currentTime + FREQ_FADE_IN_S
    )
    gain.gain.setValueAtTime(0, ctx.currentTime)

    osc.connect(gain)
    gain.connect(ctx.destination)

    // Start the tone as soon as the page loads; gain is 0 until the breathing ramp applies.
    try {
      osc.start()
    } catch {
      /* already started */
    }
    void ctx.resume()

    const tryResume = () => {
      if (ctx.state === 'suspended') void ctx.resume()
    }
    window.addEventListener('pointerdown', tryResume, { passive: true })
    window.addEventListener('keydown', tryResume, { passive: true })
    const onVis = () => {
      if (document.visibilityState === 'visible') tryResume()
    }
    document.addEventListener('visibilitychange', onVis)

    const t0 = performance.now()

    const tick = () => {
      const elapsed = performance.now() - t0
      const phase = (elapsed % CLOCK_BREATH_PERIOD_MS) / CLOCK_BREATH_PERIOD_MS
      const breath = breathIntensity01(phase)
      const levelMult = masterLevelMult(elapsed)
      let g = breath * MAX_GAIN * levelMult
      if (mutedRef.current) g = 0
      const now = ctx.currentTime
      gain.gain.setTargetAtTime(g, now, 0.04)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('pointerdown', tryResume)
      window.removeEventListener('keydown', tryResume)
      document.removeEventListener('visibilitychange', onVis)
      cancelAnimationFrame(rafRef.current)
      try {
        osc.stop()
        osc.disconnect()
        gain.disconnect()
      } catch {
        /* ignore */
      }
      void ctx.close()
    }
  }, [clockIndex])
}
