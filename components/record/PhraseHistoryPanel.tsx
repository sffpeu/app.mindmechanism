'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { PhraseSummary, PhraseSession } from '@/lib/phraseProgress'

export type PhraseHistoryRow = {
  summary: PhraseSummary
  sessions: PhraseSession[]
}

function MiniSparkline({ sessions }: { sessions: PhraseSession[] }) {
  const pts = useMemo(() => {
    if (sessions.length < 2) return ''
    const scores = sessions.map((s) => Math.min(100, Math.max(0, s.consistencyScore)))
    const w = 48
    const h = 16
    const pad = 2
    const innerW = w - pad * 2
    const innerH = h - pad * 2
    return scores
      .map((sc, i) => {
        const x = pad + (i / (scores.length - 1)) * innerW
        const y = pad + innerH - (sc / 100) * innerH
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }, [sessions])

  if (sessions.length < 2) {
    return <div className="h-4 w-12 rounded-sm bg-gray-100 dark:bg-white/5" aria-hidden />
  }

  return (
    <svg width={48} height={16} viewBox="0 0 48 16" className="shrink-0 overflow-visible" aria-hidden>
      <polyline
        fill="none"
        className="stroke-current text-violet-500/80 dark:text-violet-400/90"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts}
      />
    </svg>
  )
}

function scoreTone(score: number): string {
  if (score >= 70) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 40) return 'text-amber-600 dark:text-amber-400'
  return 'text-gray-500 dark:text-neutral-500'
}

export function PhraseHistoryPanel({
  rows,
  loading,
}: {
  rows: PhraseHistoryRow[]
  loading: boolean
}) {
  const [visible, setVisible] = useState(false)
  const displayRows = visible ? rows : rows.slice(0, 10)
  const hasMore = rows.length > 10

  return (
    <section className="rounded-2xl border border-black/8 bg-white/60 px-5 py-5 shadow-sm dark:border-white/8 dark:bg-neutral-950/60">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-neutral-500">
        Phrase progress
      </p>
      <div className="my-3 border-t border-black/8 dark:border-white/8" />

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((k) => (
            <div key={k} className="h-10 animate-pulse rounded-lg bg-gray-100/90 dark:bg-white/5" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm leading-relaxed text-gray-500 dark:text-neutral-400">
          Complete a phrase session in the sequencer to start your record.{' '}
          <Link href="/sequencer" className="font-medium text-violet-600 underline underline-offset-2 dark:text-violet-400">
            Open sequencer →
          </Link>
        </p>
      ) : (
        <>
          <ul className="space-y-1">
            {displayRows.map(({ summary, sessions }) => {
              const latest = summary.latestScore
              const oldest =
                sessions.length > 0 ? sessions[0]!.consistencyScore : latest
              const up = sessions.length >= 2 && latest > oldest
              const down = sessions.length >= 2 && latest < oldest
              const label = summary.phrase.trim() || 'Phrase'

              return (
                <li
                  key={summary.phraseHash}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-2 py-2 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                >
                  <span className="min-w-0 flex-1 truncate text-sm text-gray-800 dark:text-neutral-100">{label}</span>
                  <MiniSparkline sessions={sessions} />
                  <span className={cn('flex items-center gap-1 text-sm font-semibold tabular-nums', scoreTone(latest))}>
                    {latest}%
                    {sessions.length >= 2 ? (
                      <span className="text-[10px] font-normal text-gray-400" aria-hidden>
                        {up ? '↑' : down ? '↓' : '→'}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[11px] tabular-nums text-gray-400 dark:text-neutral-500">
                    {summary.sessionCount} session{summary.sessionCount !== 1 ? 's' : ''}
                  </span>
                </li>
              )
            })}
          </ul>
          {hasMore ? (
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="mt-3 text-xs font-medium text-violet-600 underline underline-offset-2 dark:text-violet-400"
            >
              {visible ? 'Show fewer' : `Show all (${rows.length}) →`}
            </button>
          ) : null}
        </>
      )}
    </section>
  )
}
