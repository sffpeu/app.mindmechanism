'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Radio, Sparkles, LogOut as WithdrawIcon } from 'lucide-react'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import {
  alignSymbolically,
  appearInLobby,
  listLobbyEntries,
  withdrawFromLobby,
  type SymbolicLobbyEntry,
} from '@/lib/symbolicLobby'

const ALIGNED_KEY = 'symbolic_lobby_aligned_ids'

function loadAlignedSet(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = sessionStorage.getItem(ALIGNED_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

function saveAlignedSet(ids: Set<string>) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(ALIGNED_KEY, JSON.stringify([...ids]))
}

export function SymbolicLobby() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<SymbolicLobbyEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [myEntry, setMyEntry] = useState<SymbolicLobbyEntry | null>(null)
  const [aligned, setAligned] = useState<Set<string>>(() =>
    typeof window !== 'undefined' ? loadAlignedSet() : new Set()
  )

  const refresh = useCallback(async () => {
    if (!user?.uid) return
    try {
      const list = await listLobbyEntries()
      setEntries(list)
      const mine = list.find((e) => e.owner_uid === user.uid) ?? null
      setMyEntry(mine)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 8000)
    return () => clearInterval(t)
  }, [refresh])

  const handleAppear = async () => {
    if (!user?.uid) return
    setBusyId('appear')
    try {
      await appearInLobby(user.uid)
      toast.success('You are visible in the lobby — only as an anonymous presence.')
      await refresh()
    } catch (e) {
      toast.error('Could not appear in the lobby.')
      console.error(e)
    } finally {
      setBusyId(null)
    }
  }

  const handleWithdraw = async () => {
    if (!user?.uid || !myEntry) return
    setBusyId('withdraw')
    try {
      await withdrawFromLobby(myEntry.id, user.uid)
      toast.message('You left the lobby.')
      await refresh()
    } catch (e) {
      toast.error('Could not leave the lobby.')
      console.error(e)
    } finally {
      setBusyId(null)
    }
  }

  const handleAlign = async (entry: SymbolicLobbyEntry) => {
    if (!user?.uid || entry.owner_uid === user.uid) return
    if (aligned.has(entry.id)) {
      toast.message('You already offered a symbolic alignment with this presence.')
      return
    }
    setBusyId(entry.id)
    try {
      await alignSymbolically(entry.id)
      const next = new Set(aligned).add(entry.id)
      setAligned(next)
      saveAlignedSet(next)
      toast.success('Symbolic alignment recorded. There is no chat or shared channel — only this gesture.')
      await refresh()
    } catch (e) {
      toast.error('Could not record alignment.')
      console.error(e)
    } finally {
      setBusyId(null)
    }
  }

  const others = entries.filter((e) => e.owner_uid !== user?.uid)

  return (
    <Card className="p-4 sm:p-6 bg-white/90 dark:bg-white/5 backdrop-blur-sm border border-black/5 dark:border-white/10 shadow-xl shadow-gray-200/40 dark:shadow-none rounded-2xl">
      <div className="flex items-start gap-3 mb-4">
        <div className="mt-0.5 rounded-full p-2 bg-violet-500/15 dark:bg-violet-400/10">
          <Radio className="h-5 w-5 text-violet-600 dark:text-violet-300" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500 dark:text-gray-400 shrink-0" />
            Symbolic lobby
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
            People here are only shown as anonymous openness to connect. This space does not support messages,
            audio, or any channel — the connection is symbolic: you see that someone is present, and you may
            acknowledge it without revealing identity or starting a conversation.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {myEntry ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full gap-2"
            onClick={handleWithdraw}
            disabled={busyId !== null}
          >
            <WithdrawIcon className="h-4 w-4" />
            {busyId === 'withdraw' ? 'Leaving…' : 'Leave lobby'}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            className="rounded-full gap-2 bg-violet-600 hover:bg-violet-700 text-white"
            onClick={handleAppear}
            disabled={!user?.uid || busyId !== null}
          >
            <Sparkles className="h-4 w-4" />
            {busyId === 'appear' ? '…' : 'Appear anonymously'}
          </Button>
        )}
      </div>

      {myEntry && (
        <p className="text-xs text-violet-700 dark:text-violet-300/90 mb-4 rounded-lg bg-violet-500/10 dark:bg-violet-500/10 px-3 py-2 border border-violet-500/20">
          Others see you only as an anonymous presence. Alignments are counts of symbolic acknowledgements — not
          replies or invites.
        </p>
      )}

      <div className="space-y-3 max-h-[min(420px,50vh)] overflow-y-auto pr-1 custom-scrollbar">
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        ) : others.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No one else is in the lobby right now.</p>
            <p className="text-xs mt-2 max-w-sm mx-auto">
              When you appear, others will see only that an anonymous person is open to symbolic connection.
            </p>
          </div>
        ) : (
          others.map((entry) => (
            <div
              key={entry.id}
              className="p-3 rounded-xl bg-gray-50/90 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/10"
            >
              <div className="flex justify-between gap-3 items-start">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Anonymous presence</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Open to symbolic connection · here{' '}
                    {formatDistanceToNow(entry.created_at.toDate(), { addSuffix: true })}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Symbolic alignments: {entry.symbolic_alignments}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="shrink-0 rounded-full text-xs h-8"
                  disabled={busyId !== null || aligned.has(entry.id)}
                  onClick={() => handleAlign(entry)}
                >
                  {busyId === entry.id
                    ? '…'
                    : aligned.has(entry.id)
                      ? 'Aligned'
                      : 'Align symbolically'}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
