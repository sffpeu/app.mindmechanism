'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { useSequencer } from '@/lib/hooks/useSequencer'
import { useSequencerAudio } from '@/lib/hooks/useSequencerAudio'
import { useSequencerStorage } from '@/lib/hooks/useSequencerStorage'
import { useSettings } from '@/lib/hooks/useSettings'
import { type SyllableMapping } from '@/lib/sequencer'
import { SequencerControls } from '@/components/sequencer/SequencerControls'
import { SequencerGrid } from '@/components/sequencer/SequencerGrid'
import { SequencerHeader } from '@/components/sequencer/SequencerHeader'
import { SyllabicAligner } from '@/components/sequencer/SyllabicAligner'
import { MantraInput } from '@/components/sequencer/MantraInput'

export default function SequencerPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { sequences, saveSequence, deleteSequence, loading: sequencesLoading } = useSequencerStorage()
  const toneMode = useSettings((s) => s.toneMode)
  const setToneMode = useSettings((s) => s.setToneMode)

  const sequencer = useSequencer(user?.uid ?? null)
  const audio = useSequencerAudio(sequencer.sequence)

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
    const mapped = new Set(sequencer.sequence.syllables.map((m: SyllableMapping) => m.syllable))
    return sequencer.syllables.filter((s) => !mapped.has(s)).slice(0, sequencer.overflow)
  }, [sequencer.overflow, sequencer.sequence.syllables, sequencer.syllables])

  if (loading || sequencesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" isLoading />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      <div className="border-b border-black/10 bg-white/80 pl-16 pr-4 py-3 backdrop-blur-sm dark:border-white/10 dark:bg-black/60 sm:pr-6">
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

      <div className="min-h-0 flex-1 overflow-auto pl-16 pr-4 pb-3 pt-5 sm:pr-6">
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

      <div className="border-t border-black/10 pl-16 pr-4 py-4 dark:border-white/10 sm:pr-6">
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
      </div>

      <div className="border-t border-black/10 bg-white/80 pl-16 pr-4 py-3 backdrop-blur-sm dark:border-white/10 dark:bg-black/60 sm:pr-6">
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
  )
}
