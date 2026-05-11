'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { doc, getDoc, type Firestore } from 'firebase/firestore'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { db } from '@/lib/firebase'
import { fetchPersonalLexiconWheelCounts } from '@/lib/personalLexiconStats'
import { clockTitles } from '@/lib/clockTitles'
import { TRACK_COLORS } from '@/components/StepSequencer'
import { cn } from '@/lib/utils'
import {
  anchorLexicon,
  verifyLexiconAnchor,
  type LexiconAnchorRecord,
} from '@/lib/lexiconAnchor'
import { RESEARCH_PROTOCOL_VERSION } from '@/lib/researchProtocol'

function fmtAnchorDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

type PassportLexMeta = {
  merkleRoot: string
  wordCount: number
  at: string
  tx: string | null
}

function readLexMeta(data: Record<string, unknown> | undefined): PassportLexMeta | null {
  if (!data) return null
  const merkleRoot = data.latest_lexicon_anchor
  const at = data.latest_lexicon_anchor_at
  if (typeof merkleRoot !== 'string' || merkleRoot.length !== 64 || typeof at !== 'string') return null
  const wordCount = data.latest_lexicon_word_count
  const tx = data.latest_lexicon_anchor_tx
  return {
    merkleRoot,
    at,
    wordCount: typeof wordCount === 'number' ? wordCount : 0,
    tx: typeof tx === 'string' && tx.length > 0 ? tx : null,
  }
}

export function LexiconPanel() {
  const { user } = useAuth()
  const [total, setTotal] = useState(0)
  const [byWheel, setByWheel] = useState<number[]>(() => Array(9).fill(0))
  const [loading, setLoading] = useState(true)
  const [lexMeta, setLexMeta] = useState<PassportLexMeta | null>(null)
  const [anchorBusy, setAnchorBusy] = useState(false)
  const [anchorHint, setAnchorHint] = useState<string | null>(null)
  const [verifyResult, setVerifyResult] = useState<'match' | 'changed' | null>(null)

  const loadPassportMeta = useCallback(async () => {
    if (!user?.uid || !db) {
      setLexMeta(null)
      return
    }
    const snap = await getDoc(doc(db as Firestore, 'passport', user.uid))
    setLexMeta(readLexMeta(snap.data() as Record<string, unknown> | undefined))
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false)
      return
    }
    let cancelled = false
    void fetchPersonalLexiconWheelCounts(user.uid).then((r) => {
      if (!cancelled) {
        setTotal(r.total)
        setByWheel(r.byWheel)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [user?.uid])

  useEffect(() => {
    void loadPassportMeta()
  }, [loadPassportMeta, total])

  const wheelsWithWords = byWheel.filter((n) => n > 0).length

  const handleAnchor = async () => {
    if (!user?.uid) return
    setAnchorBusy(true)
    setAnchorHint(null)
    setVerifyResult(null)
    try {
      const r = await anchorLexicon(user.uid)
      if (r && !r.txHash) {
        setAnchorHint('Anchored locally on record — chain confirmation pending.')
      }
      await loadPassportMeta()
    } finally {
      setAnchorBusy(false)
    }
  }

  const handleVerify = async () => {
    if (!user?.uid || !lexMeta) return
    const anchor: LexiconAnchorRecord = {
      merkleRoot: lexMeta.merkleRoot,
      wordCount: lexMeta.wordCount,
      anchoredAt: lexMeta.at,
      txHash: lexMeta.tx,
      chainId: 137,
      protocolVersion: RESEARCH_PROTOCOL_VERSION,
    }
    const ok = await verifyLexiconAnchor(user.uid, anchor)
    setVerifyResult(ok ? 'match' : 'changed')
  }

  return (
    <section className="rounded-2xl border border-black/8 bg-white/60 px-5 py-5 shadow-sm dark:border-white/8 dark:bg-neutral-950/60">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-neutral-500">
        Your words
      </p>
      <div className="my-3 border-t border-black/8 dark:border-white/8" />

      {loading ? (
        <div className="h-24 animate-pulse rounded-lg bg-gray-100/90 dark:bg-white/5" />
      ) : total === 0 ? (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-gray-600 dark:text-neutral-300">
            This is your space. Any word you use belongs here.
          </p>
          <Link
            href="/glossary?tab=personal"
            className="inline-block text-sm font-medium text-violet-600 underline underline-offset-2 hover:text-violet-500 dark:text-violet-400"
          >
            Add your word →
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-gray-900 dark:text-white">{total}</span>
            <span className="text-sm text-gray-500 dark:text-neutral-400">
              personal word{total === 1 ? '' : 's'} across {wheelsWithWords} wheel{wheelsWithWords === 1 ? '' : 's'}
            </span>
          </div>

          <ul className="mt-4 space-y-2">
            {clockTitles.map((title, i) => {
              const n = byWheel[i] ?? 0
              const max = Math.max(1, ...byWheel)
              const pct = max > 0 ? (n / max) * 100 : 0
              const hex = TRACK_COLORS[i] ?? '#888'
              return (
                <li
                  key={title}
                  className={cn('flex items-center gap-2 text-[11px] sm:text-xs', n === 0 && 'opacity-40')}
                >
                  <span className="w-28 shrink-0 truncate font-medium uppercase tracking-wide text-gray-600 dark:text-neutral-400">
                    {title}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200/80 dark:bg-white/10">
                      <div
                        className="h-full rounded-full transition-[width]"
                        style={{ width: `${pct}%`, backgroundColor: hex }}
                      />
                    </div>
                  </div>
                  <span className="w-8 shrink-0 tabular-nums text-right text-gray-700 dark:text-neutral-200">{n}</span>
                </li>
              )
            })}
          </ul>

          <div className="mt-4 rounded-xl border border-black/6 bg-white/40 px-3 py-3 dark:border-white/10 dark:bg-neutral-900/40">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-neutral-500">
              Ownership record
            </p>
            {lexMeta ? (
              <p className="mt-2 text-xs leading-relaxed text-gray-600 dark:text-neutral-300">
                Last anchored: {fmtAnchorDate(lexMeta.at)} · {lexMeta.wordCount} word{lexMeta.wordCount === 1 ? '' : 's'}
                {lexMeta.tx ? (
                  <>
                    {' · '}
                    <a
                      href={`https://polygonscan.com/tx/${lexMeta.tx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-600 underline underline-offset-2 hover:text-violet-500 dark:text-violet-400"
                    >
                      Verify on Polygon ↗
                    </a>
                  </>
                ) : null}
              </p>
            ) : (
              <p className="mt-2 text-xs leading-relaxed text-gray-600 dark:text-neutral-300">
                No on-chain anchor yet. Anchor a merkle fingerprint of your word identities (not encrypted notes) on
                Polygon.
              </p>
            )}
            <button
              type="button"
              onClick={() => void handleAnchor()}
              disabled={anchorBusy}
              className="mt-2 text-left text-sm font-medium text-violet-600 underline underline-offset-2 hover:text-violet-500 disabled:opacity-50 dark:text-violet-400"
            >
              {anchorBusy ? 'Anchoring…' : lexMeta ? 'Anchor now' : 'Anchor my lexicon'}
            </button>
            {anchorHint && (
              <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">{anchorHint}</p>
            )}
            {lexMeta && (
              <>
                <button
                  type="button"
                  onClick={() => void handleVerify()}
                  className="mt-2 block text-left text-[11px] text-gray-500 underline underline-offset-2 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  Verify integrity →
                </button>
                {verifyResult === 'match' && (
                  <p className="mt-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                    Lexicon matches anchor.
                  </p>
                )}
                {verifyResult === 'changed' && (
                  <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-400">
                    Lexicon has changed since last anchor. Use &quot;Anchor now&quot; to record an updated snapshot.
                  </p>
                )}
              </>
            )}
          </div>

          <Link
            href="/glossary?tab=personal"
            className="mt-4 inline-block text-sm text-violet-600 underline underline-offset-2 hover:text-violet-500 dark:text-violet-400"
          >
            Open your personal lexicon →
          </Link>
        </>
      )}
    </section>
  )
}
