/** Full cycle: white → wheel color → white (smooth sine). */
export const BREATH_PERIOD_MS = 30_000

const WHITE = { r: 255, g: 255, b: 255 } as const

export type Rgb = { r: number; g: number; b: number }

export type BreathTravel = { rank: number; total: number }

export function parseHexColor(hex: string): Rgb | null {
  let h = hex.trim().replace(/^#/, '')
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (h.length !== 6) return null
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  if ([r, g, b].some((n) => Number.isNaN(n))) return null
  return { r, g, b }
}

function lerpRgb(a: Rgb, b: Rgb, t: number): string {
  const c = (x: number, y: number) => Math.round(x + (y - x) * t)
  return `rgb(${c(a.r, b.r)}, ${c(a.g, b.g)}, ${c(a.b, b.b)})`
}

/**
 * Breathing fill: white ↔ accent over BREATH_PERIOD_MS.
 * When multiple nodes are long-active, `breathTravel` staggers phase so emphasis
 * travels around the wheel (consecutive peaks in time).
 */
export function breathingFillAt(
  nowMs: number,
  accent: Rgb,
  breathTravel: BreathTravel | null | undefined
): string {
  const total = breathTravel && breathTravel.total > 0 ? breathTravel.total : 1
  const rank = breathTravel && breathTravel.total > 0 ? breathTravel.rank : 0
  const phaseTurns = total > 1 ? rank / total : 0
  const θ = (2 * Math.PI * nowMs) / BREATH_PERIOD_MS + 2 * Math.PI * phaseTurns
  const mix = 0.5 + 0.5 * Math.sin(θ)
  return lerpRgb(WHITE, accent, mix)
}
