'use client'

import { formatDistanceToNow } from 'date-fns'
import type { SymbolicLobbyEntry } from '@/lib/symbolicLobby'
import { cn } from '@/lib/utils'

/** Deterministic layout in the orbit so positions stay stable across refreshes. */
export function lobbySlotForId(id: string): { x: number; y: number; delay: number; duration: number } {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const u = (h >>> 0) / 0xffffffff
  const v = ((h >>> 8) & 0xffffff) / 0xffffff
  return {
    x: 14 + u * 72,
    y: 14 + v * 72,
    delay: ((h >>> 16) % 5000) / 1000,
    duration: 11 + ((h >>> 20) % 8000) / 1000,
  }
}

type LobbySatelliteFieldProps = {
  myEntry: SymbolicLobbyEntry | null
  others: SymbolicLobbyEntry[]
  aligned: Set<string>
  busyId: string | null
  onAlignPeer: (entry: SymbolicLobbyEntry) => void
}

export function LobbySatelliteField({
  myEntry,
  others,
  aligned,
  busyId,
  onAlignPeer,
}: LobbySatelliteFieldProps) {
  const mineConnected = myEntry != null && myEntry.symbolic_alignments > 0

  return (
    <div
      className="relative mb-6 min-h-[min(320px,42vh)] w-full overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-slate-950/90 via-violet-950/40 to-slate-950/95 dark:from-black dark:via-violet-950/30 dark:to-black"
      aria-label="Symbolic lobby space"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.25]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(139,92,246,0.22),transparent_55%)]" />
      </div>

      <p className="pointer-events-none absolute left-3 top-3 right-3 z-10 text-[10px] leading-snug text-white/55 sm:text-xs sm:text-white/60">
        Satellites drift anonymously. Tap another to connect symbolically — no messages are exchanged.
      </p>

      <div className="absolute bottom-2 left-3 right-3 z-10 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-white/50">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
          Awaiting connection (yours flashes)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          Connection established
        </span>
      </div>

      {myEntry && (
        <div
          className="lobby-satellite-float pointer-events-none absolute z-20"
          style={{
            left: '36%',
            top: '44%',
            animationDuration: '13s',
            animationDelay: '0s',
          }}
          role="status"
          aria-live="polite"
          aria-label={
            mineConnected
              ? 'Your satellite: symbolic connection established'
              : 'Your satellite: awaiting symbolic connection'
          }
        >
          <div
            className={cn(
              'relative flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ring-2 ring-white/25 transition-colors duration-500',
              mineConnected
                ? 'lobby-satellite-connected shadow-[0_0_20px_rgba(52,211,153,0.75)]'
                : 'lobby-satellite-awaiting shadow-[0_0_16px_rgba(255,255,255,0.45)]'
            )}
          >
            <span className="h-5 w-5 rounded-full bg-current opacity-95" />
          </div>
          <span className="absolute left-1/2 top-[calc(100%+6px)] -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-white/70">
            You
          </span>
        </div>
      )}

      {others.map((entry) => {
        const { x, y, delay, duration } = lobbySlotForId(entry.id)
        const done = aligned.has(entry.id)
        const loading = busyId === entry.id
        return (
          <div
            key={entry.id}
            className="lobby-satellite-float absolute z-10"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          >
            <button
              type="button"
              disabled={busyId !== null || done}
              onClick={() => onAlignPeer(entry)}
              title={`Anonymous presence — here ${formatDistanceToNow(entry.created_at.toDate(), { addSuffix: true })}. Tap to connect symbolically.`}
              className={cn(
                'flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ring-2 transition-all duration-300',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
                done
                  ? 'cursor-default bg-emerald-500/35 ring-emerald-300/50 shadow-[0_0_14px_rgba(52,211,153,0.45)]'
                  : 'cursor-pointer bg-white/15 ring-white/35 hover:bg-white/25 hover:ring-white/55 active:scale-95',
                loading && 'pointer-events-none opacity-60'
              )}
              aria-label={
                done
                  ? 'Symbolic connection already established with this presence'
                  : 'Establish symbolic connection with this anonymous presence'
              }
            >
              <span
                className={cn(
                  'h-4 w-4 rounded-full',
                  done ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]' : 'bg-white/90 shadow-[0_0_10px_rgba(255,255,255,0.5)]'
                )}
              />
            </button>
          </div>
        )
      })}

      {!myEntry && others.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/45">
          Appear anonymously to place your satellite in this space.
        </div>
      )}
    </div>
  )
}
