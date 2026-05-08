import { audibleHzFromClockTone, CLOCK_TONE_HZ } from '@/lib/clockToneHz'
import { clockTitles } from '@/lib/clockTitles'
import { MM_DRONE_PLANET_LABELS } from '@/lib/mmDroneTones'

export type NodeIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type DurationMultiplier = 1 | 2 | 4
export type StepCount = 8 | 16 | 32

export type Step = {
  id: string
  nodeIndex: NodeIndex | null
  active: boolean
  durationMultiplier: DurationMultiplier
}

export type SyllableMapping = {
  syllable: string
  ipa: string
  stepId: string
}

export type Sequence = {
  id: string
  userId: string
  title: string
  steps: Step[]
  stepCount: StepCount
  bpm: number
  loop: boolean
  mantraText: string
  mantraLanguage: string
  ipaText: string
  syllables: SyllableMapping[]
  createdAt: number
  updatedAt: number
}

export type NodeMeta = {
  index: NodeIndex
  title: string
  planet: string
  audibleHz: number
}

export const NODE_META: NodeMeta[] = ([0, 1, 2, 3, 4, 5, 6, 7, 8] as NodeIndex[]).map((i) => ({
  index: i,
  title: clockTitles[i] ?? '',
  planet: MM_DRONE_PLANET_LABELS[i] ?? '',
  audibleHz: audibleHzFromClockTone(CLOCK_TONE_HZ[i] ?? CLOCK_TONE_HZ[0]),
}))

export const DEFAULT_BPM = 72
export const DEFAULT_STEP_COUNT: StepCount = 16

export function makeEmptyStep(id: string): Step {
  return { id, nodeIndex: null, active: false, durationMultiplier: 1 }
}

export function makeDefaultSequence(userId: string): Sequence {
  const steps: Step[] = Array.from({ length: DEFAULT_STEP_COUNT }, (_, i) =>
    makeEmptyStep(`step-${i}`)
  )
  return {
    id: crypto.randomUUID(),
    userId,
    title: 'New Sequence',
    steps,
    stepCount: DEFAULT_STEP_COUNT,
    bpm: DEFAULT_BPM,
    loop: true,
    mantraText: '',
    mantraLanguage: '',
    ipaText: '',
    syllables: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function parseMantraSyllables(mantraText: string): string[] {
  if (!mantraText.trim()) return []
  return mantraText
    .split(/\s+/)
    .flatMap((word) => word.split('|'))
    .map((s) => s.trim())
    .filter(Boolean)
}

export function distributeSyllables(
  syllables: string[],
  steps: Step[]
): { mappings: SyllableMapping[]; overflow: number } {
  const activeSteps = steps.filter((s) => s.active)
  const mappings: SyllableMapping[] = syllables
    .slice(0, activeSteps.length)
    .map((syl, i) => ({
      syllable: syl,
      ipa: '',
      stepId: activeSteps[i]!.id,
    }))
  const overflow = Math.max(0, syllables.length - activeSteps.length)
  return { mappings, overflow }
}
