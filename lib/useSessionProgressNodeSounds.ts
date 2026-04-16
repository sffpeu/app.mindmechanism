import { useEffect, useRef } from 'react'

/** Degrees of arc (from progress ring start at 12 o'clock, clockwise) until the ring tip reaches this node. */
function nodeSweepThresholdDeg(index: number, focusNodes: number): number {
  const nodeDeg = ((360 / focusNodes) * index + 270) % 360
  let need = (nodeDeg - 270 + 360) % 360
  if (need < 1e-6) need = 1e-6
  return need
}

/**
 * When a session is active, plays a short sound once each time the session progress ring
 * sweeps past a selected focus node (same geometry as the on-face progress stroke).
 */
export function useSessionProgressNodeSounds(options: {
  sessionProgress: number
  isSessionActive: boolean
  selectedIndices: readonly number[]
  focusNodes: number
  playNodeReach: () => void
}): void {
  const { sessionProgress, isSessionActive, selectedIndices, focusNodes, playNodeReach } = options
  const prevSweepRef = useRef<number | null>(null)
  const playRef = useRef(playNodeReach)
  playRef.current = playNodeReach

  useEffect(() => {
    if (!isSessionActive || focusNodes <= 0) {
      prevSweepRef.current = null
      return
    }

    const currSweep = sessionProgress * 360
    const prevSweep = prevSweepRef.current
    prevSweepRef.current = currSweep

    if (prevSweep === null) return

    for (const idx of selectedIndices) {
      if (idx < 0 || idx >= focusNodes) continue
      const need = nodeSweepThresholdDeg(idx, focusNodes)
      if (prevSweep < need && currSweep >= need - 1e-9) {
        playRef.current()
      }
    }
  }, [sessionProgress, isSessionActive, selectedIndices, focusNodes])
}
