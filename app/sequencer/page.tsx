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
              Eight pads × sixteen sixteenth-note steps. Import short samples, program a bar, play in time.
              Arm record to capture the live mix as a loop — save it under{' '}
              <span className="text-gray-800 dark:text-gray-200 font-medium">Settings → Sound → Your sequencer loops</span>,
              or download the file.
            </p>
            <p className="text-xs text-violet-600 dark:text-violet-400">
              <Link href="/synth-lab" className="hover:underline font-medium">
                Synth lab
              </Link>{' '}
              — tonal layers; this page — rhythmic layers.
            </p>
          </header>

          <Card className="p-5 mb-6 bg-white/80 dark:bg-white/[0.04] border border-black/5 dark:border-white/10">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
              How it works
            </h2>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5 leading-relaxed list-disc pl-5">
              <li>Upload on each pad (WAV, MP3, M4A, etc.). Toggle steps where that sample should hit.</li>
              <li>BPM sets the bar length; one full cycle is 16 steps.</li>
              <li>
                <strong className="text-gray-800 dark:text-gray-200">Arm record</strong>, then Play. When you Stop, you
                can save the take into the Sound panel library (browser storage, keep clips reasonably short).
              </li>
            </ul>
          </Card>

          <StepSequencer />
        </div>
      </div>
    </ProtectedRoute>
  )
}
