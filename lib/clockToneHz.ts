/**
 * Symbolic Hz values per clock route (0–8). Values are mapped into an audible
 * band for Web Audio (see audibleHzFromClockTone).
 * A tenth value (5,066,997) appeared in the source list; only these nine are used for `/0`–`/8`.
 */
export const CLOCK_TONE_HZ = [
  35_730,
  20_996_928,
  57_996,
  2_551_443,
  62_064,
  35_730,
  21_312,
  38_018,
  88_642,
] as const

/** One minute, matching the clock glow / breathing motion on clock pages */
export const CLOCK_BREATH_PERIOD_MS = 60_000

/**
 * Maps arbitrary positive Hz to ~40–2000 Hz for stable oscillator output
 * (Nyquist-safe, preserves ordering between clocks).
 */
export function audibleHzFromClockTone(raw: number): number {
  const lo = 40
  const hi = 2000
  const logMin = Math.log10(101)
  const logMax = Math.log10(21_000_000)
  const t = (Math.log10(raw + 1) - logMin) / (logMax - logMin)
  const clamped = Math.max(0, Math.min(1, t))
  return lo + clamped * (hi - lo)
}

/** Same envelope as the clock face glow keyframes (times 0, 0.25, 0.5, 0.75, 1) */
export function breathIntensity01(phase01: number): number {
  const times = [0, 0.25, 0.5, 0.75, 1]
  const gains = [0, 0.15, 0.3, 0.15, 0]
  const t = ((phase01 % 1) + 1) % 1
  for (let i = 0; i < times.length - 1; i++) {
    if (t >= times[i] && t <= times[i + 1]) {
      const u = (t - times[i]) / (times[i + 1] - times[i])
      return gains[i] + u * (gains[i + 1] - gains[i])
    }
  }
  return 0
}
