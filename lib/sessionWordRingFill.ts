/**
 * Maps session progress (0–1) to fill progress for one focus node’s word, so it matches
 * the clock’s session ring: the ring starts at 12 o’clock and grows clockwise; each
 * node’s word fills during that node’s angular sector (even spacing by index).
 */
export function wordProgressAlongProgressRing(
  sessionProgress01: number,
  nodeIndex: number,
  focusNodesCount: number,
  sessionActive: boolean
): number {
  if (!sessionActive || focusNodesCount <= 0) return 0
  const p = Math.min(1, Math.max(0, sessionProgress01))
  const sweepDeg = p * 360
  const sectorDeg = 360 / focusNodesCount
  const sectorStartDeg = (360 * nodeIndex) / focusNodesCount
  return Math.min(1, Math.max(0, (sweepDeg - sectorStartDeg) / sectorDeg))
}
