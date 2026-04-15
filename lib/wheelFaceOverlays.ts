/** Nine single-clock faces (indices 0–8 = clocks 1–9). Stored on `users/{uid}.wheelFaceOverlays`. */

export const WHEEL_FACE_COUNT = 9

export function emptyWheelFaceOverlays(): string[] {
  return Array.from({ length: WHEEL_FACE_COUNT }, () => '')
}

export function normalizeWheelFaceOverlays(input: unknown): string[] {
  const out = emptyWheelFaceOverlays()
  if (!Array.isArray(input)) return out
  for (let i = 0; i < WHEEL_FACE_COUNT; i++) {
    const v = input[i]
    out[i] = typeof v === 'string' ? v : ''
  }
  return out
}
