'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/lib/FirebaseAuthContext'
import StepSequencer from '@/components/StepSequencer'
import { useSequencer } from '@/lib/hooks/useSequencer'
import { useSequencerAudio } from '@/lib/hooks/useSequencerAudio'
import { useSequencerStorage } from '@/lib/hooks/useSequencerStorage'
import { useSettings } from '@/lib/hooks/useSettings'
import { SequencerHeader } from '@/components/sequencer/SequencerHeader'
import { SequencerGrid } from '@/components/sequencer/SequencerGrid'
import { SyllabicAligner } from '@/components/sequencer/SyllabicAligner'
import { MantraInput } from '@/components/sequencer/MantraInput'
import { SequencerControls } from '@/components/sequencer/SequencerControls'
import { analyzePhraseBlob, type PhraseAcousticReport } from '@/lib/phraseAcousticAnalysis'
import { db } from '@/lib/firebase'
import { doc, setDoc, type Firestore } from 'firebase/firestore'

type StressKind = 'primary' | 'secondary' | 'unstressed'

type CompareReport = {
  consistencyScore: number
  stressHitCount: number
  stressMissCount: number
  rhythmMatchPct: number
  targetPattern: string
  userPattern: string
  notes: string[]
  createdAt: number
}

function parseIpaStressPattern(ipaText: string, syllableCount: number): StressKind[] {
  if (!ipaText.trim() || syllableCount <= 0) return []
  const clean = ipaText.replace(/[\/\[\]]/g, '').trim()
  const segments = clean
    .split(/[.|]/g)
    .map((s) => s.trim())
    .filter(Boolean)
  if (segments.length === 0) return []
  const fromSegments = segments.map<StressKind>((seg) => {
    if (seg.includes('ˈ')) return 'primary'
    if (seg.includes('ˌ')) return 'secondary'
    return 'unstressed'
  })
  while (fromSegments.length < syllableCount) fromSegments.push('unstressed')
  return fromSegments.slice(0, syllableCount)
}

function buildComparison(
  report: PhraseAcousticReport,
  activeStepIndices: number[],
  stepCount: number
): CompareReport {
  const peaks = report.prominencePeaks
  const segments = report.speechSegments
  const totalSteps = Math.max(1, stepCount)
  const targetNorm = activeStepIndices.map((i) => (i + 0.5) / totalSteps)
  const peakNorm = peaks.map((p) => p.tSec / Math.max(0.001, report.durationSec))
  const segmentNorm = segments.map((s) => ((s.startSec + s.endSec) / 2) / Math.max(0.001, report.durationSec))

  const tolerance = 0.11
  let stressHitCount = 0
  let stressMissCount = 0
  const deltas: number[] = []
  const notes: string[] = []

  targetNorm.forEach((target, idx) => {
    const nearest = peakNorm.reduce<number | null>((best, p) => {
      const d = Math.abs(p - target)
      if (best == null || d < best) return d
      return best
    }, null)
    if (nearest != null && nearest <= tolerance) {
      stressHitCount += 1
      deltas.push(nearest)
    } else {
      stressMissCount += 1
      notes.push(`Active step ${activeStepIndices[idx]! + 1} missed prominence peak`)
    }
  })

  const accidentalStress = peakNorm.filter((p) => targetNorm.every((t) => Math.abs(t - p) > tolerance)).length
  if (accidentalStress > 0) {
    notes.push(`${accidentalStress} accidental stress peak(s) outside active steps`)
  }

  const rhythmComparisons = Math.min(targetNorm.length, segmentNorm.length)
  let rhythmDelta = 0
  for (let i = 0; i < rhythmComparisons; i++) {
    rhythmDelta += Math.abs(targetNorm[i]! - segmentNorm[i]!)
  }
  const rhythmMatchPct =
    rhythmComparisons > 0
      ? Math.max(0, Math.round((1 - rhythmDelta / rhythmComparisons / tolerance) * 100))
      : 0

  const stressAccuracyPct =
    targetNorm.length > 0 ? Math.round((stressHitCount / targetNorm.length) * 100) : 0
  const consistencyScore = Math.round(stressAccuracyPct * 0.6 + rhythmMatchPct * 0.4)

  const targetPattern = Array.from({ length: totalSteps }, (_, i) =>
    activeStepIndices.includes(i) ? '▓' : '░'
  ).join('')
  const userPattern = Array.from({ length: totalSteps }, (_, i) => {
    const normStep = (i + 0.5) / totalSteps
    return peakNorm.some((p) => Math.abs(p - normStep) <= tolerance) ? '▓' : '░'
  }).join('')

  return {
    consistencyScore,
    stressHitCount,
    stressMissCount,
    rhythmMatchPct,
    targetPattern,
    userPattern,
    notes: notes.slice(0, 3),
    createdAt: Date.now(),
  }
}

function phraseHash(phrase: string): string {
  let h = 0
  for (let i = 0; i < phrase.length; i++) {
    h = (h << 5) - h + phrase.charCodeAt(i)
    h |= 0
  }
  return `p_${Math.abs(h)}`
}

export default function SequencerPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { sequences, saveSequence, deleteSequence, loading: sequencesLoading } = useSequencerStorage()
  const toneMode = useSettings((s) => s.toneMode)
  const setToneMode = useSettings((s) => s.setToneMode)

  const sequencer = useSequencer(user?.uid ?? null)
  const audio = useSequencerAudio(sequencer.sequence)
  const [stressSuggestion, setStressSuggestion] = useState<StressKind[] | null>(null)
  const [comparison, setComparison] = useState<CompareReport | null>(null)

  useEffect(() => {
    document.title = 'Sequencer'
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/signin')
    }
  }, [loading, router, user])

  const syllableByStepId = useMemo(() => {
    return sequencer.sequence.syllables.reduce<Record<string, string>>((acc, item) => {
      acc[item.stepId] = item.syllable
      return acc
    }, {})
  }, [sequencer.sequence.syllables])

  const overflowSyllables = useMemo(() => {
    if (sequencer.overflow === 0) return []
    const mapped = new Set(sequencer.sequence.syllables.map((m) => m.syllable))
    return sequencer.syllables.filter((s) => !mapped.has(s)).slice(0, sequencer.overflow)
  }, [sequencer.overflow, sequencer.sequence.syllables, sequencer.syllables])

  useEffect(() => {
    const pattern = parseIpaStressPattern(sequencer.sequence.ipaText, sequencer.syllables.length)
    setStressSuggestion(pattern.length > 0 ? pattern : null)
  }, [sequencer.sequence.ipaText, sequencer.syllables.length])

  const handlePoolFinished = async ({ blob }: { poolIndex: number; blob: Blob; durationSec: number }) => {
    const report = await analyzePhraseBlob(blob)
    const activeStepIndices = sequencer.sequence.steps
      .map((s, i) => (s.active ? i : -1))
      .filter((i) => i >= 0)
    const compare = buildComparison(report, activeStepIndices, sequencer.sequence.steps.length)
    setComparison(compare)

    if (user?.uid && db && sequencer.sequence.mantraText.trim()) {
      const ph = phraseHash(`${sequencer.sequence.mantraText.trim()}|${sequencer.sequence.ipaText.trim()}`)
      const sessionId = new Date().toISOString()
      await setDoc(
        doc(
          db as Firestore,
          'users',
          user.uid,
          'phraseProgress',
          ph,
          'sessions',
          sessionId
        ),
        {
          phrase: sequencer.sequence.mantraText,
          ipaText: sequencer.sequence.ipaText,
          consistencyScore: compare.consistencyScore,
          rhythmMatchPct: compare.rhythmMatchPct,
          stressHitCount: compare.stressHitCount,
          stressMissCount: compare.stressMissCount,
          targetPattern: compare.targetPattern,
          userPattern: compare.userPattern,
          prominencePeaks: report.prominencePeaks.map((p) => p.tSec),
          speechSegments: report.speechSegments.map((s) => [s.startSec, s.endSec]),
          createdAt: Date.now(),
        }
      ).catch(() => undefined)
    }
  }

  if (loading || sequencesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" isLoading />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-full overflow-y-auto pl-16 pr-4 py-6 sm:pr-6">
      <div className="mb-4 rounded-xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-neutral-950/80">
        <SequencerHeader
          title={sequencer.sequence.title}
          isDirty={sequencer.isDirty}
          sequences={sequences}
          onTitleChange={sequencer.setTitle}
          onSave={() => void saveSequence(sequencer.sequence).then(() => sequencer.setIsDirty(false))}
          onLoad={sequencer.loadSequence}
          onNew={() => {
            audio.stop()
            sequencer.resetToNew(user.uid)
          }}
          onDelete={(id) => void deleteSequence(id)}
        />
      </div>

      <div className="mb-4 rounded-xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-neutral-950/80">
        <div className="mb-3">
          <MantraInput
            mantraText={sequencer.sequence.mantraText}
            mantraLanguage={sequencer.sequence.mantraLanguage}
            ipaText={sequencer.sequence.ipaText}
            syllableCount={sequencer.syllables.length}
            activeStepCount={sequencer.sequence.steps.filter((s) => s.active).length}
            overflow={sequencer.overflow}
            onMantraChange={sequencer.setMantraText}
            onLanguageChange={sequencer.setMantraLanguage}
            onIpaChange={sequencer.setIpaText}
          />
          {stressSuggestion?.length ? (
            <div className="mt-2 flex items-center justify-between rounded-md border border-amber-400/40 bg-amber-50/70 px-3 py-2 text-xs dark:bg-amber-900/20">
              <span>IPA stress suggestion ready ({stressSuggestion.length} syllables mapped).</span>
              <button
                type="button"
                className="rounded bg-amber-500 px-2 py-1 font-semibold text-black"
                onClick={() => sequencer.assignStress(sequencer.syllables, stressSuggestion)}
              >
                Apply
              </button>
            </div>
          ) : null}
        </div>
        <div className="overflow-x-auto">
          <SequencerGrid
            steps={sequencer.sequence.steps}
            currentStepIndex={audio.currentStepIndex}
            syllableByStepId={syllableByStepId}
            onToggleStep={sequencer.toggleStep}
            onAssignNode={sequencer.assignNode}
            onSetDuration={sequencer.setDuration}
          />
          <div className="mt-1">
            <SyllabicAligner
              steps={sequencer.sequence.steps}
              syllables={sequencer.sequence.syllables}
              currentStepIndex={audio.currentStepIndex}
              overflowSyllables={overflowSyllables}
            />
          </div>
        </div>
        <div className="mt-3">
          <SequencerControls
            isPlaying={audio.isPlaying}
            bpm={sequencer.sequence.bpm}
            stepCount={sequencer.sequence.stepCount}
            loop={sequencer.sequence.loop}
            toneMode={toneMode ?? 'drone'}
            onPlay={() => void audio.play()}
            onPause={audio.pause}
            onStop={audio.stop}
            onBpmChange={sequencer.setBpm}
            onStepCountChange={sequencer.setStepCount}
            onLoopChange={sequencer.setLoop}
            onToneModeChange={setToneMode}
          />
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-neutral-950/80">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">Pattern comparison</h3>
        {comparison ? (
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Consistency score: {comparison.consistencyScore}/100</p>
            <p className="text-xs text-gray-500">Rhythm match: {comparison.rhythmMatchPct}%</p>
            <p className="font-mono text-xs">Target: {comparison.targetPattern}</p>
            <p className="font-mono text-xs">Your: {comparison.userPattern}</p>
            <p className="text-xs">
              Stress hits {comparison.stressHitCount} · misses {comparison.stressMissCount}
            </p>
            {comparison.notes.map((n) => (
              <p key={n} className="text-xs text-amber-600 dark:text-amber-400">
                {n}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            Finish a phrase pool recording below to generate rhythm/stress comparison against the current grid.
          </p>
        )}
      </div>

      <StepSequencer mantraText={sequencer.sequence.mantraText} onPoolFinished={handlePoolFinished} />
    </div>
  )
}
