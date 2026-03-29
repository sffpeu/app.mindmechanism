'use client'

import { useClockBreathingTone } from '@/lib/hooks/useClockBreathingTone'

/** Invisible: starts per-clock breathing tone on clock pages `/0`–`/8`. */
export function ClockBreathingTone({ clockIndex }: { clockIndex: number }) {
  useClockBreathingTone(clockIndex)
  return null
}
