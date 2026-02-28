/** Display titles for each clock (by clock id index). */
export const clockTitles: readonly string[] = [
  'ROOT',
  'SACROL',
  'SOLAR PLEXUS',
  'HEART',
  'THROAT',
  'THIRD EYE',
  'MALE CROWN',
  'FEMALE CROWN',
  'ETHERAL HEART'
] as const

export type ClockTitleKey = (typeof clockTitles)[number]
