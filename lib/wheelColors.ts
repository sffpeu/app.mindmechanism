/**
 * Prescribed display hex for the nine somatic wheels (Mind Mechanism clock).
 *
 * Wheel numbers in deck / node data are **1–9** (Root … Ehteric heart).
 * Clock / glossary indices are **0–8** — same order: index = wheel − 1.
 *
 * 1. Root           #fd290a
 * 2. Sacral         #fba63b
 * 3. Solar plexus   #f7da5f
 * 4. Heart          #6dc037
 * 5. Throat         #156fde
 * 6. Third eye      #941952
 * 7. Male crown     #541b96
 * 8. Female crown   #ee5fa7
 * 9. Ehteric heart  #56c1ff
 */
export const WHEEL_HEX = [
  '#fd290a',
  '#fba63b',
  '#f7da5f',
  '#6dc037',
  '#156fde',
  '#941952',
  '#541b96',
  '#ee5fa7',
  '#56c1ff',
] as const

export type WheelHex = (typeof WHEEL_HEX)[number]

/** Glossary / session clock id 0–8 → hex */
export function clockIdToHex(clockId: number): WheelHex | undefined {
  if (clockId < 0 || clockId >= WHEEL_HEX.length) return undefined
  return WHEEL_HEX[clockId]
}

/** Deck wheel number 1–9 → hex */
export function wheelNumberToHex(wheel: number): WheelHex | undefined {
  if (wheel < 1 || wheel > WHEEL_HEX.length) return undefined
  return WHEEL_HEX[wheel - 1]
}
