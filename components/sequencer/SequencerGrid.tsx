'use client'

import type { DurationMultiplier, NodeIndex, Step } from '@/lib/sequencer'
import { StepCell } from '@/components/sequencer/StepCell'

type Props = {
  steps: Step[]
  currentStepIndex: number
  syllableByStepId: Record<string, string | undefined>
  onToggleStep: (stepId: string) => void
  onAssignNode: (stepId: string, nodeIndex: NodeIndex | null) => void
  onSetDuration: (stepId: string, mult: DurationMultiplier) => void
}

export function SequencerGrid({
  steps,
  currentStepIndex,
  syllableByStepId,
  onToggleStep,
  onAssignNode,
  onSetDuration,
}: Props) {
  const hasActiveSteps = steps.some((s) => s.active)

  return (
    <div>
      <div className="inline-flex min-w-max gap-1">
        {steps.map((step, i) => (
          <StepCell
            key={step.id}
            step={step}
            isCurrentStep={currentStepIndex === i}
            syllable={syllableByStepId[step.id]}
            onToggle={() => onToggleStep(step.id)}
            onAssignNode={(node) => onAssignNode(step.id, node)}
            onSetDuration={(mult) => onSetDuration(step.id, mult)}
          />
        ))}
      </div>

      {!hasActiveSteps && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <kbd className="rounded border border-current px-1.5 py-0.5 font-mono text-[10px]">click</kbd>
            activate a step
          </span>
          <span className="opacity-30">·</span>
          <span className="inline-flex items-center gap-1.5">
            <kbd className="rounded border border-current px-1.5 py-0.5 font-mono text-[10px]">right-click</kbd>
            assign a node
          </span>
        </div>
      )}
    </div>
  )
}
