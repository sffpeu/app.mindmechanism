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
  const color = node ? NODE_COLORS[node.index] : null

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
          'relative flex h-[72px] w-full flex-col justify-between rounded-lg border-2 px-2.5 py-2 text-left transition-all select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
          !step.active && 'border-dashed border-black/12 dark:border-white/12 opacity-35 bg-transparent',
          step.active && !node && 'border-black/25 dark:border-white/25 bg-black/4 dark:bg-white/4',
          step.active && node && 'border-transparent',
          isCurrentStep && '!opacity-100 ring-2 ring-white/80 ring-offset-1 ring-offset-black/30'
        )}
        style={
          step.active && color
            ? {
                backgroundColor: `${color}28`,
                borderColor: color,
                boxShadow: `inset 0 0 0 1px ${color}55`,
              }
            : undefined
        }
      >
        <div
          className="text-sm font-semibold leading-tight truncate"
          style={step.active && color ? { color } : undefined}
        >
          {node ? PLANET_SHORT(node.planet) : step.active ? '—' : '·'}
        </div>

        <div className="flex items-end justify-between">
          <div className="text-[9px] uppercase tracking-widest opacity-50 leading-tight">
            {step.active ? (node ? node.title : 'assign') : 'rest'}
          </div>
          <button
            type="button"
            className="rounded bg-black/10 dark:bg-white/10 px-1.5 py-0.5 text-[9px] font-mono leading-none"
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
