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

/**
 * Plays a sine tone per clock index: frequency fades up on start; loudness follows
 * the same ~60s breathing curve as the clock glow on individual clock pages.
 */
export function useClockBreathingTone(clockIndex: number) {
  const rafRef = useRef<number>(0)

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

    const startPlayback = () => {
      if (ctx.state === 'suspended') void ctx.resume()
      try {
        osc.start()
      } catch {
        /* already started */
      }
    }

    const onFirstGesture = () => {
      startPlayback()
      window.removeEventListener('pointerdown', onFirstGesture)
    }
    window.addEventListener('pointerdown', onFirstGesture, { passive: true })
    startPlayback()

    const t0 = performance.now()

    const tick = () => {
      const elapsed = performance.now() - t0
      const phase = (elapsed % CLOCK_BREATH_PERIOD_MS) / CLOCK_BREATH_PERIOD_MS
      const breath = breathIntensity01(phase)
      const g = breath * MAX_GAIN
      const now = ctx.currentTime
      gain.gain.setTargetAtTime(g, now, 0.04)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('pointerdown', onFirstGesture)
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
