'use client'

import { useEffect, useRef } from 'react'

type Args = {
  sessionProgress: number
  isSessionActive: boolean
  selectedIndices: readonly number[]
  focusNodes: number
  playNodeReach?: () => void
}

/**
 * Plays a short cue when the session progress sweep enters a focus-node sector,
 * only for sectors whose node is currently selected.
 */
export function useSessionProgressNodeSounds({
  sessionProgress,
  isSessionActive,
  selectedIndices,
  focusNodes,
  playNodeReach,
}: Args) {
  const prevRef = useRef(-1)
  const playRef = useRef(playNodeReach)
  playRef.current = playNodeReach

  const selectedKey = [...selectedIndices].sort((a, b) => a - b).join(',')

  useEffect(() => {
    if (!isSessionActive || focusNodes <= 0 || !playRef.current) {
      prevRef.current = -1
      return
    }

    const prev = prevRef.current
    const curr = sessionProgress
    const selected = new Set(selectedIndices)

    for (let i = 0; i < focusNodes; i++) {
      if (!selected.has(i)) continue
      const t = i / focusNodes
      if (prev < t && curr >= t) {
        playRef.current()
      }
    }

    prevRef.current = curr
  }, [sessionProgress, isSessionActive, focusNodes, selectedKey])
}
