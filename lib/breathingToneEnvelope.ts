/** Shared ~60s breathing “sound check” + ramp envelope for clock / pair / trio tones */

export const FREQ_FADE_IN_S = 3.5

export const SOUND_CHECK_MS = 2200
export const LEVEL_RAMP_MS = 5200
export const START_LEVEL = 0.028
export const SOUND_CHECK_END_LEVEL = 0.11

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

export function masterLevelMult(elapsed: number): number {
  if (elapsed < SOUND_CHECK_MS) {
    return START_LEVEL + (SOUND_CHECK_END_LEVEL - START_LEVEL) * (elapsed / SOUND_CHECK_MS)
  }
  const rampEnd = SOUND_CHECK_MS + LEVEL_RAMP_MS
  if (elapsed < rampEnd) {
    const u = (elapsed - SOUND_CHECK_MS) / LEVEL_RAMP_MS
    return SOUND_CHECK_END_LEVEL + (1 - SOUND_CHECK_END_LEVEL) * easeOutCubic(u)
  }
  return 1
}
