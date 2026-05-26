import { getMandalaNodes } from '@/data/mandalaNodes'

/**
 * Return the default focus-node words for a given clock in the requested language.
 * clock_id 0 = wheel 1 (Root), clock_id 8 = wheel 9 (Etheric Heart).
 * Falls back to the hardcoded English list when no localized data exists.
 */
export function getDefaultWordsForClock(clockId: number, language: string): string[] {
  const wheel = clockId + 1 // clock_id is 0-indexed; wheel is 1-indexed
  const nodes = getMandalaNodes(language).filter(n => n.wheel === wheel)
  if (nodes.length > 0) return nodes.map(n => n.term)
  return DEFAULT_WORDS_BY_CLOCK[clockId] ?? []
}

// Default words per clock for "Default" in Assign Words: word 1 = focus node 1, etc. Key = clock id.
export const DEFAULT_WORDS_BY_CLOCK: Record<number, string[]> = {
  0: ['Achievement', 'Willingness', 'Vitality', 'Boldness', 'Insight', 'Command', 'Reflection', 'Illusion'],
  1: ['Union', 'Insightful', 'Sturdiness', 'Modesty', 'Surprise', 'Joyless'], // Sacrol
  2: ['Rampant', 'Causing', 'Salvage', 'Roaring', 'Pretentions', 'Salaciousness', 'Aim', 'Rebirth', 'Exuberance', 'Urge'], // Solar Plexus
  3: ['Balancing', 'Submerging', 'Attracting', 'Curiosity', 'Colliding', 'Concern', 'Fate', 'Overbearing', 'Life force', 'Protecting', 'Triumphing', 'Preening'], // Heart
  4: ['Resonating', 'Immersing', 'Righteous', 'Compulsion', 'Yearning', 'Adapting', 'Fostering', 'Flaunting', 'Advocating', 'Beguiling', 'Crippling', 'Repairing', 'Transforming', 'Suspension', 'Replanting', 'Reprocessing'], // Throat
  5: ['Child-like', 'Unveiling', 'Flight', 'Premonition'], // Third Eye
  6: ['Seeking', 'Idealism', 'Surrendering', 'Bliss', 'Spontaneity', 'Discourse', 'Empathy', 'Righteousness', 'Prayer', 'Majesty', 'Praise', 'Libation', 'Atonement', 'Ceremony', 'Temperance', 'Release'], // Male Crown
  7: ['Infinity', 'Weaving love', 'Vibrating', 'Core centring', 'Purification', 'Stability', 'Kindness', 'Transformation', 'Self love', 'Pure being', 'Limitlessness', 'Contingency', 'Sensual', 'Effort', 'Innovating', 'Heritage'], // Female Crown
  8: ['Father', 'Son', 'Spirit'], // Ethereal Heart
}
