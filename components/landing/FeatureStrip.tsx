'use client'

import { usePortal } from '@/contexts/PortalContext'

interface FeatureItem {
  label: string
  description: string
}

const PORTAL_FEATURES: Record<string, FeatureItem[]> = {
  consumer: [
    {
      label: 'Your vocabulary, encrypted',
      description:
        'Your personal definitions are encrypted on your device. The platform holds ciphertext — nothing more.',
    },
    {
      label: 'Practice that knows you',
      description:
        'The sequencer learns which nodes you return to, which you avoid, where your patterns live.',
    },
    {
      label: "A record that's yours",
      description:
        'Download your full data export at any time. Your Passport ID travels with you across platforms.',
    },
  ],
  academic: [
    {
      label: 'A portable academic record',
      description:
        'Your progress, your vocabulary, your consent record — all in a Passport that institutions can verify directly.',
    },
    {
      label: 'Contribute to real research',
      description:
        'Opt into the Universal Hypothesis dataset. Your anonymised patterns help build the empirical foundation for language acquisition science.',
    },
    {
      label: 'Institutional access on your terms',
      description:
        'Grant time-limited, scope-limited access to your record. You control what goes in and what comes out.',
    },
  ],
  corporate: [
    {
      label: 'Language as a capability map',
      description:
        'Understand how your team engages with language — not just what they score, but how they think and move through it.',
    },
    {
      label: 'Verified credential records',
      description:
        'Write completion records and endorsements directly into individual Language Profiles. Permanently logged, independently verifiable.',
    },
    {
      label: 'Evidence for L&D decisions',
      description:
        'Practice patterns, node affinity, consistency trajectories — structured data for structured decisions.',
    },
  ],
}

export function FeatureStrip() {
  const { config } = usePortal()
  const features = PORTAL_FEATURES[config.id] ?? PORTAL_FEATURES.consumer

  return (
    <section className="border-t border-gray-100 px-6 py-16 dark:border-gray-800">
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-10 md:grid-cols-3">
        {features.map((f) => (
          <div key={f.label}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-900 dark:text-gray-100">
              {f.label}
            </p>
            <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
