/**
 * Independent spiral + bounding-box word layout (common word-cloud approach;
 * not derived from third-party word cloud libraries). Supports per-word rotation
 * using axis-aligned bounds of the rotated rectangle (cf. spiral + collision in
 * tools like [d3-cloud](https://github.com/jasondavies/d3-cloud)).
 */

export interface LayoutMeasureResult {
  width: number
  height: number
}

export interface WordCloudInput {
  id: string
  text: string
  fontSize: number
  /** Degrees, e.g. from rotationDegreesFromId (d3-style 30° steps). */
  rotate: number
}

export interface PlacedWordCloudItem {
  id: string
  text: string
  fontSize: number
  x: number
  y: number
  rotate: number
  /** Axis-aligned half-extents used for collision and hit-testing (includes rotation). */
  halfW: number
  halfH: number
}

interface Rect {
  left: number
  top: number
  right: number
  bottom: number
}

function intersects(a: Rect, b: Rect): boolean {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom)
}

function inBounds(r: Rect, width: number, height: number, margin: number): boolean {
  return (
    r.left >= margin &&
    r.top >= margin &&
    r.right <= width - margin &&
    r.bottom <= height - margin
  )
}

/** Stable pseudo-random in [0, 1) from a string (layout stable across re-renders). */
export function hash01(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967296
}

/**
 * d3-cloud default style: (~~(random() * 6) - 3) * 30 → -90, -60, -30, 0, 30, 60.
 */
export function rotationDegreesFromId(id: string): number {
  const r = hash01(`rot:${id}`)
  const k = Math.floor(r * 6) - 3
  return k * 30
}

/**
 * Varying font size: sqrt(grade) weighting, length damping, stable jitter.
 * Mirrors the idea of fontSize ∝ sqrt(value) from typical word clouds.
 */
export function fontSizeForCloud(grade: number, id: string, text: string): number {
  const g = Math.min(10, Math.max(1, Number.isFinite(grade) ? grade : 5))
  const sqrtPart = Math.sqrt(g)
  const len = Math.max(1, text.length)
  const lengthDamp = 1 / Math.pow(len, 0.2)
  const base = (9 + sqrtPart * 7.5) * lengthDamp
  const jitter = 0.82 + hash01(`sz:${id}`) * 0.36
  return Math.round(Math.min(42, Math.max(10, base * jitter)))
}

/** Linear grade → size (legacy); prefer fontSizeForCloud for word clouds. */
export function fontSizeFromGrade(grade: number): number {
  const g = Math.min(10, Math.max(1, Number.isFinite(grade) ? grade : 5))
  return Math.round(12 + (g / 10) * 16)
}

/** Half-width/half-height of axis-aligned box that contains the text rect rotated by `deg`. */
function rotatedAabbHalfExtents(halfW: number, halfH: number, deg: number): { hw: number; hh: number } {
  const rad = (deg * Math.PI) / 180
  const c = Math.abs(Math.cos(rad))
  const s = Math.abs(Math.sin(rad))
  return {
    hw: halfW * c + halfH * s,
    hh: halfW * s + halfH * c,
  }
}

export interface ComputeWordCloudLayoutOptions {
  words: WordCloudInput[]
  width: number
  height: number
  padding: number
  margin: number
  measure: (text: string, fontSize: number) => LayoutMeasureResult
}

/**
 * Archimedean spiral from center; per-word rotation via expanded AABB collision.
 */
export function computeWordCloudLayout(options: ComputeWordCloudLayoutOptions): PlacedWordCloudItem[] {
  const { width, height, padding, margin, measure } = options
  if (width <= 0 || height <= 0) return []

  const sorted = [...options.words].sort(
    (a, b) => b.fontSize - a.fontSize || a.text.localeCompare(b.text)
  )
  const placedRects: Rect[] = []
  const result: PlacedWordCloudItem[] = []

  const cx = width / 2
  const cy = height / 2
  const spiralScale = Math.min(width, height) / (2 * Math.PI * 10)
  const maxSteps = Math.min(60000, 10000 + sorted.length * 140)
  const pad = padding / 2

  for (const w of sorted) {
    const { width: tw, height: th } = measure(w.text, w.fontSize)
    const textHalfW = tw / 2
    const textHalfH = th / 2
    const { hw: aabbHalfW, hh: aabbHalfH } = rotatedAabbHalfExtents(textHalfW, textHalfH, w.rotate)

    const spiralSign = hash01(`dir:${w.id}`) < 0.5 ? 1 : -1

    let placed = false
    for (let step = 0; step < maxSteps; step++) {
      const u = step * 0.32
      const rSpiral = spiralScale * u
      const t = spiralSign * u
      const x = cx + rSpiral * Math.cos(t)
      const y = cy + rSpiral * Math.sin(t)

      const rect: Rect = {
        left: x - aabbHalfW,
        top: y - aabbHalfH,
        right: x + aabbHalfW,
        bottom: y + aabbHalfH,
      }

      const expanded: Rect = {
        left: rect.left - pad,
        top: rect.top - pad,
        right: rect.right + pad,
        bottom: rect.bottom + pad,
      }

      if (!inBounds(expanded, width, height, margin)) continue

      let hit = false
      for (const pr of placedRects) {
        const other: Rect = {
          left: pr.left - pad,
          top: pr.top - pad,
          right: pr.right + pad,
          bottom: pr.bottom + pad,
        }
        if (intersects(expanded, other)) {
          hit = true
          break
        }
      }
      if (hit) continue

      placedRects.push(rect)
      result.push({
        id: w.id,
        text: w.text,
        fontSize: w.fontSize,
        x,
        y,
        rotate: w.rotate,
        halfW: aabbHalfW,
        halfH: aabbHalfH,
      })
      placed = true
      break
    }
  }

  return result
}
