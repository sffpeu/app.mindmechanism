'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { fetchPersonalLexiconWheelCounts } from '@/lib/personalLexiconStats'
import { clockTitles } from '@/lib/clockTitles'
import { TRACK_COLORS } from '@/components/StepSequencer'
import { cn } from '@/lib/utils'

export function LexiconPanel() {
  const { user } = useAuth()
  const [total, setTotal] = useState(0)
  const [byWheel, setByWheel] = useState<number[]>(() => Array(9).fill(0))
  const [loading, setLoading] = useState(true)

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

  const wheelsWithWords = byWheel.filter((n) => n > 0).length

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
