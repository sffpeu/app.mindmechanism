/** Nine single-clock faces (indices 0–8 = clocks 1–9). Stored on `users/{uid}.wheelFaceOverlays`. */

export type WheelFaceMediaType = 'image' | 'video'

export interface WheelFaceMedia {
  type: WheelFaceMediaType
  url: string
}

export const WHEEL_FACE_COUNT = 9

export function emptyWheelFaceOverlays(): WheelFaceMedia[] {
  return Array.from({ length: WHEEL_FACE_COUNT }, () => ({ type: 'image' as WheelFaceMediaType, url: '' }))
}

export function normalizeWheelFaceOverlays(input: unknown): WheelFaceMedia[] {
  const out = emptyWheelFaceOverlays()
  if (!Array.isArray(input)) return out
  for (let i = 0; i < WHEEL_FACE_COUNT; i++) {
    const v = input[i]
    if (!v) continue
    if (typeof v === 'string') {
      // Backward compatibility: existing entries were plain image URLs
      out[i] = { type: 'image', url: v }
    } else if (typeof v === 'object' && 'url' in v && typeof (v as { url: unknown }).url === 'string') {
      const obj = v as { type?: unknown; url: string }
      out[i] = {
        type: obj.type === 'video' ? 'video' : 'image',
        url: obj.url,
      }
    }
  }
  return out
}
