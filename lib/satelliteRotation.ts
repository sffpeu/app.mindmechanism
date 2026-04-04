/**
 * Human-readable duration for one full satellite revolution.
 * @param rotationTimeMs milliseconds per 360° orbit
 */
export function formatSatelliteRevolutionPeriod(rotationTimeMs: number): string {
  if (!rotationTimeMs || rotationTimeMs <= 0) return '—'
  const totalSeconds = Math.max(1, Math.round(rotationTimeMs / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

/** Angular speed in degrees per second (360° each rotationTimeMs). */
export function satelliteDegreesPerSecond(rotationTimeMs: number): number {
  return (360 * 1000) / rotationTimeMs
}
