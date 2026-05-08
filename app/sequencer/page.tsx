'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Disc3 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import StepSequencer from '@/components/StepSequencer'

export default function SequencerPage() {
  const [sequencerInfoOpen, setSequencerInfoOpen] = useState(false)

  return (
    <ProtectedRoute>
      <div className="h-full overflow-y-auto bg-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-16">
          <header className="mb-8 space-y-3">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Disc3 className="h-5 w-5 shrink-0" aria-hidden />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Loop lab</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              16-step sequencer
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
              Nine tracks align with the nine wheels — each ships with the matching planet drone from MM Foundations so
              you can hear the grid immediately. Replace lanes with your own material when you are ready; record the mix
              as a loop for{' '}
              <span className="text-gray-800 dark:text-gray-200 font-medium">Settings → Sound → Your sequencer loops</span>.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 max-w-2xl leading-relaxed">
              This is the same frequency register map as practice — sequencing turns symbolic tone into structured study:
              polyrhythm, layering, and exportable artefacts you can return to in sessions.{' '}
              <button
                type="button"
                onClick={() => setSequencerInfoOpen(true)}
                className="text-violet-600 dark:text-violet-400 font-medium hover:underline underline-offset-2 decoration-violet-400/60"
              >
                Why this sequencer?
              </button>{' '}
              <span className="text-gray-500 dark:text-gray-600">
                (Music-making is intentionally the lesser concern.)
              </span>
            </p>

            <Dialog open={sequencerInfoOpen} onOpenChange={setSequencerInfoOpen}>
              <DialogContent className="max-h-[min(90vh,640px)] w-[calc(100%-2rem)] max-w-xl gap-0 p-0 flex flex-col overflow-hidden border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-950 sm:rounded-xl">
                <DialogHeader className="px-5 pt-5 pb-3 shrink-0 border-b border-black/5 dark:border-white/10 text-left">
                  <DialogTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white pr-8">
                    Why this sequencer exists
                  </DialogTitle>
                  <p className="text-xs font-normal text-gray-500 dark:text-gray-400 pt-1 leading-relaxed">
                    How the Loop lab fits Mind Mechanism — with music as carrier, not destination.
                  </p>
                </DialogHeader>
                <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0 text-sm text-gray-700 dark:text-gray-300 space-y-4 leading-relaxed">
                  <p>
                    This page is not built to prioritise conventional music production. Rhythm, drones, and loops are
                    present because they give <strong className="text-gray-900 dark:text-gray-100">time and tone a
                    concrete shape</strong>: you can hear division, overlap, and return without needing staff notation or
                    a separate instrument discipline. In that sense, “music” here is a{' '}
                    <strong className="text-gray-900 dark:text-gray-100">supporting language</strong> — useful, audible,
                    secondary.
                  </p>
                  <p>
                    The primary aim is <strong className="text-gray-900 dark:text-gray-100">instrumental for practice</strong>:
                    mapping the nine wheels into a temporal grid, repeating patterns deliberately, and producing small,
                    reviewable artefacts (loops, phrase-channel recordings, optional acoustic readouts) that you can bring
                    back to contemplative or linguistic work elsewhere in the app. Compositional pleasure or “good beats”
                    may arise; they are not the organising principle.
                  </p>
                  <p>
                    The phrase tape above the grid extends that intent into{' '}
                    <strong className="text-gray-900 dark:text-gray-100">short vocal production</strong> — measuring how
                    language sounds under time pressure, not scoring artistic performance. Together, grid and tape treat
                    sound as <strong className="text-gray-900 dark:text-gray-100">evidence of structure and habit</strong>,
                    not as an end in themselves.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 border-t border-black/5 dark:border-white/10 pt-4">
                    For sustained harmonic exploration (a different emphasis), use{' '}
                    <Link
                      href="/synth-lab"
                      className="text-violet-600 dark:text-violet-400 font-medium hover:underline"
                      onClick={() => setSequencerInfoOpen(false)}
                    >
                      Synth lab
                    </Link>
                    ; this sequencer stresses{' '}
                    <strong className="text-gray-700 dark:text-gray-400">when</strong> things occur and{' '}
                    <strong className="text-gray-700 dark:text-gray-400">how</strong> they recur — the scaffolding beneath
                    symbolic tone.
                  </p>
                </div>
                <DialogFooter className="px-5 py-4 shrink-0 border-t border-black/5 dark:border-white/10 bg-gray-50/80 dark:bg-neutral-900/80">
                  <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={() => setSequencerInfoOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <p className="text-xs text-violet-600 dark:text-violet-400">
              <Link href="/synth-lab" className="hover:underline font-medium">
                Synth lab
              </Link>{' '}
              — sustained harmonic exploration; this page — temporal structuring.
            </p>
          </header>

          <Card className="p-5 mb-6 bg-white/80 dark:bg-white/[0.04] border border-black/5 dark:border-white/10">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
              How it works
            </h2>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5 leading-relaxed list-disc pl-5">
              <li>
                Presets load automatically from <code className="text-[11px] px-1 rounded bg-black/5 dark:bg-white/10">/mm_tones</code>.
                A starter pattern fires once per wheel across the bar — edit freely.
              </li>
              <li>
                Import audio per wheel (WAV, MP3, M4A, …). <strong className="text-gray-800 dark:text-gray-200">Rotate</strong>{' '}
                restores that wheel&apos;s factory drone.
              </li>
              <li>
                Each triggered step uses <strong className="text-gray-800 dark:text-gray-200">attack → sustain (dial) → release</strong>{' '}
                so you can keep key-like precision or add a little pad body without endless drone carry.
              </li>
              <li>BPM ranges from 5 to 120 and sets one bar of sixteen sixteenth-notes.</li>
              <li>
                A top-panel <strong className="text-gray-800 dark:text-gray-200">phrase tape</strong> provides three independent 10-second channels with
                pause/resume fill, variable playback speed (very slow to 2x), per-channel playback, appraisal notes, and an optional{' '}
                <strong className="text-gray-800 dark:text-gray-200">acoustic readout</strong> (pitch, loudness, prominence peaks, voiced-segment table, optional Whisper word alignment via server <code className="text-[11px] px-1 rounded bg-black/5 dark:bg-white/10">OPENAI_API_KEY</code>, exportable JSON) grounded in this clip only—not a mood or fluency score.
              </li>
              <li>
                <strong className="text-gray-800 dark:text-gray-200">Arm record</strong> → Play → Stop to capture the stereo mix.
              </li>
            </ul>
          </Card>

          <StepSequencer />
        </div>
      </div>
    </ProtectedRoute>
  )
}
