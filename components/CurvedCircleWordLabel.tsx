'use client'

import { useId, useMemo } from 'react'
import { motion } from 'framer-motion'

const CX = 50
const CY = 50

/** Same polar convention as wheel nodes: 0° = 3 o'clock, angles increase clockwise on screen. */
function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

/**
 * Short circular arc from startDeg → endDeg on circle (cx,cy,r), for SVG textPath.
 */
export function buildCircleArcD(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const p1 = polar(cx, cy, r, startDeg)
  const p2 = polar(cx, cy, r, endDeg)
  let delta = endDeg - startDeg
  while (delta > 180) delta -= 360
  while (delta < -180) delta += 360
  const largeArc = Math.abs(delta) > 180 ? 1 : 0
  const sweep = delta >= 0 ? 1 : 0
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${p2.x} ${p2.y}`
}

function halfSpanDegrees(word: string): number {
  const len = Math.max(word.trim().length, 1)
  return Math.min(6 + len * 2.6, 52)
}

function fontSizeUserUnits(word: string, isSelected: boolean): number {
  const len = Math.max(word.trim().length, 1)
  const base = Math.max(1.55, Math.min(2.85, 3.15 - len * 0.055))
  return isSelected ? base * 1.06 : base
}

export type CurvedCircleWordLabelProps = {
  word: string
  /** Polar angle (degrees) of the label’s center on the wheel. */
  centerAngleDeg: number
  /** Radius in the same 0–100 coordinate system as node placement (e.g. 60). */
  radiusPercent: number
  isSelected?: boolean
  /** When set, arc is clickable (wide transparent stroke for hit-testing). */
  interactive?: boolean
  onActivate?: (e: React.MouseEvent) => void
  isHovered?: boolean
  onHoverIn?: () => void
  onHoverOut?: () => void
  /** Gentle opacity pulse when this node has stayed selected longer than the page threshold (e.g. 1 min). */
  longActivePulse?: boolean
  className?: string
}

/**
 * Renders a single word along a short arc of the wheel’s circle (same viewBox 0–100 as clocks).
 * Parent should be `absolute inset-0` over the rotating wheel so coordinates match node math.
 */
export function CurvedCircleWordLabel({
  word,
  centerAngleDeg,
  radiusPercent,
  isSelected = false,
  interactive = false,
  onActivate,
  isHovered = false,
  onHoverIn,
  onHoverOut,
  longActivePulse = false,
  className,
}: CurvedCircleWordLabelProps) {
  const reactId = useId()
  const safeId = reactId.replace(/:/g, '')
  const pathId = `wheel-arc-${safeId}`
  const filterId = `wheel-sh-${safeId}`

  const pathD = useMemo(() => {
    const half = halfSpanDegrees(word)
    const start = centerAngleDeg - half
    const end = centerAngleDeg + half
    return buildCircleArcD(CX, CY, radiusPercent, start, end)
  }, [word, centerAngleDeg, radiusPercent])

  const fs = fontSizeUserUnits(word, isSelected)
  const display = word.trim().toUpperCase()

  return (
    <svg
      viewBox="0 0 100 100"
      className={`h-full w-full overflow-visible text-black dark:text-white ${className ?? ''}`}
      aria-hidden={!interactive}
      role={interactive ? 'presentation' : undefined}
    >
      <defs>
        <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0.4" stdDeviation="0.45" floodColor="white" floodOpacity="0.85" />
          <feDropShadow dx="0" dy="0.6" stdDeviation="0.9" floodColor="black" floodOpacity="0.35" />
        </filter>
        <path id={pathId} d={pathD} fill="none" />
      </defs>

      {interactive && (
        <path
          d={pathD}
          fill="none"
          stroke="transparent"
          strokeWidth={9}
          strokeLinecap="round"
          className="cursor-pointer"
          style={{ pointerEvents: 'stroke' }}
          onClick={(e) => {
            e.stopPropagation()
            onActivate?.(e)
          }}
          onMouseEnter={onHoverIn}
          onMouseLeave={onHoverOut}
        />
      )}

      <motion.text
        filter={`url(#${filterId})`}
        className="fill-current font-bold uppercase tracking-wide"
        style={{
          fontSize: fs,
          pointerEvents: 'none',
        }}
        animate={
          longActivePulse
            ? { opacity: [0.82, 1, 0.82] }
            : { opacity: isHovered && interactive ? 1 : interactive ? 0.96 : 1 }
        }
        transition={
          longActivePulse
            ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.2 }
        }
      >
        <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle" method="align" spacing="auto">
          {display}
        </textPath>
      </motion.text>
    </svg>
  )
}
