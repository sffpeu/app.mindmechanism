'use client'

import Link from 'next/link'
import { Disc3 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import StepSequencer from '@/components/StepSequencer'

export default function SequencerPage() {
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
              This is the same frequency register map as practice — sequencing turns symbolic tone into compositional study:
              polyrhythm, layering, and exportable artefacts you can return to in sessions.
            </p>
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
                A top-panel <strong className="text-gray-800 dark:text-gray-200">phrase tape</strong> provides three 10-second pools with
                pause/resume fill, variable playback speed (very slow to 2x), and layered replay for practitioner analysis.
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
