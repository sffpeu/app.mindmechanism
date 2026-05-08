'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { doc, Firestore, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { RESEARCH_PROTOCOL_VERSION } from '@/lib/researchProtocol'
import { excludeUserResearchData } from '@/lib/researchLogging'
import { ResearchConsentFlow } from '@/components/research/ResearchConsentFlow'

function fmtDate(value?: string): string {
  if (!value) return 'Never'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return date.toLocaleDateString()
}

export function ResearchParticipationSettings() {
  const { user, profile, refreshProfile } = useAuth()
  const [updating, setUpdating] = useState<'b' | 'c' | null>(null)
  const [openFlow, setOpenFlow] = useState(false)

  const consent = profile?.researchConsent
  const hasAnyConsentRecord = useMemo(
    () => Boolean(consent?.categoryB || consent?.categoryC),
    [consent?.categoryB, consent?.categoryC]
  )

  const persistConsent = async (category: 'categoryB' | 'categoryC', granted: boolean, key: 'b' | 'c') => {
    if (!db || !user?.uid) return
    setUpdating(key)
    try {
      await setDoc(
        doc(db as Firestore, 'users', user.uid),
        {
          researchConsent: {
            [category]: {
              granted,
              timestamp: new Date().toISOString(),
              protocolVersion: RESEARCH_PROTOCOL_VERSION,
            },
          },
        },
        { merge: true }
      )
      if (category === 'categoryB' && !granted) {
        await excludeUserResearchData(user.uid)
      }
      await refreshProfile()
    } finally {
      setUpdating(null)
    }
  }

  return (
    <>
      <Card className="p-4 bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">Research participation</p>
          <p className="text-xs text-neutral-300 dark:text-neutral-700">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Manage optional anonymised data contribution for the Mind Mechanism research programme.
          </p>
        </div>

        {!hasAnyConsentRecord ? (
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-950/40 p-3 space-y-2">
            <p className="text-sm text-gray-700 dark:text-gray-300">You have not been asked about research participation yet.</p>
            <button type="button" onClick={() => setOpenFlow(true)} className="text-sm underline text-gray-600 dark:text-gray-300">
              Learn more and choose →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3 bg-white/70 dark:bg-neutral-950/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Usage patterns</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Anonymised wheel assignments and node usage.</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Last updated: {fmtDate(consent?.categoryB?.timestamp)}</p>
                </div>
                <Switch
                  checked={Boolean(consent?.categoryB?.granted)}
                  disabled={updating === 'b'}
                  onCheckedChange={(value) => void persistConsent('categoryB', value, 'b')}
                  aria-label="Toggle usage patterns consent"
                />
              </div>
            </div>

            <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3 bg-white/70 dark:bg-neutral-950/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Practice progress</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Acoustic pattern data from phrase sessions.</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Last updated: {fmtDate(consent?.categoryC?.timestamp)}</p>
                </div>
                <Switch
                  checked={Boolean(consent?.categoryC?.granted)}
                  disabled={updating === 'c'}
                  onCheckedChange={(value) => void persistConsent('categoryC', value, 'c')}
                  aria-label="Toggle practice progress consent"
                />
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3 text-xs text-gray-500 dark:text-gray-400 leading-relaxed space-y-1">
          <p>Turning either option off stops data collection immediately.</p>
          <p>Your existing contributions are flagged as excluded from future research aggregations.</p>
          <p>Your access to all features remains unchanged.</p>
        </div>

        <Link href="/research" className="text-sm underline text-gray-600 dark:text-gray-300">
          View what this research is building →
        </Link>
      </Card>

      <ResearchConsentFlow open={openFlow} onClose={() => setOpenFlow(false)} />
    </>
  )
}
