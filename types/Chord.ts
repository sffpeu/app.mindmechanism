/**
 * Word at a focus node with an impact value from -5 (negative) to +5 (positive).
 * Used to drive chord diagram density and coloring.
 */
export interface FocusWordWithValue {
  word: string
  /** Impact value from -5 (negative) to +5 (positive). 0 = neutral. */
  value: number
  /** Index of the focus node (0 .. focusNodes-1) this word belongs to. */
  nodeIndex: number
}

/** Sentiment band for coloring: positive, neutral, or negative. */
export type SentimentBand = 'positive' | 'neutral' | 'negative'

/** Maps a numeric value (-5..5) to a sentiment band. */
export function getSentimentBand(value: number): SentimentBand {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}

/** Converts GlossaryWord grade (1-5) and rating ('+','-','~') to value in [-5, 5]. */
export function wordRatingToValue(grade: number, rating: '+' | '-' | '~'): number {
  if (rating === '+') return Math.min(5, Math.max(1, grade))
  if (rating === '-') return Math.max(-5, Math.min(-1, -grade))
  return 0
}
