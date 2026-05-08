'use client'

import { useEffect, useState } from 'react'
import { clockSettings } from '@/lib/clockSettings'

/**
 * Returns the current rotation in degrees for a given clock index.
 * Matches the accumulation formula used in the individual clock pages —
 * no modulo, so Framer Motion can interpolate continuously without
 * snapping at ±360 boundaries.
 */
export function useClockRotation(clockId: number): number {
  const clock = clockSettings[clockId]
  const [rotation, setRotation] = useState<number>(0)

  useEffect(() => {
    if (!clock) return
    const { startDateTime, rotationTime, rotationDirection, startingDegree } = clock

    const tick = () => {
      const elapsed = Date.now() - startDateTime.getTime()
      const deg = (elapsed / rotationTime) * 360 + startingDegree
      setRotation(rotationDirection === 'clockwise' ? deg : -deg)
    }

    tick()
    const id = setInterval(tick, 16)
    return () => clearInterval(id)
  }, [clock])

  return rotation
}
