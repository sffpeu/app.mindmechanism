/** Display titles for each clock (by clock id index). */
export const clockTitles: readonly string[] = [
  'ROOT',
  'SACRAL',
  'SOLAR PLEXUS',
  'HEART',
  'THROAT',
  'THIRD EYE',
  'MALE CROWN',
  'FEMALE CROWN',
  'ETHERIC HEART'
] as const

export type ClockTitleKey = (typeof clockTitles)[number]
