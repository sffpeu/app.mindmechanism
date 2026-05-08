'use client'

import { useMemo } from 'react'

// Radius at edge of viewBox so path sits outside focus nodes
const PATH_RADIUS = 50

interface SessionProgressRingProps {
  remainingTime: number | null
  initialDuration: number | null
  isPaused: boolean
  /** Number of focus nodes — path connects these points in order. */
  focusNodes: number
  /** Angle in degrees for the first focus node (index 0). Matches clock's startingDegree + offset. */
  startingAngle?: number
  /** Rotate the path to stay aligned with the clock (e.g. pass same rotation as focus nodes layer). */
  rotation?: number
  /** Clock color for the stroke. Defaults to blue. */
  color?: string
  className?: string
}

function getPolygonPath(focusNodes: number, startingAngle: number): string {
  if (focusNodes < 2) return ''
  const points: Array<{ x: number; y: number }> = []
  for (let i = 0; i < focusNodes; i++) {
    const angleDeg = (360 / focusNodes) * i + startingAngle
    const rad = (angleDeg * Math.PI) / 180
    const x = 50 + PATH_RADIUS * Math.cos(rad)
    const y = 50 + PATH_RADIUS * Math.sin(rad)
    points.push({ x, y })
  }
  const [first, ...rest] = points
  const path = rest.reduce((acc, p) => `${acc} L ${p.x} ${p.y}`, `M ${first.x} ${first.y}`)
  return `${path} Z`
}

/** Perimeter of regular polygon with n sides and radius r. */
function polygonLength(n: number, r: number): number {
  if (n < 2) return 0
  return n * 2 * r * Math.sin(Math.PI / n)
}

export function SessionProgressRing({
  remainingTime,
  initialDuration,
  isPaused,
  focusNodes,
  startingAngle = 0,
  rotation = 0,
  color = '#156fde',
  className = ''
}: SessionProgressRingProps) {
  const progress = useMemo(() => {
    if (remainingTime == null || initialDuration == null || initialDuration <= 0) return 0
    const elapsed = Math.max(0, initialDuration - remainingTime)
    return Math.min(1, elapsed / initialDuration)
  }, [remainingTime, initialDuration])

  const pathD = useMemo(
    () => getPolygonPath(focusNodes, startingAngle),
    [focusNodes, startingAngle]
  )
  const totalLength = useMemo(
    () => polygonLength(focusNodes, PATH_RADIUS),
    [focusNodes]
  )

  if (remainingTime == null || initialDuration == null || pathD === '') return null

  const dash = progress * totalLength

  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      aria-hidden
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        <g transform={`rotate(${rotation} 50 50)`}>
          {/* Track: full polygon, faint */}
          <path
            d={pathD}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            className="text-black/10 dark:text-white/10"
          />
          {/* Progress: starts at first focus node, follows path as timer runs */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeDasharray={`${dash} ${totalLength}`}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-[stroke-dasharray] duration-[150ms] ease-linear"
            style={{ opacity: isPaused ? 0.7 : 0.9 }}
          />
        </g>
      </svg>
    </div>
  )
}
