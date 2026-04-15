'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

export function SymbolicLobby() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<LobbyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [friendsCodeInput, setFriendsCodeInput] = useState('')
  const permissionHintShown = useRef(false)

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

  const handleAppear = async () => {
    if (!user?.uid) return
    setBusyId('appear')
    try {
      await createLobbyGroup(user.uid)
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
    setBusyId('friends-create')
    try {
      const result = await createFriendsLobbyGroup(user.uid)
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
              className="rounded-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleAppear}
              disabled={!user?.uid || busyId !== null}
            >
              <Sparkles className="h-4 w-4" />
              {busyId === 'appear' ? '…' : 'Start public group'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full gap-2"
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
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-violet-700 dark:text-violet-300">Your friends code: {myFriendsCode}</span>
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
        <p className="text-xs text-violet-700 dark:text-violet-300/90 mb-4 rounded-lg bg-violet-500/10 dark:bg-violet-500/10 px-3 py-2 border border-violet-500/20">
          {myGroup.member_uids.length}/{LOBBY_GROUP_MAX} in your group
          {myGroup.member_uids.length === LOBBY_GROUP_MAX
            ? ' — full golden circle.'
            : myGroup.member_uids.length >= 2
              ? ' — flower formation active.'
              : ' — solo satellite until someone joins.'}
        </p>
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
