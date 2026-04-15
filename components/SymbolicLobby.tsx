'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Users, Radio, Sparkles, LogOut as WithdrawIcon, Copy } from 'lucide-react'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { toast } from 'sonner'
import {
  createLobbyGroup,
  createFriendsLobbyGroup,
  joinLobbyGroup,
  joinLobbyGroupByFriendsCode,
  leaveLobbyGroup,
  listLobbyGroups,
  LOBBY_GROUP_MAX,
  normalizeFriendsCode,
  handleLobbyGroupErrorWithHints,
  type LobbyGroup,
} from '@/lib/lobbyGroups'
import { LobbySatelliteField } from '@/components/LobbySatelliteField'
import { clockSettings } from '@/lib/clockSettings'
import { clockTitles } from '@/lib/clockTitles'
import { DEFAULT_WORDS_BY_CLOCK } from '@/lib/defaultWordsByClock'
import {
  LOBBY_SESSION_DURATION_CHOICES,
  type LobbySessionConfigInput,
  validateLobbySessionConfig,
} from '@/lib/lobbySessionConfig'
import { cn } from '@/lib/utils'

function focusNodeLabel(clockId: number, nodeIndex: number): string {
  const words = DEFAULT_WORDS_BY_CLOCK[clockId]
  const w = words?.[nodeIndex]
  return w ?? `Node ${nodeIndex + 1}`
}

export function SymbolicLobby() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<LobbyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [friendsCodeInput, setFriendsCodeInput] = useState('')
  const [mandalaClockId, setMandalaClockId] = useState(0)
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(10)
  const [selectedFocusNodes, setSelectedFocusNodes] = useState<number[]>([0])
  const permissionHintShown = useRef(false)

  const focusCount = clockSettings[mandalaClockId]?.focusNodes ?? 8

  useEffect(() => {
    setSelectedFocusNodes([0])
  }, [mandalaClockId])

  const sessionConfig = useMemo((): LobbySessionConfigInput => {
    return {
      mandalaClockId,
      sessionDurationMinutes,
      focusNodeIndices: selectedFocusNodes,
    }
  }, [mandalaClockId, sessionDurationMinutes, selectedFocusNodes])

  const refresh = useCallback(async () => {
    if (!user?.uid) return
    try {
      const list = await listLobbyGroups()
      setGroups(list)
    } catch (e) {
      console.error(e)
      if (!permissionHintShown.current) {
        permissionHintShown.current = true
        void handleLobbyGroupErrorWithHints(e).then((msg) => toast.error(msg))
      }
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  const myGroup = user?.uid
    ? groups.find((g) => g.member_uids.includes(user.uid)) ?? null
    : null
  const otherGroups = groups.filter((g) => g.id !== myGroup?.id)
  const myMemberCount = myGroup?.member_uids.length ?? 0
  const myFriendsCode = typeof myGroup?.friends_code === 'string' ? myGroup.friends_code : null

  useEffect(() => {
    refresh()
    const pollMs = myMemberCount === 1 ? 4000 : 8000
    const t = setInterval(refresh, pollMs)
    return () => clearInterval(t)
  }, [refresh, myMemberCount])

  const toggleFocusNode = (nodeIndex: number) => {
    setSelectedFocusNodes((prev) => {
      if (prev.includes(nodeIndex)) {
        const next = prev.filter((x) => x !== nodeIndex)
        return next.length ? next : prev
      }
      return [...prev, nodeIndex].sort((a, b) => a - b)
    })
  }

  const handleAppear = async () => {
    if (!user?.uid) return
    const err = validateLobbySessionConfig(sessionConfig)
    if (err) {
      toast.error(err)
      return
    }
    setBusyId('appear')
    try {
      await createLobbyGroup(user.uid, sessionConfig)
      toast.success('Your satellite is in orbit. Others can join your group — up to twelve in one flower.')
      await refresh()
    } catch (e) {
      void handleLobbyGroupErrorWithHints(e).then((msg) => toast.error(msg))
      console.error(e)
    } finally {
      setBusyId(null)
    }
  }

  const handleCreateFriendsGroup = async () => {
    if (!user?.uid) return
    const err = validateLobbySessionConfig(sessionConfig)
    if (err) {
      toast.error(err)
      return
    }
    setBusyId('friends-create')
    try {
      const result = await createFriendsLobbyGroup(user.uid, sessionConfig)
      toast.success(`Friends group created. Share code ${result.friendsCode} to meditate together.`)
      await refresh()
    } catch (e) {
      void handleLobbyGroupErrorWithHints(e).then((msg) => toast.error(msg))
      console.error(e)
    } finally {
      setBusyId(null)
    }
  }

  const handleWithdraw = async () => {
    if (!user?.uid || !myGroup) return
    setBusyId('withdraw')
    try {
      await leaveLobbyGroup(myGroup.id, user.uid)
      toast.message('You left the group.')
      await refresh()
    } catch (e) {
      void handleLobbyGroupErrorWithHints(e).then((msg) => toast.error(msg))
      console.error(e)
    } finally {
      setBusyId(null)
    }
  }

  const handleJoinGroup = async (groupId: string) => {
    if (!user?.uid) return
    setBusyId(groupId)
    try {
      await joinLobbyGroup(groupId, user.uid)
      toast.success('You joined the group — satellites gather in a flower. Still no messages or channels.')
      await refresh()
    } catch (e) {
      void handleLobbyGroupErrorWithHints(e).then((msg) => toast.error(msg))
      console.error(e)
    } finally {
      setBusyId(null)
    }
  }

  const handleJoinByCode = async () => {
    if (!user?.uid) return
    const normalized = normalizeFriendsCode(friendsCodeInput)
    if (!normalized) {
      toast.error('Enter a valid friends code.')
      return
    }
    setBusyId('friends-join')
    try {
      await joinLobbyGroupByFriendsCode(normalized, user.uid)
      toast.success(`Joined friends group ${normalized}.`)
      setFriendsCodeInput(normalized)
      await refresh()
    } catch (e) {
      void handleLobbyGroupErrorWithHints(e).then((msg) => toast.error(msg))
      console.error(e)
    } finally {
      setBusyId(null)
    }
  }

  const handleCopyMyCode = async () => {
    if (!myFriendsCode) return
    try {
      await navigator.clipboard.writeText(myFriendsCode)
      toast.success('Friends code copied.')
    } catch {
      toast.error('Could not copy code on this device.')
    }
  }

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
            Up to {LOBBY_GROUP_MAX} people can share one symbolic group. Your cluster forms a flower as others
            join. When the circle is complete ({LOBBY_GROUP_MAX} members), it glows gold. There is no chat — only
            this shared silent pattern.
          </p>
        </div>
      </div>

      {!myGroup ? (
        <div className="mb-6 rounded-xl border border-violet-500/25 dark:border-violet-400/20 bg-violet-500/[0.06] dark:bg-violet-500/10 p-4 space-y-4">
          <p className="text-sm font-medium text-gray-900 dark:text-white">Session (creator sets for the group)</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lobby-mandala">Mandala</Label>
              <Select
                value={String(mandalaClockId)}
                onValueChange={(v) => setMandalaClockId(Number(v))}
                disabled={busyId !== null}
              >
                <SelectTrigger id="lobby-mandala" className="w-full">
                  <SelectValue placeholder="Choose mandala" />
                </SelectTrigger>
                <SelectContent>
                  {clockSettings.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {clockTitles[c.id] ?? `Clock ${c.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lobby-duration">Session length</Label>
              <Select
                value={String(sessionDurationMinutes)}
                onValueChange={(v) => setSessionDurationMinutes(Number(v))}
                disabled={busyId !== null}
              >
                <SelectTrigger id="lobby-duration" className="w-full">
                  <SelectValue placeholder="Minutes" />
                </SelectTrigger>
                <SelectContent>
                  {LOBBY_SESSION_DURATION_CHOICES.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m} minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Focus nodes</Label>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Choose one or more nodes on this mandala for the shared meditation.
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: focusCount }).map((_, nodeIndex) => {
                const on = selectedFocusNodes.includes(nodeIndex)
                return (
                  <button
                    key={nodeIndex}
                    type="button"
                    onClick={() => toggleFocusNode(nodeIndex)}
                    disabled={busyId !== null}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      on
                        ? 'border-purple-600 bg-purple-600 text-white dark:border-purple-400 dark:bg-purple-500'
                        : 'border-black/15 bg-white/80 text-gray-800 hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-gray-100'
                    )}
                  >
                    {focusNodeLabel(mandalaClockId, nodeIndex)}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 mb-6">
        {myGroup ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full gap-2"
            onClick={handleWithdraw}
            disabled={busyId !== null}
          >
            <WithdrawIcon className="h-4 w-4" />
            {busyId === 'withdraw' ? 'Leaving…' : 'Leave group'}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              className="rounded-full gap-2 bg-purple-700 hover:bg-purple-800 text-white shadow-sm shadow-purple-900/30"
              onClick={handleAppear}
              disabled={!user?.uid || busyId !== null}
            >
              <Sparkles className="h-4 w-4" />
              {busyId === 'appear' ? '…' : 'Start lobby'}
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-900/30"
              onClick={handleCreateFriendsGroup}
              disabled={!user?.uid || busyId !== null}
            >
              <Users className="h-4 w-4" />
              {busyId === 'friends-create' ? 'Creating…' : 'Create friends group'}
            </Button>
          </>
        )}
      </div>

      <div className="mb-5 rounded-xl border border-black/10 dark:border-white/10 p-3 sm:p-4 bg-white/60 dark:bg-white/[0.03]">
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          Join associates directly with a friends code.
        </p>
        <div className="flex flex-wrap gap-2">
          <Input
            value={friendsCodeInput}
            onChange={(e) => setFriendsCodeInput(normalizeFriendsCode(e.target.value))}
            placeholder="Enter friends code"
            className="max-w-[220px]"
            maxLength={12}
            disabled={!user?.uid || busyId !== null}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleJoinByCode}
            disabled={!user?.uid || busyId !== null || !friendsCodeInput.trim()}
          >
            {busyId === 'friends-join' ? 'Joining…' : 'Join by code'}
          </Button>
        </div>
        {myFriendsCode ? (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-violet-700 dark:text-violet-300 font-semibold">
              Join code:
            </span>
            <span className="text-lg sm:text-2xl font-extrabold tracking-widest text-purple-700 dark:text-purple-300 bg-purple-500/10 border border-purple-500/30 rounded-md px-3 py-1">
              {myFriendsCode}
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={handleCopyMyCode}
              disabled={busyId !== null}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : null}
      </div>

      {myGroup && (
        <>
          <p className="text-xs text-violet-700 dark:text-violet-300/90 mb-3 rounded-lg bg-violet-500/10 dark:bg-violet-500/10 px-3 py-2 border border-violet-500/20">
            {myGroup.member_uids.length}/{LOBBY_GROUP_MAX} in your group
            {myGroup.member_uids.length === LOBBY_GROUP_MAX
              ? ' — full golden circle.'
              : myGroup.member_uids.length >= 2
                ? ' — flower formation active.'
                : ' — solo satellite until someone joins.'}
          </p>
          {myGroup.session ? (
            <div className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] dark:bg-emerald-500/10 px-3 py-3 text-sm">
              <p className="font-semibold text-gray-900 dark:text-white mb-2">Group meditation</p>
              <ul className="space-y-1.5 text-gray-700 dark:text-gray-300">
                <li>
                  <span className="font-medium text-gray-900 dark:text-white">Mandala: </span>
                  {clockTitles[myGroup.session.mandala_clock_id] ?? '—'}
                </li>
                <li>
                  <span className="font-medium text-gray-900 dark:text-white">Session: </span>
                  {myGroup.session.session_duration_minutes} minutes
                </li>
                <li>
                  <span className="font-medium text-gray-900 dark:text-white">Focus nodes: </span>
                  {myGroup.session.focus_node_indices
                    .map((i) => focusNodeLabel(myGroup.session!.mandala_clock_id, i))
                    .join(', ')}
                </li>
              </ul>
            </div>
          ) : (
            <p className="text-xs text-amber-800 dark:text-amber-200/90 mb-4 rounded-lg bg-amber-500/10 px-3 py-2 border border-amber-500/25">
              This group has no session details stored (older lobby data). Leave and start a new group to set mandala,
              time, and focus nodes.
            </p>
          )}
        </>
      )}

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">Loading lobby space…</p>
      ) : (
        <>
          <LobbySatelliteField
            userId={user?.uid}
            myGroup={myGroup}
            otherGroups={otherGroups}
            busyId={busyId}
            onJoinGroup={handleJoinGroup}
          />
          {myGroup && otherGroups.length === 0 && myGroup.member_uids.length === 1 ? (
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 -mt-2 mb-2">
              No other groups nearby — your satellite flashes until someone joins you or you tap another cluster.
            </p>
          ) : null}
        </>
      )}
    </Card>
  )
}
