'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { UserProfile } from '@/lib/FirebaseAuthContext'
import { ResearchConsentFlow } from '@/components/research/ResearchConsentFlow'

function fmtConsentDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ResearchStatusPanel({ consentRecord }: { consentRecord: UserProfile['researchConsent'] }) {
  const [flowOpen, setFlowOpen] = useState(false)

  if (consentRecord?.neverAsk === true) {
    return (
      <section className="rounded-2xl border border-black/8 bg-white/60 px-5 py-5 shadow-sm dark:border-white/8 dark:bg-neutral-950/60">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-neutral-500">
          Research participation
        </p>
        <div className="my-3 border-t border-black/8 dark:border-white/8" />
        <p className="text-sm leading-relaxed text-gray-600 dark:text-neutral-300">
          You&apos;ve chosen not to participate in research. That&apos;s completely fine.
        </p>
      </section>
    )
  }

  const b = consentRecord?.categoryB
  const c = consentRecord?.categoryC
  const hasDecision = b !== undefined || c !== undefined

  if (!hasDecision) {
    return (
      <>
        <section className="rounded-2xl border border-black/8 bg-white/60 px-5 py-5 shadow-sm dark:border-white/8 dark:bg-neutral-950/60">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-neutral-500">
            Research participation
          </p>
          <div className="my-3 border-t border-black/8 dark:border-white/8" />
          <p className="text-sm leading-relaxed text-gray-600 dark:text-neutral-300">
            You haven&apos;t opted in to research participation yet.
          </p>
          <button
            type="button"
            onClick={() => setFlowOpen(true)}
            className="mt-3 text-sm font-medium text-violet-600 underline underline-offset-2 dark:text-violet-400"
          >
            Learn more →
          </button>
        </section>
        <ResearchConsentFlow open={flowOpen} onClose={() => setFlowOpen(false)} />
      </>
    )
  }

  const bLine =
    b?.granted === true
      ? `Contributing · since ${fmtConsentDate(b.timestamp)}`
      : 'Not contributing'
  const cLine =
    c?.granted === true
      ? `Contributing · since ${fmtConsentDate(c.timestamp)}`
      : 'Not contributing'

  return (
    <section className="rounded-2xl border border-black/8 bg-white/60 px-5 py-5 shadow-sm dark:border-white/8 dark:bg-neutral-950/60">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-neutral-500">
        Research participation
      </p>
      <div className="my-3 border-t border-black/8 dark:border-white/8" />

      <dl className="space-y-2 text-sm">
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-gray-500 dark:text-neutral-400">Usage patterns</dt>
          <dd className="text-right text-gray-800 dark:text-neutral-200">{bLine}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <dt className="text-gray-500 dark:text-neutral-400">Practice progress</dt>
          <dd className="text-right text-gray-800 dark:text-neutral-200">{cLine}</dd>
        </div>
      </dl>

      {(b?.granted === true || c?.granted === true) && (
        <p className="mt-4 text-xs leading-relaxed text-gray-500 dark:text-neutral-400">
          Your wheel assignments and session patterns are contributing anonymously to a cross-linguistic study of
          somatic-semantic associations.
        </p>
      )}

      <p className="mt-3 text-xs text-gray-500 dark:text-neutral-500">
        You can change your choices at any time.{' '}
        <Link href="/settings" className="font-medium text-violet-600 underline underline-offset-2 dark:text-violet-400">
          Manage in Settings →
        </Link>
      </p>
    </section>
  )
}
