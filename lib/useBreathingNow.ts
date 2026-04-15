'use client'

import { useEffect, useState } from 'react'

/** Monotonic clock for smooth breathing animations (does not tick when disabled). */
export function useBreathingNow(enabled: boolean, intervalMs = 80): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!enabled) return
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [enabled, intervalMs])

  return now
}
