'use client'

import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import type { LobbyGroup } from '@/lib/lobbyGroups'
import { LOBBY_GROUP_MAX } from '@/lib/lobbyGroups'
import { lobbyFlowerOffsets } from '@/lib/lobbyFlowerLayout'
import { cn } from '@/lib/utils'

/** Deterministic anchor in the orbit for drifting group clusters. */
export function lobbySlotForId(id: string): { x: number; y: number; delay: number; duration: number } {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const u = (h >>> 0) / 0xffffffff
  const v = ((h >>> 8) & 0xffffff) / 0xffffff
  return {
    x: 12 + u * 76,
    y: 18 + v * 62,
    delay: ((h >>> 16) % 5000) / 1000,
    duration: 11 + ((h >>> 20) % 8000) / 1000,
  }
}

function GroupFlower({
  group,
  userId,
  compact,
  gold,
}: {
  group: LobbyGroup
  userId?: string
  compact: boolean
  gold: boolean
}) {
  const ordered = [...group.member_uids].sort()
  const n = ordered.length
  const cap = group.member_cap
  const offsets = lobbyFlowerOffsets(n, cap)
  const dotScale = compact
    ? 1
    : n >= 60
      ? 0.4
      : n >= 30
        ? 0.55
        : n >= 10
          ? 0.85
          : 1
  const baseDot = compact ? 9 : n > 60 ? 5 : n > 30 ? 7 : 11

  return (
    <>
      {ordered.map((uid, i) => {
        const o = offsets[i] ?? { x: 0, y: 0 }
        const isMe = uid === userId
        const w = baseDot
        const h = baseDot
        return (
          <div
            key={`${group.id}-${uid}`}
            className="absolute flex flex-col items-center justify-center"
            style={{
              left: `calc(50% + ${o.x * (compact ? 0.85 : 1)}px)`,
              top: `calc(50% + ${o.y * (compact ? 0.85 : 1)}px)`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className={cn(
                'rounded-full ring-2 transition-colors duration-500',
                gold
                  ? 'bg-amber-300 ring-amber-200/70 shadow-[0_0_12px_rgba(251,191,36,0.85)]'
                  : n >= 2
                    ? 'bg-emerald-400 ring-emerald-200/50 shadow-[0_0_10px_rgba(52,211,153,0.55)]'
                    : n === 1
                      ? 'lobby-satellite-solo ring-white/35'
                      : 'bg-white/80 ring-white/40 shadow-[0_0_8px_rgba(255,255,255,0.45)]'
              )}
              style={{
                width: w * dotScale,
                height: h * dotScale,
              }}
            />
            {isMe && !compact ? (
              <span className="absolute top-[calc(100%+4px)] whitespace-nowrap text-[9px] font-medium text-white/75">
                You
              </span>
            ) : null}
          </div>
        )
      })}
    </>
  )
}

type LobbySatelliteFieldProps = {
  userId: string | undefined
  myGroup: LobbyGroup | null
  otherGroups: LobbyGroup[]
  busyId: string | null
  onJoinGroup: (groupId: string) => void
}

export function LobbySatelliteField({
  userId,
  myGroup,
  otherGroups,
  busyId,
  onJoinGroup,
}: LobbySatelliteFieldProps) {
  const myCap = myGroup?.member_cap ?? LOBBY_GROUP_MAX
  const myFull = !!myGroup && myGroup.member_uids.length >= myCap && myCap >= 2
  return (
    <div
      className={cn(
        'relative mb-6 min-h-[min(380px,52vh)] w-full overflow-hidden rounded-2xl border transition-[box-shadow,background-color,border-color] duration-700',
        myFull
          ? 'border-amber-400/50 bg-gradient-to-b from-amber-950/50 via-amber-900/25 to-slate-950/95 shadow-[0_0_48px_rgba(245,158,11,0.18)]'
          : 'border-white/15 bg-gradient-to-b from-slate-950/90 via-violet-950/40 to-slate-950/95 dark:from-black dark:via-violet-950/30 dark:to-black'
      )}
      aria-label="Symbolic lobby space"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.25]">
        <div
          className={cn(
            'absolute inset-0',
            myFull
              ? 'bg-[radial-gradient(ellipse_at_50%_35%,rgba(251,191,36,0.28),transparent_58%)]'
              : 'bg-[radial-gradient(ellipse_at_50%_0%,rgba(139,92,246,0.22),transparent_55%)]'
          )}
        />
      </div>

      <p className="pointer-events-none absolute left-3 top-3 right-3 z-10 text-[10px] leading-snug text-white/55 sm:text-xs sm:text-white/60">
        Open lobby groups hold up to {LOBBY_GROUP_MAX} people; friends groups use a size you set (up to 100).
        Satellites gather into a flower as people join — at capacity the ring turns gold. No messages.
      </p>

      <div className="absolute bottom-2 left-3 right-3 z-10 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-white/50">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
          Solo (awaiting)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          Flower (room left)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
          Full ring (at cap)
        </span>
      </div>

      {myGroup ? (
        <div className="absolute left-1/2 top-[46%] z-20 w-[min(280px,78vw)] -translate-x-1/2 -translate-y-1/2">
          <motion.div
            key={`${myGroup.id}-${myGroup.member_uids.length}`}
            initial={{ scale: 0.68, opacity: 0.72 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className={cn(
              'relative mx-auto flex min-h-[min(220px,42vw)] min-w-[min(220px,42vw)] max-w-full items-center justify-center',
              myGroup.member_uids.length >= myCap && myCap >= 2
                ? 'rounded-full border border-amber-400/45 bg-amber-500/[0.08] p-6 shadow-[inset_0_0_40px_rgba(251,191,36,0.12)]'
                : myGroup.member_uids.length >= 2
                  ? 'rounded-full border border-emerald-500/25 bg-emerald-500/[0.06] p-6'
                  : 'rounded-full border border-white/15 bg-white/[0.04] p-6'
            )}
            role="img"
            aria-label={
              myGroup.member_uids.length >= myCap && myCap >= 2
                ? `Your group is complete: ${myGroup.member_uids.length} satellites in a gold circle`
                : myGroup.member_uids.length >= 2
                  ? `Your group flower with ${myGroup.member_uids.length} of ${myCap} members`
                  : 'Your satellite, awaiting others to join your group'
            }
          >
            <GroupFlower
              group={myGroup}
              userId={userId}
              compact={false}
              gold={myGroup.member_uids.length >= myCap && myCap >= 2}
            />
          </motion.div>
        </div>
      ) : null}

      {otherGroups.map((group) => {
        const { x, y, delay, duration } = lobbySlotForId(group.id)
        const cap = group.member_cap
        const full = group.member_uids.length >= cap
        const gold = group.member_uids.length === cap && cap >= 2
        const loading = busyId === group.id
        return (
          <div
            key={group.id}
            className="lobby-satellite-float absolute z-10"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          >
            <motion.div
              key={`${group.id}-${group.member_uids.length}`}
              initial={{ scale: 0.55, opacity: 0.65 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="-translate-x-1/2 -translate-y-1/2"
            >
              <button
                type="button"
                disabled={busyId !== null || full || !userId}
                onClick={() => onJoinGroup(group.id)}
                title={
                  full
                    ? `This group is full (${cap} members).`
                    : `Join this group — ${group.member_uids.length}/${cap} here, flower formation. ${formatDistanceToNow(group.created_at.toDate(), { addSuffix: true })}`
                }
                className={cn(
                  'relative flex h-[118px] w-[118px] items-center justify-center rounded-full border transition-all duration-300',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
                  gold
                    ? 'cursor-default border-amber-400/50 bg-amber-500/15 shadow-[0_0_20px_rgba(251,191,36,0.35)]'
                    : full
                      ? 'cursor-not-allowed border-white/20 bg-white/5 opacity-50'
                      : 'cursor-pointer border-white/25 bg-white/[0.07] hover:border-white/45 hover:bg-white/[0.12] active:scale-[0.97]',
                  loading && 'pointer-events-none opacity-60'
                )}
                aria-label={
                  full
                    ? 'Group is full'
                    : `Join anonymous group with ${group.member_uids.length} of ${cap} members`
                }
              >
                <GroupFlower group={group} userId={undefined} compact gold={gold} />
              </button>
            </motion.div>
          </div>
        )
      })}

      {!myGroup && otherGroups.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/45">
          Start a group to place your satellite; others can join and form a flower together.
        </div>
      )}
    </div>
  )
}
