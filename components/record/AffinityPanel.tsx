'use client'

import { useMemo } from 'react'
import { clockTitles } from '@/lib/clockTitles'
import type { NodeAffinityProfile } from '@/lib/nodeAffinity'
import { NodeAffinityMap } from '@/components/sequencer/NodeAffinityMap'

export function AffinityPanel({
  profile,
  loading,
}: {
  profile: NodeAffinityProfile | null
  loading: boolean
}) {
  const interpretive = useMemo(() => {
    if (!profile || profile.totalSessions < 3 || profile.totalFires === 0) return null
    const dominant = profile.vector
      .map((v, i) => ({ i, v }))
      .filter((x) => x.v > 0.2)
      .sort((a, b) => b.v - a.v)
      .slice(0, 2)
    if (dominant.length === 0) return null
    const names = dominant.map((d) => clockTitles[d.i] ?? `Wheel ${d.i}`)
    if (names.length === 1) {
      return `Your practice has been centred on ${names[0]}.`
    }
    return `Your practice has been centred on ${names[0]} and ${names[1]}. These nodes carry your most sustained engagement.`
  }, [profile])

  if (loading || profile === null) {
    return (
      <section className="rounded-2xl border border-black/8 bg-white/60 px-5 py-5 shadow-sm dark:border-white/8 dark:bg-neutral-950/60">
        <div className="h-40 animate-pulse rounded-lg bg-gray-100/90 dark:bg-white/5" />
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-black/8 bg-white/60 px-5 py-5 shadow-sm dark:border-white/8 dark:bg-neutral-950/60">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-neutral-500">
        Practice map — last 28 days
      </p>
      <div className="my-3 border-t border-black/8 dark:border-white/8" />

      {profile.totalSessions > 0 ? (
        <p className="mb-4 text-[11px] text-gray-500 dark:text-neutral-400">
          {profile.totalSessions} session{profile.totalSessions !== 1 ? 's' : ''} ·{' '}
          {profile.totalFires.toLocaleString()} steps
        </p>
      ) : null}

      <NodeAffinityMap profile={profile} />

      {profile.totalFires === 0 ? null : profile.totalSessions < 3 ? (
        <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-neutral-400">
          Your practice map is taking shape. Keep going.
        </p>
      ) : interpretive ? (
        <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-neutral-300">{interpretive}</p>
      ) : null}
    </section>
  )
}
