'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { decodeDroneSample } from '@/lib/droneSample'
import { CLOCK_TONE_HZ, audibleHzFromClockTone } from '@/lib/clockToneHz'
import { useSettings } from '@/lib/hooks/useSettings'
import type { Sequence } from '@/lib/sequencer'

const ATTACK_SEC = 0.01
const RELEASE_SEC = 0.05

type ActiveNode = {
  source: AudioBufferSourceNode | OscillatorNode
  gain: GainNode
}

export function useSequencerAudio(sequence: Sequence) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)

  const rafRef = useRef<number | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const droneBuffersRef = useRef<Array<AudioBuffer | null>>(Array.from({ length: 9 }, () => null))
  const activeNodesRef = useRef<ActiveNode[]>([])
  const startedAtRef = useRef(0)
  const lastStepRef = useRef(-1)
  const sequenceRef = useRef(sequence)

  const tonesEnabled = useSettings((s) => s.tonesEnabled)
  const toneVolume = useSettings((s) => s.toneVolume)
  const toneMode = useSettings((s) => s.toneMode)

  useEffect(() => {
    sequenceRef.current = sequence
  }, [sequence])

  const stopAllNodes = useCallback(() => {
    activeNodesRef.current.forEach(({ source, gain }) => {
      try {
        gain.gain.cancelScheduledValues(0)
        gain.gain.setValueAtTime(0.0001, ctxRef.current?.currentTime ?? 0)
      } catch {
        /* noop */
      }
      try {
        source.stop()
      } catch {
        /* already stopped */
      }
      try {
        source.disconnect()
        gain.disconnect()
      } catch {
        /* noop */
      }
    })
    activeNodesRef.current = []
  }, [])

  const ensureContext = useCallback(async () => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
    }
    if (ctxRef.current.state === 'suspended') {
      await ctxRef.current.resume().catch(() => undefined)
    }
    return ctxRef.current
  }, [])

  const preloadDroneBuffers = useCallback(async (ctx: AudioContext) => {
    const missingIndices = Array.from({ length: 9 }, (_, i) => i).filter(
      (i) => !droneBuffersRef.current[i]
    )
    if (!missingIndices.length) return

    await Promise.all(
      missingIndices.map(async (i) => {
        const buf = await decodeDroneSample(ctx, i, () => false)
        droneBuffersRef.current[i] = buf
      })
    )
  }, [])

  const stepDurationSec = useMemo(() => 60 / Math.max(40, sequence.bpm), [sequence.bpm])

  const fireStep = useCallback(
    async (stepIndex: number) => {
      const ctx = await ensureContext()
      const seq = sequenceRef.current
      const step = seq.steps[stepIndex]
      if (!step || !step.active || step.nodeIndex == null) return
      if (!tonesEnabled) return

      const now = ctx.currentTime
      const holdFor = stepDurationSec * step.durationMultiplier
      const end = now + holdFor
      const g = ctx.createGain()
      g.gain.setValueAtTime(0.0001, now)
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, toneVolume), now + ATTACK_SEC)
      g.gain.setValueAtTime(Math.max(0.0002, toneVolume), Math.max(now + ATTACK_SEC, end - RELEASE_SEC))
      g.gain.exponentialRampToValueAtTime(0.0001, end)
      g.connect(ctx.destination)

      if (toneMode === 'drone') {
        await preloadDroneBuffers(ctx)
        const buffer = droneBuffersRef.current[step.nodeIndex]
        if (!buffer) return
        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.connect(g)
        source.start(now)
        source.stop(end + 0.01)
        activeNodesRef.current.push({ source, gain: g })
        return
      }

      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(
        audibleHzFromClockTone(CLOCK_TONE_HZ[step.nodeIndex] ?? CLOCK_TONE_HZ[0]),
        now
      )
      osc.connect(g)
      osc.start(now)
      osc.stop(end + 0.01)
      activeNodesRef.current.push({ source: osc, gain: g })
    },
    [ensureContext, preloadDroneBuffers, stepDurationSec, toneMode, toneVolume, tonesEnabled]
  )

  const pause = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    stopAllNodes()
    setIsPlaying(false)
  }, [stopAllNodes])

  const stop = useCallback(() => {
    pause()
    setCurrentStepIndex(-1)
    lastStepRef.current = -1
    startedAtRef.current = 0
  }, [pause])

  const tick = useCallback(async () => {
    const seq = sequenceRef.current
    const total = seq.steps.length
    if (!total) {
      stop()
      return
    }

    const elapsedSec = (performance.now() - startedAtRef.current) / 1000
    const idx = Math.floor(elapsedSec / stepDurationSec)

    if (idx !== lastStepRef.current) {
      if (idx >= total) {
        if (seq.loop) {
          startedAtRef.current = performance.now()
          lastStepRef.current = -1
          setCurrentStepIndex(0)
          await fireStep(0)
        } else {
          stop()
          return
        }
      } else {
        lastStepRef.current = idx
        setCurrentStepIndex(idx)
        await fireStep(idx)
      }
    }

    rafRef.current = requestAnimationFrame(() => {
      void tick()
    })
  }, [fireStep, stepDurationSec, stop])

  const play = useCallback(async () => {
    if (isPlaying) return
    await ensureContext()
    stopAllNodes()
    setIsPlaying(true)
    if (currentStepIndex < 0) {
      setCurrentStepIndex(0)
      lastStepRef.current = -1
      startedAtRef.current = performance.now()
    } else {
      startedAtRef.current = performance.now() - currentStepIndex * stepDurationSec * 1000
      lastStepRef.current = currentStepIndex - 1
    }
    rafRef.current = requestAnimationFrame(() => {
      void tick()
    })
  }, [currentStepIndex, ensureContext, isPlaying, stepDurationSec, stopAllNodes, tick])

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      stopAllNodes()
      if (ctxRef.current) {
        void ctxRef.current.close().catch(() => undefined)
        ctxRef.current = null
      }
    }
  }, [stopAllNodes])

  return {
    play,
    pause,
    stop,
    currentStepIndex,
    isPlaying,
  }
}
