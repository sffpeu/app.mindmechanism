'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { clockTitles } from '@/lib/clockTitles'
import type { NodeAffinityProfile } from '@/lib/nodeAffinity'
import { TRACK_COLORS } from '@/components/StepSequencer'

/** Visual grid order: row-major 3×3 per brief */
const GRID_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const

export interface NodeAffinityMapProps {
  profile: NodeAffinityProfile
}

export function NodeAffinityMap({ profile }: NodeAffinityMapProps) {
  const dominantIdx = useMemo(() => {
    let best = 0
    let max = -1
    profile.vector.forEach((v, i) => {
      if (v > max) {
        max = v
        best = i
      }
    })
    return max > 0 ? best : -1
  }, [profile.vector])

  if (profile.totalFires === 0) {
    return (
      <p className="text-center text-xs text-gray-400 dark:text-neutral-500">
        Your practice map builds as you use the sequencer.
        <br />
        Each session shapes the picture.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {GRID_ORDER.map((i) => {
        const pct = profile.vector[i] ?? 0
        const showPct = pct > 0
        const hex = TRACK_COLORS[i] ?? '#888888'
        const isDom = dominantIdx === i && pct > 0
        const fillPct = Math.round(pct * 100)

        return (
          <div
            key={i}
            className={cn(
              'relative flex min-h-[72px] flex-col overflow-hidden rounded-lg border border-black/6 dark:border-white/8',
              pct === 0 && 'opacity-45',
              isDom && 'outline outline-2 outline-offset-2'
            )}
            style={{
              backgroundColor: pct > 0 ? `${hex}14` : undefined,
              outlineColor: isDom ? hex : undefined,
            }}
          >
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 opacity-90"
              style={{
                height: `${fillPct}%`,
                backgroundColor: pct > 0 ? `${hex}55` : 'transparent',
              }}
            />
            <div className="relative z-[1] flex flex-1 flex-col justify-between p-1.5 sm:p-2">
              <div
                className="text-[9px] font-medium uppercase leading-tight tracking-widest"
                style={{ color: hex }}
              >
                {clockTitles[i] ?? `Wheel ${i}`}
              </div>
              {showPct ? (
                <div className="text-[11px] font-semibold tabular-nums text-gray-800 dark:text-gray-100">
                  {fillPct}%
                </div>
              ) : (
                <div className="text-[11px] text-gray-300 dark:text-neutral-600">—</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
