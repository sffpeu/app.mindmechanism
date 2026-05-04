/** Planet drone samples — one per clock index (0–8). Served from `/public/mm_tones/`. */

export const MM_DRONE_PATH = (clockIndex: number) =>
  `/mm_tones/drone_${Math.max(0, Math.min(8, clockIndex))}.m4a`

/** Short labels matching the imported scale recordings */
export const MM_DRONE_PLANET_LABELS: readonly string[] = [
  'Saturn',
  'Neptune',
  'Mars',
  'Venus',
  'Mercury',
  'Uranus',
  'Jupiter (F♯)',
  'Jupiter (A♯)',
  'Earth',
] as const
