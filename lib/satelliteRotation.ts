/**
 * Duration for one full satellite revolution. Under 1 hour: total seconds (e.g. 60s); 1h+: h/m/s.
 * @param rotationTimeMs milliseconds per 360° orbit
 */
export function formatSatelliteRevolutionPeriod(rotationTimeMs: number): string {
  if (!rotationTimeMs || rotationTimeMs <= 0) return '—'
  const totalSeconds = Math.max(1, Math.round(rotationTimeMs / 1000))
  if (totalSeconds < 3600) {
    return `${totalSeconds}s`
  }
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${h}h ${m}m ${s}s`
}
