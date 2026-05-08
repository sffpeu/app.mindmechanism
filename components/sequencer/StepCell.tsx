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
          'relative flex h-[72px] w-full flex-col justify-between rounded-lg border-2 px-2.5 py-2 text-left transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
          !step.active && 'border-dashed border-black/15 bg-transparent opacity-40 dark:border-white/15',
          step.active && !node && 'border-black/30 bg-black/5 dark:border-white/30 dark:bg-white/5',
          step.active && node && 'border-transparent',
          isCurrentStep && 'ring-2 ring-white ring-offset-1 ring-offset-black/20'
        )}
        style={
          step.active && node
            ? {
                backgroundColor: `${NODE_COLORS[node.index]}33`,
                borderColor: NODE_COLORS[node.index],
                boxShadow: `0 0 0 1px ${NODE_COLORS[node.index]}66 inset`,
              }
            : undefined
        }
      >
        <div
          className="truncate text-sm font-bold leading-tight"
          style={step.active && node ? { color: NODE_COLORS[node.index] } : undefined}
        >
          {node ? node.planet : step.active ? '—' : '·'}
        </div>
        <div className="flex items-end justify-between">
          <div className="text-[9px] uppercase tracking-widest opacity-60 leading-tight">
            {step.active ? (node ? node.title : 'unassigned') : 'rest'}
          </div>
          <button
            type="button"
            className="rounded bg-black/15 px-1.5 py-0.5 font-mono text-[10px] dark:bg-white/15"
            onClick={(e) => {
              e.stopPropagation()
              onSetDuration(nextDuration(step.durationMultiplier))
            }}
          >
            ×{step.durationMultiplier}
          </button>
        </div>
      </button>
    </div>
  )
}
