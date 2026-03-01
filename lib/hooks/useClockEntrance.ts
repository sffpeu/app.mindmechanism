'use client'

import { useState, useEffect, useRef } from 'react'

const ENTRANCE_DURATION_MS = 650
const ENTRANCE_START_OFFSET = 90

// Ease-out cubic for smooth deceleration at the end
function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

/**
 * Returns a rotation offset that animates from ENTRANCE_START_OFFSET to 0
 * over ENTRANCE_DURATION_MS when the clock page mounts. Add this to the
 * clock's rotation so the clock "rotates into position" on open.
 */
export function useClockEntrance(): number {
  const [entranceOffset, setEntranceOffset] = useState(ENTRANCE_START_OFFSET)
  const startTime = useRef<number | null>(null)
  const rafId = useRef<number>(0)

  useEffect(() => {
    startTime.current = null

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
    return () => cancelAnimationFrame(rafId.current)
  }, [])

  return entranceOffset
}
