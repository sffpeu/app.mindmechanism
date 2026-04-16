'use client'

import { useId, useMemo } from 'react'

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

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!m) return null
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

function lerpRgb(a: string, b: string, t: number): string {
  const A = parseHex(a)
  const B = parseHex(b)
  if (!A || !B) return b
  const u = Math.min(1, Math.max(0, t))
  const r = Math.round(A.r + (B.r - A.r) * u)
  const g = Math.round(A.g + (B.g - A.g) * u)
  const bl = Math.round(A.b + (B.b - A.b) * u)
  return `rgb(${r},${g},${bl})`
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
  className?: string
  /** Single fill when not using letter reveal (default white). */
  textColor?: string
  /** Session-style letter-by-letter fill from base → accent (0–1). Requires `accentColor`. */
  letterRevealProgress?: number
  baseColor?: string
  accentColor?: string
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
  className,
  textColor = '#ffffff',
  letterRevealProgress,
  baseColor = '#ffffff',
  accentColor,
}: CurvedCircleWordLabelProps) {
  const reactId = useId()
  const safeId = reactId.replace(/:/g, '')
  const pathId = `wheel-arc-${safeId}`

  const pathD = useMemo(() => {
    const half = halfSpanDegrees(word)
    const start = centerAngleDeg - half
    const end = centerAngleDeg + half
    return buildCircleArcD(CX, CY, radiusPercent, start, end)
  }, [word, centerAngleDeg, radiusPercent])

  const fs = fontSizeUserUnits(word, isSelected)
  const display = word.trim().toUpperCase()
  const useLetterReveal = accentColor != null && letterRevealProgress != null
  const chars = Array.from(display)
  const letterCount = Math.max(chars.length, 1)
  const p = Math.min(1, Math.max(0, letterRevealProgress ?? 0)) * letterCount

  return (
    <svg
      viewBox="0 0 100 100"
      className={`h-full w-full overflow-visible ${className ?? ''}`}
      style={useLetterReveal ? undefined : { color: textColor }}
      aria-hidden={!interactive}
      role={interactive ? 'presentation' : undefined}
    >
      <defs>
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

      <text
        className="fill-current font-bold uppercase tracking-wide"
        style={{
          fontSize: fs,
          pointerEvents: 'none',
          opacity: isHovered && interactive ? 1 : interactive ? 0.96 : 1,
        }}
      >
        <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle" method="align" spacing="auto">
          {useLetterReveal
            ? chars.map((ch, i) => (
                <tspan key={`${i}-${ch}`} fill={lerpRgb(baseColor, accentColor!, Math.min(1, Math.max(0, p - i)))}>
                  {ch}
                </tspan>
              ))
            : display}
        </textPath>
      </text>
    </svg>
  )
}
