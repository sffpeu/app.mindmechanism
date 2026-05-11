'use client'

import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  getPhraseSessionHistory,
  getPhraseSummaryDoc,
  type PhraseSession,
} from '@/lib/phraseProgress'
import { usePassportKey } from '@/components/passport/PassportKeyProvider'

const CHART_H = 80
const VIEW_W = 400
const PAD_X = 16
const PAD_TOP = 12
const PAD_BOTTOM = 12

export interface PhraseProgressCurveProps {
  uid: string
  phraseHash: string
  refreshKey: number
  phraseText: string
  /** Tailwind stroke colour for the line (e.g. text-violet-500). */
  strokeClassName?: string
}

export function PhraseProgressCurve({
  uid,
  phraseHash,
  refreshKey,
  phraseText,
  strokeClassName = 'text-violet-500',
}: PhraseProgressCurveProps) {
  const { key: passportKey } = usePassportKey()
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<PhraseSession[]>([])
  const [bestScore, setBestScore] = useState(0)
  const [sessionCount, setSessionCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const [hist, summary] = await Promise.all([
          getPhraseSessionHistory(uid, phraseHash, 40, passportKey),
          getPhraseSummaryDoc(uid, phraseHash),
        ])
        if (cancelled) return
        setSessions(hist)
        const count = summary?.sessionCount ?? hist.length
        setSessionCount(count)
        const best =
          summary?.bestScore ??
          (hist.length ? Math.max(...hist.map((s) => s.consistencyScore), 0) : 0)
        setBestScore(best)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [uid, phraseHash, refreshKey, passportKey])

  const plotInnerH = CHART_H - PAD_TOP - PAD_BOTTOM

  const polylinePoints = useMemo(() => {
    const n = sessions.length
    if (n < 2) return ''
    const innerW = VIEW_W - PAD_X * 2
    return sessions
      .map((s, i) => {
        const x = PAD_X + (i / (n - 1)) * innerW
        const t = Math.min(100, Math.max(0, s.consistencyScore))
        const y = PAD_TOP + plotInnerH - (t / 100) * plotInnerH
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }, [sessions, plotInnerH])

  const latestPoint = useMemo(() => {
    const n = sessions.length
    if (n < 2) return null
    const innerW = VIEW_W - PAD_X * 2
    const i = n - 1
    const s = sessions[i]!
    const x = PAD_X + (i / (n - 1)) * innerW
    const t = Math.min(100, Math.max(0, s.consistencyScore))
    const y = PAD_TOP + plotInnerH - (t / 100) * plotInnerH
    return { x, y }
  }, [sessions, plotInnerH])

  const bestLineY = useMemo(() => {
    const t = Math.min(100, Math.max(0, bestScore))
    return PAD_TOP + plotInnerH - (t / 100) * plotInnerH
  }, [bestScore, plotInnerH])

  if (loading) {
    return (
      <div className="mb-6 rounded-2xl border border-black/8 bg-white/60 px-5 py-4 shadow-sm dark:border-white/8 dark:bg-neutral-950/60">
        <div className="h-3 w-28 animate-pulse rounded bg-gray-200/80 dark:bg-white/10" />
        <div className="mt-2 h-[80px] w-full animate-pulse rounded-md bg-gray-100/90 dark:bg-white/5" />
      </div>
    )
  }

  if (sessions.length < 2) {
    return (
      <div className="mb-6 rounded-2xl border border-black/8 bg-white/60 px-5 py-4 shadow-sm dark:border-white/8 dark:bg-neutral-950/60">
        <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400 dark:text-neutral-500">
          Phrase progression
        </p>
        <p className="mt-2 text-xs text-gray-500 dark:text-neutral-400">
          Complete another session to see your progression.
        </p>
      </div>
    )
  }

  return (
    <div className="mb-6 rounded-2xl border border-black/8 bg-white/60 px-5 py-4 shadow-sm dark:border-white/8 dark:bg-neutral-950/60">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-neutral-500">
            Phrase progression
          </p>
          <p className="text-[10px] text-gray-400 dark:text-neutral-500">
            {sessionCount} session{sessionCount === 1 ? '' : 's'}
            {phraseText ? (
              <span className="ml-2 text-neutral-500 dark:text-neutral-400">
                — <span className="italic">{phraseText.slice(0, 48)}</span>
                {phraseText.length > 48 ? '…' : ''}
              </span>
            ) : null}
          </p>
        </div>
        <p className="text-[10px] tabular-nums text-gray-400 dark:text-neutral-500">
          Best: <span className="font-semibold text-gray-600 dark:text-neutral-300">{bestScore}</span>
        </p>
      </div>

      <svg
        className={cn('w-full', strokeClassName)}
        viewBox={`0 0 ${VIEW_W} ${CHART_H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Consistency score across sessions"
      >
        <line
          x1={PAD_X}
          y1={bestLineY}
          x2={VIEW_W - PAD_X}
          y2={bestLineY}
          className="stroke-gray-300 dark:stroke-neutral-600"
          strokeWidth={1}
          strokeDasharray="5 5"
          opacity={0.65}
        />
        <polyline
          fill="none"
          className={cn('stroke-current', strokeClassName)}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          points={polylinePoints}
        />
        {latestPoint ? (
          <circle
            cx={latestPoint.x}
            cy={latestPoint.y}
            r={5}
            className={cn('fill-current', strokeClassName)}
          />
        ) : null}
      </svg>
    </div>
  )
}
