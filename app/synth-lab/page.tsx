'use client'

import { FlaskConical } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import PotionMixer from '@/components/synth-lab/PotionMixer'

export default function SynthLabPage() {
  return (
    <ProtectedRoute>
      <div className="h-full overflow-y-auto bg-transparent ml-16">
        <div className="max-w-2xl px-4 sm:px-6 py-8 pb-20">

          <header className="mb-10 space-y-3">
            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
              <FlaskConical className="h-5 w-5 shrink-0" aria-hidden />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Atmospherics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              The Mixing Pot
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-lg">
              Drop tonal elements into the pot. Let them blend. Save the mixture and use it
              as the atmosphere for any wheel — or just for this session.
            </p>
          </header>

          <PotionMixer />

        </div>
      </div>
    </ProtectedRoute>
  )
}
