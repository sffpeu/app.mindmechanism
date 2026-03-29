/**
 * Independent spiral + axis-aligned bounding box word layout (common word-cloud approach;
 * not derived from third-party word cloud libraries).
 */

export interface LayoutMeasureResult {
  width: number
  height: number
}

export interface WordCloudInput {
  id: string
  text: string
  fontSize: number
}

export interface PlacedWordCloudItem {
  id: string
  text: string
  fontSize: number
  /** Center x in layout pixels */
  x: number
  /** Center y in layout pixels */
  y: number
  rotate: number
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

/** Map glossary grade (typically small integers) to a readable font size in px. */
export function fontSizeFromGrade(grade: number): number {
  const g = Number.isFinite(grade) ? grade : 5
  const t = Math.min(10, Math.max(1, g)) / 10
  return Math.round(12 + t * 16)
}

export interface ComputeWordCloudLayoutOptions {
  words: WordCloudInput[]
  width: number
  height: number
  /** Padding between word bounding boxes */
  padding: number
  /** Minimum inset from container edges */
  margin: number
  measure: (text: string, fontSize: number) => LayoutMeasureResult
}

/**
 * Places words along an Archimedean spiral from the center; skips words that cannot be placed.
 */
export function computeWordCloudLayout(options: ComputeWordCloudLayoutOptions): PlacedWordCloudItem[] {
  const { width, height, padding, margin, measure } = options
  if (width <= 0 || height <= 0) return []

  const sorted = [...options.words].sort((a, b) => b.fontSize - a.fontSize || a.text.localeCompare(b.text))
  const placedRects: Rect[] = []
  const result: PlacedWordCloudItem[] = []

  const cx = width / 2
  const cy = height / 2
  const spiralScale = Math.min(width, height) / (2 * Math.PI * 12)
  const maxSteps = Math.min(50000, 8000 + sorted.length * 120)

  for (const w of sorted) {
    const { width: tw, height: th } = measure(w.text, w.fontSize)
    const halfW = tw / 2
    const halfH = th / 2

    let placed = false
    for (let step = 0; step < maxSteps; step++) {
      const t = step * 0.35
      const r = spiralScale * t
      const x = cx + r * Math.cos(t)
      const y = cy + r * Math.sin(t)

      const rect: Rect = {
        left: x - halfW,
        top: y - halfH,
        right: x + halfW,
        bottom: y + halfH,
      }

      const pad = padding / 2
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
        rotate: 0,
        halfW,
        halfH,
      })
      placed = true
      break
    }

    if (!placed) {
      // Word omitted if no slot found (dense clouds)
    }
  }

  return result
}
