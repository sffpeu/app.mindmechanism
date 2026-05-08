'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { cn } from '@/lib/utils'
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
import { doc, setDoc, getDoc, increment, type Firestore } from 'firebase/firestore'
import { phraseHash } from '@/lib/phraseProgress'
import { PhraseProgressCurve } from '@/components/sequencer/PhraseProgressCurve'
import { NodeAffinityMap } from '@/components/sequencer/NodeAffinityMap'
import { computeNodeAffinityProfile, type NodeAffinityProfile } from '@/lib/nodeAffinity'
import { hasStudentAcademicPortal, tierDisplayName } from '@/lib/portalAccess'

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
  const clean = ipaText.replace(/[/[\]]/g, '').trim()
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

export default function SequencerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile, loading } = useAuth()
  const { sequences, saveSequence, deleteSequence, loading: sequencesLoading } = useSequencerStorage()
  const toneMode = useSettings((s) => s.toneMode)
  const setToneMode = useSettings((s) => s.setToneMode)

  const sequencer = useSequencer(user?.uid ?? null)
  const audio = useSequencerAudio(sequencer.sequence)
  const [stressSuggestion, setStressSuggestion] = useState<StressKind[] | null>(null)
  const [comparison, setComparison] = useState<CompareReport | null>(null)
  const [didApplyGlossaryPrefill, setDidApplyGlossaryPrefill] = useState(false)
  const [progressRefreshKey, setProgressRefreshKey] = useState(0)
  const [affinityProfile, setAffinityProfile] = useState<NodeAffinityProfile | null>(null)

  useEffect(() => {
    document.title = 'Sequencer'
  }, [])

  const refreshAffinityProfile = useCallback(() => {
    if (!user?.uid) return
    void computeNodeAffinityProfile(user.uid).then(setAffinityProfile)
  }, [user?.uid])

  useEffect(() => {
    refreshAffinityProfile()
  }, [refreshAffinityProfile])

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/signin')
    }
  }, [loading, router, user])

  useEffect(() => {
    if (didApplyGlossaryPrefill) return
    if (searchParams.get('fromGlossary') !== '1') return
    const mantra = searchParams.get('mantra')
    const language = searchParams.get('language')
    const ipa = searchParams.get('ipa')
    if (mantra) sequencer.setMantraText(mantra)
    if (language) sequencer.setMantraLanguage(language)
    if (ipa) sequencer.setIpaText(ipa)
    setDidApplyGlossaryPrefill(true)
  }, [didApplyGlossaryPrefill, searchParams, sequencer])

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

  const currentPhraseHash = useMemo(() => {
    const m = sequencer.sequence.mantraText.trim()
    if (!m) return null
    return phraseHash(`${m}|${sequencer.sequence.ipaText.trim()}`)
  }, [sequencer.sequence.mantraText, sequencer.sequence.ipaText])

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
      try {
        await setDoc(
          doc(db as Firestore, 'users', user.uid, 'phraseProgress', ph, 'sessions', sessionId),
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
        )

        const summaryRef = doc(db as Firestore, 'users', user.uid, 'phraseProgress', ph)
        const summarySnap = await getDoc(summaryRef)
        const prev = summarySnap.exists() ? summarySnap.data() : {}
        const currentBest =
          typeof prev.bestScore === 'number' && !Number.isNaN(prev.bestScore) ? prev.bestScore : 0

        await setDoc(
          summaryRef,
          {
            phrase: sequencer.sequence.mantraText.trim(),
            ipaText: sequencer.sequence.ipaText.trim(),
            latestScore: compare.consistencyScore,
            latestSessionAt: Date.now(),
            sessionCount: increment(1),
            bestScore: Math.max(currentBest, compare.consistencyScore),
            ...(summarySnap.exists() ? {} : { firstSessionAt: Date.now() }),
          },
          { merge: true }
        )
      } catch {
        /* Firestore unavailable — comparison UI still works locally */
      }
      setProgressRefreshKey((k) => k + 1)
    }
    if (user?.uid) {
      refreshAffinityProfile()
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

  const tier = profile?.tier ?? 'open'
  const hasPortalAccess = hasStudentAcademicPortal(tier)

  if (!hasPortalAccess) {
    return (
      <div className="min-h-full overflow-y-auto ml-16 px-4 pb-12 pt-6 sm:px-6">
        <div className="max-w-3xl rounded-2xl border border-amber-300/40 bg-amber-50/70 p-5 dark:border-amber-500/30 dark:bg-amber-950/20">
          <p className="text-[10px] uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
            Student + Academic portal required
          </p>
          <h1 className="mt-2 text-xl font-semibold text-amber-900 dark:text-amber-100">Sequencer access is scaffolded by portal</h1>
          <p className="mt-2 text-sm leading-relaxed text-amber-800/90 dark:text-amber-200/90">
            The phrase analyzer tape and lane-level sequencing are available in the Student + Academic portal only.
            Your current membership is <strong>{tierDisplayName(tier)}</strong>. This protects against unguided use of
            clinical-grade feedback tooling.
          </p>
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
            You can still use the rest of Mind Mechanism normally. Access here is expanded after portal upgrade.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full overflow-y-auto ml-16 px-4 pb-12 pt-4 sm:px-6">

      {/* Header — no card, just a clean strip */}
      <div className="mb-6 border-b border-black/8 pb-4 dark:border-white/8">
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

      {/* Mnemonic scaffold — the primary work area */}
      <div className="mb-6 rounded-2xl border border-black/8 bg-white/60 px-5 py-5 shadow-sm dark:border-white/8 dark:bg-neutral-950/60">
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-neutral-500">
          Mnemonic scaffold
        </p>
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
          <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-300/50 bg-amber-50/60 px-3 py-2 dark:border-amber-500/20 dark:bg-amber-950/20">
            <span className="text-[11px] text-amber-700 dark:text-amber-300">
              {stressSuggestion.length} syllables mapped from IPA — apply to grid?
            </span>
            <button
              type="button"
              className="ml-3 rounded-md bg-amber-400/80 px-2.5 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-400 dark:bg-amber-500/30 dark:text-amber-200"
              onClick={() => sequencer.assignStress(sequencer.syllables, stressSuggestion)}
            >
              Apply
            </button>
          </div>
        ) : null}

        <div className="mt-5 overflow-x-auto">
          <SequencerGrid
            steps={sequencer.sequence.steps}
            currentStepIndex={audio.currentStepIndex}
            syllableByStepId={syllableByStepId}
            onToggleStep={sequencer.toggleStep}
            onAssignNode={sequencer.assignNode}
            onSetDuration={sequencer.setDuration}
          />
          <div className="mt-1.5">
            <SyllabicAligner
              steps={sequencer.sequence.steps}
              syllables={sequencer.sequence.syllables}
              currentStepIndex={audio.currentStepIndex}
              overflowSyllables={overflowSyllables}
            />
          </div>
        </div>

        <div className="mt-4 border-t border-black/6 pt-4 dark:border-white/6">
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

      {/* Pattern comparison */}
      {comparison ? (
        <div className="mb-6 rounded-2xl border border-black/8 bg-white/60 px-5 py-5 shadow-sm dark:border-white/8 dark:bg-neutral-950/60">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-neutral-500">
            Pattern comparison
          </p>
          <div className="flex items-start gap-6">
            {/* Score */}
            <div className="shrink-0 text-center">
              <div className="text-4xl font-black tabular-nums leading-none text-gray-900 dark:text-white">
                {comparison.consistencyScore}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-widest text-gray-400">consistency</div>
            </div>
            {/* Patterns */}
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-widest text-gray-400">target</div>
                <div className="flex flex-wrap gap-0.5">
                  {Array.from(comparison.targetPattern).map((ch, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-4 w-3 rounded-sm',
                        ch === '▓'
                          ? 'bg-violet-500/70 dark:bg-violet-400/60'
                          : 'bg-gray-200/80 dark:bg-white/10'
                      )}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1 text-[10px] uppercase tracking-widest text-gray-400">yours</div>
                <div className="flex flex-wrap gap-0.5">
                  {Array.from(comparison.userPattern).map((ch, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-4 w-3 rounded-sm',
                        ch === '▓'
                          ? 'bg-emerald-500/70 dark:bg-emerald-400/60'
                          : 'bg-gray-200/80 dark:bg-white/10'
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
            {/* Stats */}
            <div className="shrink-0 space-y-2 text-right">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-gray-400">rhythm</div>
                <div className="text-sm font-semibold tabular-nums text-gray-700 dark:text-gray-300">
                  {comparison.rhythmMatchPct}%
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-gray-400">stress</div>
                <div className="text-sm tabular-nums text-gray-700 dark:text-gray-300">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{comparison.stressHitCount}✓</span>
                  {' '}
                  <span className="text-gray-400">{comparison.stressMissCount}✗</span>
                </div>
              </div>
            </div>
          </div>
          {comparison.notes.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {comparison.notes.map((n) => (
                <span
                  key={n}
                  className="rounded-full border border-amber-300/50 bg-amber-50/70 px-2.5 py-0.5 text-[11px] text-amber-700 dark:border-amber-500/20 dark:bg-amber-950/30 dark:text-amber-300"
                >
                  {n}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-dashed border-black/10 px-5 py-4 dark:border-white/10">
          <div className="flex gap-0.5 opacity-30">
            {Array.from({ length: 16 }, (_, i) => (
              <div key={i} className={cn('h-4 w-3 rounded-sm bg-gray-400', i % 3 === 0 && 'bg-violet-400')} />
            ))}
          </div>
          <p className="text-xs text-gray-400 dark:text-neutral-500">
            Record and finish a phrase pool below to see your pattern here.
          </p>
        </div>
      )}

      {comparison && user?.uid && currentPhraseHash ? (
        <PhraseProgressCurve
          uid={user.uid}
          phraseHash={currentPhraseHash}
          refreshKey={progressRefreshKey}
          phraseText={sequencer.sequence.mantraText.trim()}
        />
      ) : null}

      {affinityProfile !== null ? (
        <div className="mb-6 rounded-2xl border border-black/8 bg-white/60 px-5 py-5 shadow-sm dark:border-white/8 dark:bg-neutral-950/60">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-neutral-500">
            Your practice map — last 28 days
          </p>
          <NodeAffinityMap profile={affinityProfile} />
          {affinityProfile.totalSessions > 0 ? (
            <p className="mt-3 text-[10px] text-gray-400 dark:text-neutral-500">
              {affinityProfile.totalSessions} session{affinityProfile.totalSessions !== 1 ? 's' : ''} ·{' '}
              {affinityProfile.totalFires.toLocaleString()} steps
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Phrase analyzer — full width, no extra wrapper */}
      <StepSequencer
        mantraText={sequencer.sequence.mantraText}
        onPoolFinished={handlePoolFinished}
        onNodeAffinityLogged={refreshAffinityProfile}
      />
    </div>
  )
}
