'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { doc, Firestore, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { RESEARCH_PROTOCOL_VERSION } from '@/lib/researchProtocol'
import { anchorConsentEvent } from '@/lib/consentAnchor'
import { hashUid, updateConsentAnchor } from '@/lib/researchLogging'

type ConsentStep = 1 | 2 | 3 | 4

interface ResearchConsentFlowProps {
  open: boolean
  onClose: () => void
}

function nowIso(): string {
  return new Date().toISOString()
}

export function ResearchConsentFlow({ open, onClose }: ResearchConsentFlowProps) {
  const { user, refreshProfile } = useAuth()
  const [step, setStep] = useState<ConsentStep>(1)
  const [consentB, setConsentB] = useState<boolean | null>(null)
  const [consentC, setConsentC] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)

  const canConfirm = useMemo(() => consentB !== null && consentC !== null, [consentB, consentC])

  if (!open) return null

  const closeAndReset = () => {
    setStep(1)
    setConsentB(null)
    setConsentC(null)
    onClose()
  }

  const writeConsent = async (payload: Record<string, unknown>) => {
    if (!user?.uid || !db) return
    await setDoc(doc(db as Firestore, 'users', user.uid), payload, { merge: true })
    await refreshProfile()
  }

  const handleNeverAskAgain = async () => {
    await writeConsent({ researchConsent: { neverAsk: true, lastPromptedAt: nowIso() } })
    closeAndReset()
  }

  const handleRemindLater = async () => {
    await writeConsent({ researchConsent: { lastPromptedAt: nowIso() } })
    closeAndReset()
  }

  const handleConfirm = async () => {
    if (!canConfirm) return
    setSaving(true)
    const timestamp = nowIso()
    try {
      await writeConsent({
        researchConsent: {
          categoryB: {
            granted: consentB,
            timestamp,
            protocolVersion: RESEARCH_PROTOCOL_VERSION,
          },
          categoryC: {
            granted: consentC,
            timestamp,
            protocolVersion: RESEARCH_PROTOCOL_VERSION,
          },
          lastPromptedAt: timestamp,
          neverAsk: false,
        },
      })

      if (user?.uid) {
        const userHash = await hashUid(user.uid)
        const anchors: Promise<unknown>[] = []

        if (consentB !== null) {
          anchors.push(
            anchorConsentEvent(
              userHash,
              'B',
              consentB ? 'grant' : 'withdraw',
              RESEARCH_PROTOCOL_VERSION
            ).then((txHash) => {
              if (txHash) void updateConsentAnchor(user.uid, 'categoryB', txHash)
              return txHash
            })
          )
        }
        if (consentC !== null) {
          anchors.push(
            anchorConsentEvent(
              userHash,
              'C',
              consentC ? 'grant' : 'withdraw',
              RESEARCH_PROTOCOL_VERSION
            ).then((txHash) => {
              if (txHash) void updateConsentAnchor(user.uid, 'categoryC', txHash)
              return txHash
            })
          )
        }
        void Promise.allSettled(anchors)
      }

      closeAndReset()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="w-full max-w-[480px] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-2xl p-6">
        <div className="mb-5">
          <div className="h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <div className="h-full bg-neutral-600 dark:bg-neutral-300 transition-all" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
          <p className="mt-2 text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            Step {step} of 4
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Contributing to the research</h2>
            <p className="text-xs text-neutral-300 dark:text-neutral-700">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Mind Mechanism is built on a testable hypothesis: that certain words and sounds carry consistent somatic
              meaning across languages and cultures. We do not know yet whether that is true at scale.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              You can help us find out anonymously, with full control over what you share and when you stop.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">This takes 2 minutes to read. It matters.</p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-4 py-2.5 text-sm font-medium"
              >
                Continue
              </button>
              <button type="button" onClick={() => void handleNeverAskAgain()} className="text-[11px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                Never ask again
              </button>
              <button type="button" onClick={() => void handleRemindLater()} className="block text-[11px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                Not now — remind me later
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Option 1 — Usage patterns</h2>
            <p className="text-xs text-neutral-300 dark:text-neutral-700">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
            <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Anonymised</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              If you turn this on, we collect anonymised usage patterns: which wheels you assign words to, how often
              you practice in general terms, and which nodes you use in sequences.
            </p>
            <div className="border-l-2 border-neutral-300 dark:border-neutral-700 pl-3 py-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              We do not collect the words themselves, your name, your location, or your recordings.
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              This data is used to test whether people across languages tend to assign similar kinds of words to the
              same wheels. We publish findings. We do not sell the data.
            </p>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => { setConsentB(true); setStep(3) }} className="flex-1 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-4 py-2.5 text-sm font-medium">
                Turn on usage patterns
              </button>
              <button type="button" onClick={() => { setConsentB(false); setStep(3) }} className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-2.5 text-sm">
                Skip this one
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Option 2 — Practice progress</h2>
            <p className="text-xs text-neutral-300 dark:text-neutral-700">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Acoustic patterns · Anonymised · Separate from Option 1</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              This option is separate from Option 1. You can turn it on without Option 1, or vice versa.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              If you use the phrase analyser and turn this on, we collect numerical stress and rhythm patterns from
              your recordings, not the audio itself. Audio always remains on your device.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              These numbers are treated with the same care as health data. They are never used to identify you, assess
              you, or make decisions about you.
            </p>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => { setConsentC(true); setStep(4) }} className="flex-1 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-4 py-2.5 text-sm font-medium">
                Turn on practice progress
              </button>
              <button type="button" onClick={() => { setConsentC(false); setStep(4) }} className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-2.5 text-sm">
                Skip this one
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Your choices</h2>
            <p className="text-xs text-neutral-300 dark:text-neutral-700">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Usage patterns</span>
                <span className="font-medium">{consentB ? 'On' : 'Off'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300">Practice progress</span>
                <span className="font-medium">{consentC ? 'On' : 'Off'}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              You can change these at any time in Settings → Research Participation. Turning either option off stops
              collection immediately.
            </p>
            <button
              type="button"
              disabled={!canConfirm || saving}
              onClick={() => void handleConfirm()}
              className="w-full rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-4 py-2.5 text-sm font-medium disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Confirm'}
            </button>
          </div>
        )}
        <div className="mt-5 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <p className="mt-0 text-xs text-gray-400 dark:text-gray-500">
            Weitere Informationen:{' '}
            <Link
              href="/datenschutz"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              Datenschutzerklärung
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
