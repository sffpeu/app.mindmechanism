import type { CSSProperties } from 'react'

/**
 * Place a label on a circular path using the same angle convention as the wheel nodes:
 * `angleDeg` in degrees where `x = 50 + r*cos(θ)`, `y = 50 + r*sin(θ)` (0° = 3 o'clock).
 * The text rotates so its baseline follows the clockwise tangent (labels “orbit” the face).
 */
export function tangentialWheelWordPosition(
  angleDeg: number,
  radiusPercent: number,
  opts?: { isSelected?: boolean; zIndex?: number }
): CSSProperties {
  const r = radiusPercent
  const rad = (angleDeg * Math.PI) / 180
  const x = 50 + r * Math.cos(rad)
  const y = 50 + r * Math.sin(rad)
  const scale = opts?.isSelected ? 1.08 : 1
  return {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    transform: `translate(-50%, -50%) rotate(${angleDeg + 90}deg) scale(${scale})`,
    transformOrigin: 'center center',
    zIndex: opts?.zIndex ?? 900,
  }
}
