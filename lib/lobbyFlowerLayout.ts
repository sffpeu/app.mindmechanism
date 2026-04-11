import { LOBBY_GROUP_MAX } from '@/lib/lobbyGroups'

/** Pixel offsets from cluster center for lobby satellites (y positive = downward in CSS). */
export function lobbyFlowerOffsets(memberCount: number): { x: number; y: number }[] {
  const n = memberCount
  if (n <= 0) return []
  if (n === 1) return [{ x: 0, y: 0 }]

  if (n === LOBBY_GROUP_MAX) {
    const R = 46
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
