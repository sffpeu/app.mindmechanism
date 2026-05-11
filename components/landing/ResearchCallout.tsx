'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { usePortal } from '@/contexts/PortalContext'

export function ResearchCallout() {
  const { config } = usePortal()

  if (config.features.researchCTA === 'none') return null

  const isProminent = config.features.researchCTA === 'prominent'

  return (
    <section
      className={cn(
        'px-6 py-12',
        isProminent && 'bg-gray-50 dark:bg-gray-900'
      )}
    >
      <div className="mx-auto max-w-3xl">
        {isProminent ? (
          <div className="border border-gray-200 p-8 dark:border-gray-700">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
              Research Participation
            </p>
            <h2 className="mb-4 font-serif text-xl text-gray-900 dark:text-gray-100">
              Help build the evidence base for language acquisition.
            </h2>
            <p className="mb-6 max-w-lg text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              The Universal Hypothesis — that the affective state of a learner determines the quality of acquisition — is
              testable. Your anonymised practice patterns are the dataset. Consent is granular, revocable, and anchored
              on-chain.
            </p>
            <Link
              href="/research"
              className="text-sm text-gray-900 underline underline-offset-4 transition-opacity hover:opacity-70 dark:text-gray-100"
            >
              Read about the research programme →
            </Link>
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Interested in contributing to language acquisition research?{' '}
            <Link
              href="/research"
              className="underline underline-offset-2 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
            >
              Learn more →
            </Link>
          </p>
        )}
      </div>
    </section>
  )
}
