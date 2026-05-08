'use client'

import type { Step, SyllableMapping } from '@/lib/sequencer'
import { cn } from '@/lib/utils'

type Props = {
  steps: Step[]
  syllables: SyllableMapping[]
  currentStepIndex: number
  overflowSyllables: string[]
}

export function SyllabicAligner({ steps, syllables, currentStepIndex, overflowSyllables }: Props) {
  const byStep = new Map<string, SyllableMapping>()
  syllables.forEach((s) => byStep.set(s.stepId, s))

  return (
    <div className="inline-flex min-w-max items-start gap-1 pt-2">
      {steps.map((step, i) => {
        const mapping = byStep.get(step.id)
        const width = 48 * step.durationMultiplier
        return (
          <div
            key={step.id}
            style={{ width: `${width}px`, minWidth: `${width}px` }}
            className={cn(
              'min-h-[42px] rounded border border-transparent px-1 py-1 text-center',
              currentStepIndex === i && 'bg-indigo-500/10 border-indigo-400/40'
            )}
          >
            {mapping ? (
              <>
                <div className="text-xs font-medium">{mapping.syllable}</div>
                {mapping.ipa ? <div className="mt-0.5 text-[10px] opacity-70">{mapping.ipa}</div> : null}
              </>
            ) : (
              <div className="text-[10px] opacity-40">·</div>
            )}
          </div>
        )
      })}
      {overflowSyllables.length > 0 ? (
        <div className="ml-3 min-w-[120px] rounded border border-amber-400/40 bg-amber-400/10 px-2 py-1.5">
          <div className="text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-300">
            overflow:
          </div>
          <div className="mt-1 text-xs text-amber-800 dark:text-amber-100">
            {overflowSyllables.join(' · ')}
          </div>
        </div>
      ) : null}
    </div>
  )
}
