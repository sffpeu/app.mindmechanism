'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Radio } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { clockTitles } from '@/lib/clockTitles'
import { subscribePresence, joinPresence, type PresenceDoc } from '@/lib/lobbyPresence'

const CLOCK_HEX = [
  '#fd290a', '#fba63b', '#f7da5f', '#6dc037',
  '#156fde', '#941952', '#541b96', '#ee5fa7', '#56c1ff',
]

function formatDuration(mins: number | null, isFreeRun: boolean): string {
  if (isFreeRun || mins === null) return 'Free run'
  if (mins < 60) return `${mins} min`
  return `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ''}`.trim()
}

type Props = {
  currentUid: string
}

export function LobbyOpenField({ currentUid }: Props) {
  const [presences, setPresences] = useState<PresenceDoc[]>([])
  const [joiningUid, setJoiningUid] = useState<string | null>(null)
  const [joined, setJoined] = useState<Set<string>>(new Set())

  useEffect(() => {
    const unsub = subscribePresence((docs) => {
      // Exclude own presence from the view
      setPresences(docs.filter((d) => d.uid !== currentUid))
    })
    return unsub
  }, [currentUid])

  const handleJoin = async (broadcasterUid: string) => {
    if (joined.has(broadcasterUid) || joiningUid) return
    setJoiningUid(broadcasterUid)
    try {
      await joinPresence(broadcasterUid, currentUid)
      setJoined((prev) => new Set(prev).add(broadcasterUid))
    } catch {
      // silent
    } finally {
      setJoiningUid(null)
    }
  }

  if (presences.length === 0) {
    return (
      <div className="py-6 text-center">
        <Radio className="h-4 w-4 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
        <p className="text-xs text-gray-400 dark:text-gray-500">
          No one is broadcasting right now.
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          Open a wheel and tap the broadcast icon to be present.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {presences.map((p) => {
        const hex = CLOCK_HEX[p.clock_id] ?? '#6b7280'
        const title = clockTitles[p.clock_id] ?? 'Unknown'
        const hasJoined = joined.has(p.uid)
        const realJoins = p.joined_uids.filter((u) => u !== p.uid).length

        return (
          <motion.div
            key={p.uid}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35 }}
          >
            <button
              type="button"
              disabled={hasJoined || joiningUid !== null}
              onClick={() => handleJoin(p.uid)}
              className={cn(
                'w-full text-left rounded-lg border px-4 py-3 transition-all',
                hasJoined
                  ? 'opacity-60 cursor-default'
                  : 'hover:brightness-105 active:scale-[0.99] cursor-pointer'
              )}
              style={{
                backgroundColor: `${hex}12`,
                borderColor: hasJoined ? `${hex}30` : `${hex}50`,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0 animate-pulse"
                    style={{ backgroundColor: hex }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: hex }}>
                      {title}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      {formatDuration(p.duration_mins, p.is_free_run)}
                      {realJoins > 0 && ` · ${realJoins} present`}
                    </p>
                  </div>
                </div>
                <span
                  className="text-[10px] font-medium shrink-0 px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${hex}20`, color: hex }}
                >
                  {hasJoined ? 'Joined' : joiningUid === p.uid ? '…' : 'Join'}
                </span>
              </div>
            </button>
          </motion.div>
        )
      })}
    </div>
  )
}
