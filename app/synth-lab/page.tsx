'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import SolarSystemResonance from '@/components/SolarSystemResonance'

export default function SynthLabPage() {
  return (
    <ProtectedRoute>
      <div className="h-full overflow-y-auto bg-transparent">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-16">
          <header className="mb-8 space-y-3">
            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
              <Sparkles className="h-5 w-5 shrink-0" aria-hidden />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Synth lab</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Interstellar Shimmer
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
              Tap planets to layer live sine tones at symbolic Hz. Silence all stops every oscillator.
            </p>
            <p className="text-xs text-violet-600 dark:text-violet-400">
              For sample loops and bar sequencing, open the{' '}
              <Link href="/sequencer" className="font-medium hover:underline">
                16-step sequencer
              </Link>
              .
            </p>
          </header>

          <div className="space-y-6">
            <Card className="p-5 bg-white/80 dark:bg-white/[0.04] border border-black/5 dark:border-white/10">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">
                Quick tips
              </h2>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 leading-relaxed list-disc pl-5">
                <li>Audio uses your device speakers or headphones via the Web Audio API.</li>
                <li>If nothing plays on the first tap, tap once more — some browsers unlock audio only after a gesture.</li>
                <li>Multiple pads can be active at once; levels add together, so keep an eye on volume.</li>
              </ul>
            </Card>

            <div className="rounded-2xl overflow-hidden ring-1 ring-black/10 dark:ring-white/10 shadow-lg">
              {/* Independent of global “interface sounds” — this page is always audible when pads are used */}
              <SolarSystemResonance soundEnabled compact={false} />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
