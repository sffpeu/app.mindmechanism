'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ScrollText } from 'lucide-react'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { usePassportKey } from '@/components/passport/PassportKeyProvider'
import { getUserPhraseSummaries, getPhraseSessionHistory } from '@/lib/phraseProgress'
import { computeNodeAffinityProfile, type NodeAffinityProfile } from '@/lib/nodeAffinity'
import { LexiconPanel } from '@/components/record/LexiconPanel'
import { PhraseHistoryPanel, type PhraseHistoryRow } from '@/components/record/PhraseHistoryPanel'
import { AffinityPanel } from '@/components/record/AffinityPanel'
import { ResearchStatusPanel } from '@/components/record/ResearchStatusPanel'
import { ResearchDashboard } from '@/components/record/ResearchDashboard'
import { InstitutionalAccessPanel } from '@/components/record/InstitutionalAccessPanel'
import { CredentialsPanel } from '@/components/record/CredentialsPanel'
import { ExportButton } from '@/components/record/ExportButton'
import { downloadKeyBackup, exportKeyAsBase64, loadKey } from '@/lib/passportCrypto'
import { PASSPORT_BACKUP_REMINDER_KEY } from '@/lib/passportCipherUi'
import { getOrCreatePassportId } from '@/lib/passportIdentity'
import { usePortal } from '@/contexts/PortalContext'

export function MyRecordView() {
  const { config } = usePortal()
  const { user, profile } = useAuth()
  const { key: passportKey } = usePassportKey()
  const [phraseRows, setPhraseRows] = useState<PhraseHistoryRow[]>([])
  const [affinity, setAffinity] = useState<NodeAffinityProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPassportBackupBanner, setShowPassportBackupBanner] = useState(false)
  const [passportId, setPassportId] = useState<string | null>(null)

  useEffect(() => {
    try {
      setShowPassportBackupBanner(localStorage.getItem(PASSPORT_BACKUP_REMINDER_KEY) === 'active')
    } catch {
      setShowPassportBackupBanner(false)
    }
  }, [])

  const dismissPassportBackupBanner = () => {
    try {
      localStorage.setItem(PASSPORT_BACKUP_REMINDER_KEY, 'dismissed')
    } catch {
      /* ignore */
    }
    setShowPassportBackupBanner(false)
  }

  const downloadPassportKeyFromBanner = async () => {
    const key = await loadKey()
    if (!key) return
    const b64 = await exportKeyAsBase64(key)
    downloadKeyBackup(b64)
    dismissPassportBackupBanner()
  }

  useEffect(() => {
    if (!user?.uid) return

    let cancelled = false
    setLoading(true)

    void getOrCreatePassportId(user.uid).then((id) => {
      if (!cancelled) setPassportId(id)
    })

    void (async () => {
      try {
        const [phrases, aff] = await Promise.all([
          getUserPhraseSummaries(user.uid),
          computeNodeAffinityProfile(user.uid),
        ])
        if (cancelled) return

        const top = phrases.slice(0, 15)
        const histories = await Promise.all(
          top.map((p) => getPhraseSessionHistory(user.uid, p.phraseHash, 24, passportKey))
        )
        if (cancelled) return

        const rows: PhraseHistoryRow[] = top.map((summary, i) => ({
          summary,
          sessions: histories[i] ?? [],
        }))
        setPhraseRows(rows)
        setAffinity(aff)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user?.uid, passportKey])

  return (
    <div className="space-y-8">
      <header className="border-b border-black/8 pb-5 dark:border-white/8">
        <div className="mb-2 flex items-center gap-2 text-gray-400 dark:text-neutral-500">
          <ScrollText className="h-4 w-4" aria-hidden />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">
            {config.copy.recordSectionTitle}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Your {config.copy.practiceLabel.toLowerCase()} record
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{config.heroSubtext}</p>
        {config.features.showPassportPanel && passportId ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-neutral-500">
              {config.copy.passportLabel} ID
            </span>
            <span className="font-mono text-xs tracking-wider text-gray-700 dark:text-gray-300">{passportId}</span>
            <button
              type="button"
              onClick={() => void navigator.clipboard.writeText(passportId)}
              className="text-[10px] text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
              title="Copy to clipboard"
            >
              Copy
            </button>
          </div>
        ) : null}
        {showPassportBackupBanner && (
          <div
            role="status"
            className="mt-4 flex flex-col gap-2 rounded-lg border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100"
          >
            <p>
              Back up your encryption key to protect your personal definitions.{' '}
              <button
                type="button"
                onClick={() => void downloadPassportKeyFromBanner()}
                className="font-medium text-amber-900 underline underline-offset-2 dark:text-amber-200"
              >
                Download key backup
              </button>{' '}
              or{' '}
              <Link href="/settings" className="font-medium underline underline-offset-2">
                open Settings
              </Link>
              .
            </p>
            <button
              type="button"
              onClick={dismissPassportBackupBanner}
              className="self-start text-xs text-amber-800/90 underline dark:text-amber-200/90"
            >
              Dismiss
            </button>
          </div>
        )}
        {config.features.showPassportPanel ? (
          <div className="mt-4">
            <ExportButton variant="full" />
          </div>
        ) : null}
      </header>

      {config.features.showLexiconAnchor ? <LexiconPanel /> : null}
      {config.features.showPhraseProgress ? (
        <PhraseHistoryPanel rows={phraseRows} loading={loading} />
      ) : null}
      {config.features.showNodeAffinity ? <AffinityPanel profile={affinity} loading={loading} /> : null}
      <ResearchStatusPanel
        consentRecord={profile?.researchConsent}
        userId={user?.uid}
        passportKey={passportKey}
      />
      {config.features.showResearchDashboard ? <ResearchDashboard /> : null}
      {config.features.showInstitutionalAccess && user?.uid ? (
        <InstitutionalAccessPanel uid={user.uid} />
      ) : null}
      {config.features.showCredentials && user?.uid ? <CredentialsPanel uid={user.uid} /> : null}
      {config.features.showTeamAggregates ? (
        <section className="rounded-2xl border border-black/8 bg-white/60 px-5 py-5 shadow-sm dark:border-white/8 dark:bg-neutral-950/60">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-neutral-500">
            Team capability
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-neutral-400">
            Team-level aggregates and anonymised group views will appear here in a later release.
          </p>
        </section>
      ) : null}
    </div>
  )
}
