'use client'

import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { getUserContributionSummary, type UserContributionSummary } from '@/lib/researchLogging'
import { getPublicResearchStatus, type ResearchStatusPublic } from '@/lib/research'

function fmtDate(ms: number | null): string {
  if (ms == null) return ''
  try {
    return new Date(ms).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

function ThinBar({ current, max }: { current: number; max: number }) {
  const safeMax = Math.max(1, max)
  const pct = Math.min(100, Math.round((current / safeMax) * 100))
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200/90 dark:bg-white/10">
      <div
        className="h-full rounded-full bg-gray-500/70 dark:bg-neutral-400/60 transition-[width]"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function ResearchDashboardContent({
  contribution,
  status,
}: {
  contribution: UserContributionSummary | null
  status: ResearchStatusPublic | null
}) {
  const c = contribution ?? {
    wheelAssignmentCount: 0,
    sessionCount: 0,
    contributingSince: null,
    lastContributionAt: null,
  }
  const hasAnyContribution = c.wheelAssignmentCount > 0 || c.sessionCount > 0
  const s = status

  const hypothesisDisplay =
    s?.hypothesis?.trim() ||
    'The nine somatic wheels carry consistent meaning across languages and cultures.'

  return (
    <section className="rounded-2xl border border-black/8 bg-white/60 px-5 py-5 shadow-sm dark:border-white/8 dark:bg-neutral-950/60">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-neutral-500">
        The research
      </p>
      <div className="my-3 border-t border-black/8 dark:border-white/8" />

      <div className="space-y-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-neutral-500 mb-2">
            The hypothesis
          </p>
          <blockquote className="text-sm italic leading-relaxed text-gray-800 dark:text-neutral-200">
            &ldquo;{hypothesisDisplay}&rdquo;
          </blockquote>
          <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-neutral-400">
            This is what we&apos;re testing. We don&apos;t yet know if it&apos;s true.
          </p>
        </div>

        <div className="border-t border-dashed border-black/10 pt-5 dark:border-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-neutral-500 mb-3">
            Your contribution
          </p>
          {!hasAnyContribution ? (
            <p className="text-sm leading-relaxed text-gray-600 dark:text-neutral-300">
              Your first wheel assignment will be your first contribution.
            </p>
          ) : (
            <div className="flex flex-wrap gap-x-10 gap-y-4">
              <div>
                <div className="text-3xl font-bold tabular-nums text-gray-900 dark:text-white">
                  {c.wheelAssignmentCount}
                </div>
                <p className="text-xs text-gray-400 dark:text-neutral-500">wheel assignments</p>
              </div>
              <div>
                <div className="text-3xl font-bold tabular-nums text-gray-900 dark:text-white">{c.sessionCount}</div>
                <p className="text-xs text-gray-400 dark:text-neutral-500">sequencer sessions</p>
              </div>
            </div>
          )}
          {hasAnyContribution && c.contributingSince != null ? (
            <p className="mt-3 text-xs text-gray-500 dark:text-neutral-400">
              Contributing since {fmtDate(c.contributingSince)}
            </p>
          ) : null}
        </div>

        <div className="border-t border-dashed border-black/10 pt-5 dark:border-white/10">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-neutral-500">
            The dataset
            {s?.lastUpdated ? (
              <span className="ml-2 font-normal normal-case tracking-normal text-gray-400 dark:text-neutral-500">
                · last updated {s.lastUpdated}
              </span>
            ) : null}
          </p>

          {s ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <ThinBar current={s.consentingUsers} max={s.thresholdUsersRequired} />
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums text-gray-500 dark:text-neutral-400">
                    {s.consentingUsers} / {s.thresholdUsersRequired} users
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <ThinBar current={s.languageFamiliesRepresented} max={s.thresholdFamiliesRequired} />
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums text-gray-500 dark:text-neutral-400">
                    {s.languageFamiliesRepresented} / {s.thresholdFamiliesRequired} language families
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-neutral-300">
                Status: <span className="font-medium">{s.statusLabel}</span>
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Programme status will appear here once the public dataset summary is published in Firestore.
            </p>
          )}

          {s?.preRegistered && s.preRegistrationUrl ? (
            <p className="mt-4 text-xs leading-relaxed text-gray-600 dark:text-neutral-300">
              Hypotheses have been pre-registered.{' '}
              <a
                href={s.preRegistrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-violet-600 underline underline-offset-2 dark:text-violet-400"
              >
                View the pre-registration
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            </p>
          ) : (
            <p className="mt-4 text-xs leading-relaxed text-gray-500 dark:text-neutral-400">
              When the dataset reaches threshold, hypotheses will be pre-registered with the Open Science Framework
              before any analysis begins.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export function ResearchDashboard() {
  const { user, profile } = useAuth()
  const hasConsent = profile?.researchConsent?.categoryB?.granted === true
  const [contribution, setContribution] = useState<UserContributionSummary | null>(null)
  const [status, setStatus] = useState<ResearchStatusPublic | null>(null)

  useEffect(() => {
    if (!user?.uid || !hasConsent) return
    let cancelled = false
    void Promise.all([getUserContributionSummary(user.uid), getPublicResearchStatus()]).then(([c, s]) => {
      if (!cancelled) {
        setContribution(c)
        setStatus(s)
      }
    })
    return () => {
      cancelled = true
    }
  }, [user?.uid, hasConsent])

  if (!hasConsent) return null

  return <ResearchDashboardContent contribution={contribution} status={status} />
}
