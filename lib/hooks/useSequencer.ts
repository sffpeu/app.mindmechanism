'use client'

import { useMemo, useState } from 'react'
import {
  type DurationMultiplier,
  type NodeIndex,
  type Sequence,
  type StepCount,
  distributeSyllables,
  makeDefaultSequence,
  makeEmptyStep,
  parseMantraSyllables,
} from '@/lib/sequencer'

function clampBpm(bpm: number): number {
  return Math.max(40, Math.min(180, Math.round(bpm)))
}

function resizeSteps(prevSteps: Sequence['steps'], nextCount: StepCount): Sequence['steps'] {
  const out = prevSteps.slice(0, nextCount)
  while (out.length < nextCount) out.push(makeEmptyStep(`step-${out.length}`))
  return out
}

export function useSequencer(userId: string | null) {
  const [sequence, setSequence] = useState<Sequence>(() => makeDefaultSequence(userId ?? 'anonymous'))
  const [isDirty, setIsDirty] = useState(false)

  const syllables = useMemo(
    () => parseMantraSyllables(sequence.mantraText),
    [sequence.mantraText]
  )

  const overflow = useMemo(() => {
    const { overflow: nextOverflow } = distributeSyllables(syllables, sequence.steps)
    return nextOverflow
  }, [syllables, sequence.steps])

  const recalcSyllables = (next: Sequence): Sequence => {
    const parsed = parseMantraSyllables(next.mantraText)
    const { mappings } = distributeSyllables(parsed, next.steps)
    return { ...next, syllables: mappings }
  }

  const mutate = (updater: (prev: Sequence) => Sequence) => {
    setSequence((prev) => {
      const next = recalcSyllables({
        ...updater(prev),
        updatedAt: Date.now(),
      })
      return next
    })
    setIsDirty(true)
  }

  const setTitle = (title: string) => mutate((prev) => ({ ...prev, title }))

  const toggleStep = (stepId: string) =>
    mutate((prev) => ({
      ...prev,
      steps: prev.steps.map((s) =>
        s.id === stepId
          ? {
              ...s,
              active: !s.active,
            }
          : s
      ),
    }))

  const assignNode = (stepId: string, nodeIndex: NodeIndex | null) =>
    mutate((prev) => ({
      ...prev,
      steps: prev.steps.map((s) =>
        s.id === stepId
          ? {
              ...s,
              nodeIndex,
            }
          : s
      ),
    }))

  const setDuration = (stepId: string, mult: DurationMultiplier) =>
    mutate((prev) => ({
      ...prev,
      steps: prev.steps.map((s) =>
        s.id === stepId
          ? {
              ...s,
              durationMultiplier: mult,
            }
          : s
      ),
    }))

  const setStepCount = (count: StepCount) =>
    mutate((prev) => ({
      ...prev,
      stepCount: count,
      steps: resizeSteps(prev.steps, count),
    }))

  const setBpm = (bpm: number) => mutate((prev) => ({ ...prev, bpm: clampBpm(bpm) }))
  const setLoop = (loop: boolean) => mutate((prev) => ({ ...prev, loop }))
  const setMantraText = (text: string) => mutate((prev) => ({ ...prev, mantraText: text }))
  const setMantraLanguage = (lang: string) =>
    mutate((prev) => ({ ...prev, mantraLanguage: lang }))
  const setIpaText = (ipa: string) => mutate((prev) => ({ ...prev, ipaText: ipa }))

  const loadSequence = (seq: Sequence) => {
    setSequence(recalcSyllables(seq))
    setIsDirty(false)
  }

  const resetToNew = (nextUserId: string) => {
    setSequence(makeDefaultSequence(nextUserId))
    setIsDirty(false)
  }

  return {
    sequence,
    setTitle,
    toggleStep,
    assignNode,
    setDuration,
    setStepCount,
    setBpm,
    setLoop,
    setMantraText,
    setMantraLanguage,
    setIpaText,
    syllables,
    overflow,
    isDirty,
    loadSequence,
    resetToNew,
    setIsDirty,
  }
}
