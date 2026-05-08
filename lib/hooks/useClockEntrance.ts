'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const ENTRANCE_DURATION_MS = 650
const ENTRANCE_START_OFFSET = 90

// Ease-out cubic for smooth deceleration at the end
function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

function runSpinAnimation(
  setEntranceOffset: (n: number) => void,
  rafId: React.MutableRefObject<number>,
  startTime: React.MutableRefObject<number | null>
) {
  startTime.current = null
  setEntranceOffset(ENTRANCE_START_OFFSET)

  const tick = (now: number) => {
    if (startTime.current === null) startTime.current = now
    const elapsed = now - startTime.current
    const progress = Math.min(elapsed / ENTRANCE_DURATION_MS, 1)
    const eased = easeOutCubic(progress)
    const offset = ENTRANCE_START_OFFSET * (1 - eased)
    setEntranceOffset(offset)

    if (progress < 1) {
      rafId.current = requestAnimationFrame(tick)
    }
  }

  rafId.current = requestAnimationFrame(tick)
}

/**
 * Returns the current entrance rotation offset and a function to trigger the
 * same spin animation (e.g. on session timer complete). The offset animates
 * from ENTRANCE_START_OFFSET to 0 over ENTRANCE_DURATION_MS.
 */
export function useClockEntrance(): [number, () => void] {
  const [entranceOffset, setEntranceOffset] = useState(ENTRANCE_START_OFFSET)
  const [completeSpinTrigger, setCompleteSpinTrigger] = useState(0)
  const startTime = useRef<number | null>(null)
  const rafId = useRef<number>(0)

  // Initial entrance spin on mount
  useEffect(() => {
    runSpinAnimation(setEntranceOffset, rafId, startTime)
    return () => cancelAnimationFrame(rafId.current)
  }, [])

  // Re-run same spin when triggerCompleteSpin is called (e.g. timer complete)
  useEffect(() => {
    if (completeSpinTrigger === 0) return
    const id = requestAnimationFrame(() => {
      runSpinAnimation(setEntranceOffset, rafId, startTime)
    })
    return () => {
      cancelAnimationFrame(id)
      cancelAnimationFrame(rafId.current)
    }
  }, [completeSpinTrigger])

  const triggerCompleteSpin = useCallback(() => {
    setCompleteSpinTrigger((c) => c + 1)
  }, [])

  return [entranceOffset, triggerCompleteSpin]
}
