import { LOBBY_GROUP_MAX } from '@/lib/lobbyGroups'

/** Pixel offsets from cluster center for lobby satellites (y positive = downward in CSS). */
export function lobbyFlowerOffsets(
  memberCount: number,
  memberCap: number = LOBBY_GROUP_MAX
): { x: number; y: number }[] {
  const n = memberCount
  const cap = memberCap > 0 ? memberCap : LOBBY_GROUP_MAX
  if (n <= 0) return []
  if (n === 1) return [{ x: 0, y: 0 }]

  const atCapacity = n >= 2 && n === cap
  if (atCapacity) {
    const R = n > 36 ? 40 : 46
    return Array.from({ length: n }, (_, i) => {
      const t = (2 * Math.PI * i) / n - Math.PI / 2
      return { x: Math.cos(t) * R, y: Math.sin(t) * R }
    })
  }

  if (n <= 3) {
    const R = 34
    return Array.from({ length: n }, (_, i) => {
      const t = (2 * Math.PI * i) / n - Math.PI / 2
      return { x: Math.cos(t) * R, y: Math.sin(t) * R }
    })
  }

  const R = 48
  const r = 28
  return Array.from({ length: n }, (_, i) => {
    const t = (2 * Math.PI * i) / n - Math.PI / 2
    const rad = i % 2 === 0 ? R : r
    return { x: Math.cos(t) * rad, y: Math.sin(t) * rad }
  })
}
