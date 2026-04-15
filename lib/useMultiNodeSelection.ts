'use client'

import { useCallback, useEffect, useState } from 'react'

const TICK_MS = 4000
const DEFAULT_PULSE_AFTER_MS = 60_000

/**
 * Toggle multiple focus nodes on wheel pages; tracks when each index was selected
 * so labels can pulse after `pulseAfterMs` (default 1 minute).
 */
export function useMultiNodeSelection(pulseAfterMs: number = DEFAULT_PULSE_AFTER_MS) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [selectedAt, setSelectedAt] = useState<Record<number, number>>({})
  const [pulseTick, setPulseTick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setPulseTick((n) => n + 1), TICK_MS)
    return () => clearInterval(id)
  }, [])

  const toggleNode = useCallback((index: number) => {
    setSelectedIndices((prev) => {
      if (prev.includes(index)) {
        setSelectedAt((a) => {
          const next = { ...a }
          delete next[index]
          return next
        })
        return prev.filter((x) => x !== index)
      }
      setSelectedAt((a) => ({ ...a, [index]: Date.now() }))
      return [...prev, index].sort((a, b) => a - b)
    })
  }, [])

  const isNodeSelected = useCallback(
    (index: number) => selectedIndices.includes(index),
    [selectedIndices]
  )

  const shouldLongPulse = useCallback(
    (index: number) => {
      void pulseTick
      const t = selectedAt[index]
      if (t == null) return false
      return Date.now() - t >= pulseAfterMs
    },
    [selectedAt, pulseAfterMs, pulseTick]
  )

  return { toggleNode, isNodeSelected, shouldLongPulse }
}
