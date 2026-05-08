'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
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
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6">
      <Card className="p-4 sm:p-5">
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
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="overflow-x-auto">
          <SequencerGrid
            steps={sequencer.sequence.steps}
            currentStepIndex={audio.currentStepIndex}
            syllableByStepId={syllableByStepId}
            onToggleStep={sequencer.toggleStep}
            onAssignNode={sequencer.assignNode}
            onSetDuration={sequencer.setDuration}
          />
          <SyllabicAligner
            steps={sequencer.sequence.steps}
            syllables={sequencer.sequence.syllables}
            currentStepIndex={audio.currentStepIndex}
            overflowSyllables={overflowSyllables}
          />
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
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
      </Card>

      <Card className="p-4 sm:p-5">
        <SequencerControls
          isPlaying={audio.isPlaying}
          bpm={sequencer.sequence.bpm}
          stepCount={sequencer.sequence.stepCount}
          loop={sequencer.sequence.loop}
          toneMode={toneMode}
          onPlay={() => void audio.play()}
          onPause={audio.pause}
          onStop={audio.stop}
          onBpmChange={sequencer.setBpm}
          onStepCountChange={sequencer.setStepCount}
          onLoopChange={sequencer.setLoop}
          onToneModeChange={setToneMode}
        />
      </Card>
    </div>
  )
}
