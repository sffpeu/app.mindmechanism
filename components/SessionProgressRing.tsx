'use client'

import { useMemo } from 'react'

const RING_RADIUS = 48 // viewBox 0 0 100 100; same as set-duration viz
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

interface SessionProgressRingProps {
  remainingTime: number | null
  initialDuration: number | null
  isPaused: boolean
  /** Clock color for the ring (e.g. hex or Tailwind color). Defaults to blue. */
  color?: string
  /** Size as a fraction of the container (e.g. 1 = full). Ring is drawn outside focus nodes (r=48 ≈ 96% of 50). */
  className?: string
}

export function SessionProgressRing({
  remainingTime,
  initialDuration,
  isPaused,
  color = '#156fde',
  className = ''
}: SessionProgressRingProps) {
  const progress = useMemo(() => {
    if (remainingTime == null || initialDuration == null || initialDuration <= 0) return 0
    const elapsed = Math.max(0, initialDuration - remainingTime)
    return Math.min(1, elapsed / initialDuration)
  }, [remainingTime, initialDuration])

  if (remainingTime == null || initialDuration == null) return null

  const dash = progress * CIRCUMFERENCE

  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      aria-hidden
    >
      <svg
        className="absolute inset-0 w-full h-full -rotate-90"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Track circle (full ring, faint) */}
        <circle
          cx="50"
          cy="50"
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-black/10 dark:text-white/10"
        />
        {/* Progress arc — fills as session runs; stops when paused */}
        <circle
          cx="50"
          cy="50"
          r={RING_RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
          strokeLinecap="round"
          className="transition-[stroke-dasharray] duration-1000 ease-linear"
          style={{ opacity: isPaused ? 0.7 : 0.9 }}
        />
      </svg>
    </div>
  )
}
