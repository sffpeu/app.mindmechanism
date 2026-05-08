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
  return (
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
  )
}
