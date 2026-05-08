'use client'

import { useEffect, useState } from 'react'
import { ScrollText } from 'lucide-react'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { getUserPhraseSummaries, getPhraseSessionHistory } from '@/lib/phraseProgress'
import { computeNodeAffinityProfile, type NodeAffinityProfile } from '@/lib/nodeAffinity'
import { LexiconPanel } from '@/components/record/LexiconPanel'
import { PhraseHistoryPanel, type PhraseHistoryRow } from '@/components/record/PhraseHistoryPanel'
import { AffinityPanel } from '@/components/record/AffinityPanel'
import { ResearchStatusPanel } from '@/components/record/ResearchStatusPanel'

export function MyRecordView() {
  const { user, profile } = useAuth()
  const [phraseRows, setPhraseRows] = useState<PhraseHistoryRow[]>([])
  const [affinity, setAffinity] = useState<NodeAffinityProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) return

    let cancelled = false
    setLoading(true)

    void (async () => {
      try {
        const [phrases, aff] = await Promise.all([
          getUserPhraseSummaries(user.uid),
          computeNodeAffinityProfile(user.uid),
        ])
        if (cancelled) return

        const top = phrases.slice(0, 15)
        const histories = await Promise.all(
          top.map((p) => getPhraseSessionHistory(user.uid, p.phraseHash, 24))
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
  }, [user?.uid])

  return (
    <div className="space-y-8">
      <header className="border-b border-black/8 pb-5 dark:border-white/8">
        <div className="mb-2 flex items-center gap-2 text-gray-400 dark:text-neutral-500">
          <ScrollText className="h-4 w-4" aria-hidden />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">My Record</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Your practice record</h1>
        <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          Everything the platform holds that belongs to you.
        </p>
      </header>

      <LexiconPanel />
      <PhraseHistoryPanel rows={phraseRows} loading={loading} />
      <AffinityPanel profile={affinity} loading={loading} />
      <ResearchStatusPanel consentRecord={profile?.researchConsent} />
    </div>
  )
}
