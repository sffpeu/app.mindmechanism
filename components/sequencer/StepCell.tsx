'use client'

import { useRef, useState } from 'react'
import type { RefObject } from 'react'
import { NODE_META, type DurationMultiplier, type NodeIndex, type Step } from '@/lib/sequencer'
import { NodePicker, NODE_COLORS } from '@/components/sequencer/NodePicker'
import { cn } from '@/lib/utils'

type Props = {
  step: Step
  isCurrentStep: boolean
  syllable: string | undefined
  onToggle: () => void
  onAssignNode: (nodeIndex: NodeIndex | null) => void
  onSetDuration: (mult: DurationMultiplier) => void
}

function nextDuration(mult: DurationMultiplier): DurationMultiplier {
  if (mult === 1) return 2
  if (mult === 2) return 4
  return 1
}

const PLANET_SHORT = (planet: string): string =>
  planet
    .replace('(F♯)', 'F#')
    .replace('(A♯)', 'A#')
    .replace('Jupiter', 'Jup')
    .replace('Mercury', 'Merc')
    .replace('Neptune', 'Nept')
    .replace('Saturn', 'Sat')
    .replace('Uranus', 'Ura')
    .replace('Venus', 'Ven')
    .replace('Earth', 'Earth')
    .trim()

export function StepCell({ step, isCurrentStep, onToggle, onAssignNode, onSetDuration }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const holdRef = useRef<number | null>(null)
  const triggerRef = useRef<HTMLElement>(null)

  const node = step.nodeIndex != null ? NODE_META[step.nodeIndex] : null
  const cellWidth = 48 * step.durationMultiplier

  return (
    <div
      className="relative"
      style={{ width: `${cellWidth}px`, minWidth: `${cellWidth}px` }}
      onContextMenu={(e) => {
        e.preventDefault()
        setPickerOpen(true)
      }}
      onTouchStart={() => {
        holdRef.current = window.setTimeout(() => setPickerOpen(true), 380)
      }}
      onTouchEnd={() => {
        if (holdRef.current != null) window.clearTimeout(holdRef.current)
        holdRef.current = null
      }}
      onTouchCancel={() => {
        if (holdRef.current != null) window.clearTimeout(holdRef.current)
        holdRef.current = null
      }}
    >
      <NodePicker
        currentNodeIndex={step.nodeIndex}
        onSelect={onAssignNode}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        triggerRef={triggerRef}
      />
      <button
        ref={triggerRef as unknown as RefObject<HTMLButtonElement>}
        type="button"
        onClick={onToggle}
        className={cn(
          'relative h-[68px] w-full rounded border text-left px-2 py-1 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
          !step.active && 'opacity-45 border-dashed border-black/25 dark:border-white/25',
          step.active && !node && 'opacity-90 border-black/40 dark:border-white/40',
          step.active && node && 'opacity-100',
          isCurrentStep && 'ring-2 ring-indigo-400 animate-pulse'
        )}
        style={
          step.active && node
            ? {
                borderColor: `${NODE_COLORS[node.index]}aa`,
                backgroundColor: `${NODE_COLORS[node.index]}22`,
              }
            : undefined
        }
      >
        <div className="text-[10px] uppercase tracking-wider opacity-75">
          {step.active ? (node ? node.title : 'Unassigned') : 'Rest'}
        </div>
        <div className="mt-1 text-xs font-semibold truncate">{node ? PLANET_SHORT(node.planet) : '—'}</div>
        <button
          type="button"
          className="absolute bottom-1.5 right-1.5 rounded bg-black/10 dark:bg-white/10 px-1.5 py-0.5 text-[10px]"
          onClick={(e) => {
            e.stopPropagation()
            onSetDuration(nextDuration(step.durationMultiplier))
          }}
        >
          ×{step.durationMultiplier}
        </button>
      </button>
    </div>
  )
}
