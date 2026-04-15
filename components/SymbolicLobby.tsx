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
import { format } from 'date-fns'
import {
  Users,
  Radio,
  Sparkles,
  LogOut as WithdrawIcon,
  Copy,
  ChevronDown,
  Calendar,
  QrCode,
} from 'lucide-react'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { toast } from 'sonner'
import {
  createLobbyGroup,
  createFriendsLobbyGroup,
  joinLobbyGroup,
  joinLobbyGroupByFriendsCode,
  leaveLobbyGroup,
  listLobbyGroups,
  updateLobbyGroupSchedule,
  LOBBY_GROUP_MAX,
  LOBBY_FRIENDS_MEMBER_CAP_MAX,
  LOBBY_FRIENDS_MEMBER_CAP_MIN,
  parseFriendsMemberCapInput,
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
import type { LobbyScheduledGathering } from '@/lib/lobbySchedule'
import {
  buildGatheringIcs,
  downloadIcsFile,
  googleCalendarUrlForGathering,
  LOBBY_SCHEDULE_UPCOMING_DISPLAY_LIMIT,
  newGatheringId,
  sortGatherings,
  upcomingGatheringsWindow,
  validateScheduledGatherings,
} from '@/lib/lobbySchedule'
import { cn } from '@/lib/utils'

function focusNodeLabel(clockId: number, nodeIndex: number): string {
  const words = DEFAULT_WORDS_BY_CLOCK[clockId]
  const w = words?.[nodeIndex]
  return w ?? `Node ${nodeIndex + 1}`
}

function gatheringEventTitle(clockId: number, label: string | undefined): string {
  const mandala = clockTitles[clockId] ?? 'Meditation'
  const base = label?.trim() ? label.trim() : `Lobby gathering — ${mandala}`
  return base
}

function gatheringEventDescription(opts: {
  clockId: number
  focusLabels: string[]
  friendsCode: string | null
}): string {
  const lines = [
    'Symbolic lobby meditation. There is no chat in the lobby.',
    `Mandala: ${clockTitles[opts.clockId] ?? '—'}`,
    `Focus: ${opts.focusLabels.length ? opts.focusLabels.join(', ') : '—'}`,
  ]
  if (opts.friendsCode) lines.push(`Friends code: ${opts.friendsCode}`)
  lines.push('Mind Mechanism')
  return lines.join('\n')
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
  const [showSessionConfig, setShowSessionConfig] = useState(true)
  const [draftSchedule, setDraftSchedule] = useState<LobbyScheduledGathering[]>([])
  const [gatheringStartLocal, setGatheringStartLocal] = useState('')
  const [gatheringDurationMin, setGatheringDurationMin] = useState(10)
  const [gatheringLabel, setGatheringLabel] = useState('')
  const [joinLink, setJoinLink] = useState('')
  const [friendsMemberCap, setFriendsMemberCap] = useState(12)
  const permissionHintShown = useRef(false)
  const sessionUiStorageKey = 'lobby.sessionConfig.expanded'

  const focusCount = clockSettings[mandalaClockId]?.focusNodes ?? 8

  useEffect(() => {
    setSelectedFocusNodes([0])
  }, [mandalaClockId])

  useEffect(() => {
    setGatheringDurationMin(sessionDurationMinutes)
  }, [sessionDurationMinutes])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = window.localStorage.getItem(sessionUiStorageKey)
      if (saved === '0') setShowSessionConfig(false)
      if (saved === '1') setShowSessionConfig(true)
    } catch {
      // ignore localStorage read failures
    }
  }, [sessionUiStorageKey])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(sessionUiStorageKey, showSessionConfig ? '1' : '0')
    } catch {
      // ignore localStorage write failures
    }
  }, [showSessionConfig, sessionUiStorageKey])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const codeFromUrl = normalizeFriendsCode(new URLSearchParams(window.location.search).get('code') ?? '')
    if (codeFromUrl) {
      setFriendsCodeInput((prev) => prev || codeFromUrl)
    }
  }, [])

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
  const gatheringSchedulePreview = useMemo(() => {
    if (!myGroup) {
      return { items: [] as LobbyScheduledGathering[], totalUpcoming: 0, pastCount: 0 }
    }
    return upcomingGatheringsWindow(myGroup.scheduled_gatherings)
  }, [myGroup])
  const otherGroups = groups.filter((g) => g.id !== myGroup?.id)
  const myMemberCount = myGroup?.member_uids.length ?? 0
  const myFriendsCode = typeof myGroup?.friends_code === 'string' ? myGroup.friends_code : null
  const isGroupCreator =
    !!user?.uid &&
    !!myGroup &&
    (myGroup.session?.creator_uid === user.uid ||
      (myGroup.session?.creator_uid == null && myGroup.member_uids[0] === user.uid))
  const qrImageUrl = joinLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(joinLink)}`
    : null

  useEffect(() => {
    if (typeof window === 'undefined' || !myFriendsCode) {
      setJoinLink('')
      return
    }
    setJoinLink(`${window.location.origin}/lobby?code=${encodeURIComponent(myFriendsCode)}`)
  }, [myFriendsCode])

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
      await createLobbyGroup(user.uid, sessionConfig, { scheduledGatherings: draftSchedule })
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
    const cap = parseFriendsMemberCapInput(friendsMemberCap)
    if (cap === null) {
      toast.error(
        `Friends group size must be between ${LOBBY_FRIENDS_MEMBER_CAP_MIN} and ${LOBBY_FRIENDS_MEMBER_CAP_MAX}.`
      )
      return
    }
    setBusyId('friends-create')
    try {
      const result = await createFriendsLobbyGroup(user.uid, sessionConfig, undefined, draftSchedule, cap)
      toast.success(`Friends group created (${cap} max). Share code ${result.friendsCode} to meditate together.`)
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

  const handleCopyJoinLink = async () => {
    if (!joinLink) return
    try {
      await navigator.clipboard.writeText(joinLink)
      toast.success('Join link copied.')
    } catch {
      toast.error('Could not copy the join link on this device.')
    }
  }

  const calendarClockId = myGroup?.session?.mandala_clock_id ?? mandalaClockId
  const calendarFocusLabels = myGroup?.session
    ? myGroup.session.focus_node_indices.map((i) => focusNodeLabel(myGroup.session!.mandala_clock_id, i))
    : selectedFocusNodes.map((i) => focusNodeLabel(mandalaClockId, i))
  const calendarFriendsCode = myGroup ? myFriendsCode : null

  const addPlannedGathering = async () => {
    if (!gatheringStartLocal.trim()) {
      toast.error('Pick a date and time for the gathering.')
      return
    }
    const ms = new Date(gatheringStartLocal).getTime()
    if (Number.isNaN(ms)) {
      toast.error('Invalid date.')
      return
    }
    const proposed: LobbyScheduledGathering = {
      id: newGatheringId(),
      starts_at_ms: ms,
      duration_minutes: gatheringDurationMin,
      label: gatheringLabel.trim() || undefined,
    }
    if (myGroup && isGroupCreator) {
      const next = sortGatherings([...myGroup.scheduled_gatherings, proposed])
      const err = validateScheduledGatherings(next)
      if (err) {
        toast.error(err)
        return
      }
      if (!user?.uid) return
      setBusyId('sched')
      try {
        await updateLobbyGroupSchedule(myGroup.id, user.uid, next)
        toast.success('Gathering added to the group schedule.')
        setGatheringStartLocal('')
        setGatheringLabel('')
        await refresh()
      } catch (e) {
        void handleLobbyGroupErrorWithHints(e).then((msg) => toast.error(msg))
        console.error(e)
      } finally {
        setBusyId(null)
      }
      return
    }
    const next = sortGatherings([...draftSchedule, proposed])
    const err = validateScheduledGatherings(next)
    if (err) {
      toast.error(err)
      return
    }
    setDraftSchedule(next)
    setGatheringStartLocal('')
    setGatheringLabel('')
    toast.success('Gathering added to your plan.')
  }

  const removePlannedGathering = async (id: string) => {
    if (myGroup && isGroupCreator) {
      if (!user?.uid) return
      const next = myGroup.scheduled_gatherings.filter((g) => g.id !== id)
      setBusyId('sched')
      try {
        await updateLobbyGroupSchedule(myGroup.id, user.uid, next)
        toast.message('Gathering removed.')
        await refresh()
      } catch (e) {
        void handleLobbyGroupErrorWithHints(e).then((msg) => toast.error(msg))
        console.error(e)
      } finally {
        setBusyId(null)
      }
      return
    }
    setDraftSchedule((prev) => prev.filter((g) => g.id !== id))
  }

  const exportGatheringIcs = (g: LobbyScheduledGathering) => {
    const title = gatheringEventTitle(calendarClockId, g.label)
    const details = gatheringEventDescription({
      clockId: calendarClockId,
      focusLabels: calendarFocusLabels,
      friendsCode: calendarFriendsCode,
    })
    const ics = buildGatheringIcs(g, { title, description: details, productId: 'app.mindmechanism' })
    downloadIcsFile(`lobby-gathering-${g.id.slice(0, 8)}.ics`, ics)
    toast.success('Calendar file downloaded — open it to add to Apple Calendar, Outlook, etc.')
  }

  const openGatheringGoogle = (g: LobbyScheduledGathering) => {
    const title = gatheringEventTitle(calendarClockId, g.label)
    const details = gatheringEventDescription({
      clockId: calendarClockId,
      focusLabels: calendarFocusLabels,
      friendsCode: calendarFriendsCode,
    })
    const url = googleCalendarUrlForGathering(g, { title, details })
    window.open(url, '_blank', 'noopener,noreferrer')
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
            The open lobby holds up to {LOBBY_GROUP_MAX} people per group. Friends groups let you set a larger cap
            (up to {LOBBY_FRIENDS_MEMBER_CAP_MAX}) before anyone joins so everyone sees how many seats the session
            has. Your cluster forms a flower as others join; at capacity it glows gold. There is no chat — only this
            shared silent pattern.
          </p>
        </div>
      </div>

      {!myGroup ? (
        <div className="mb-6 overflow-hidden rounded-xl border border-violet-500/25 bg-violet-500/[0.06] dark:border-violet-400/20 dark:bg-violet-500/10">
          <button
            type="button"
            onClick={() => setShowSessionConfig((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-violet-500/10 dark:hover:bg-violet-500/15"
            aria-expanded={showSessionConfig}
            aria-controls="lobby-session-panel-body"
            id="lobby-session-panel-toggle"
          >
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Session (creator sets for the group)
            </span>
            <ChevronDown
              className={cn(
                'h-5 w-5 shrink-0 text-violet-700 transition-transform duration-200 dark:text-violet-300',
                showSessionConfig ? 'rotate-180' : 'rotate-0'
              )}
              aria-hidden
            />
          </button>
          {showSessionConfig ? (
            <div
              id="lobby-session-panel-body"
              role="region"
              aria-labelledby="lobby-session-panel-toggle"
              className="space-y-4 border-t border-violet-500/20 px-4 pb-4 pt-3 dark:border-violet-400/15"
            >
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

              <div className="space-y-3 border-t border-violet-500/20 pt-4 dark:border-violet-400/15">
                <div>
                  <Label className="text-base">Session schedule</Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Plan gatherings in advance. Export each time to your own calendar (.ics for Apple or Outlook, or
                    Google Calendar).
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="lobby-gathering-when">Gathering start (your local time)</Label>
                    <Input
                      id="lobby-gathering-when"
                      type="datetime-local"
                      value={gatheringStartLocal}
                      onChange={(e) => setGatheringStartLocal(e.target.value)}
                      disabled={busyId !== null}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lobby-gathering-duration">This gathering length</Label>
                    <Select
                      value={String(gatheringDurationMin)}
                      onValueChange={(v) => setGatheringDurationMin(Number(v))}
                      disabled={busyId !== null}
                    >
                      <SelectTrigger id="lobby-gathering-duration" className="w-full">
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
                  <div className="space-y-2">
                    <Label htmlFor="lobby-gathering-label">Label (optional)</Label>
                    <Input
                      id="lobby-gathering-label"
                      value={gatheringLabel}
                      onChange={(e) => setGatheringLabel(e.target.value)}
                      placeholder="e.g. Morning sit"
                      maxLength={120}
                      disabled={busyId !== null}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => void addPlannedGathering()}
                  disabled={busyId !== null}
                >
                  Add gathering to plan
                </Button>
                {draftSchedule.length > 0 ? (
                  <ul className="space-y-2">
                    {draftSchedule.map((g) => (
                      <li
                        key={g.id}
                        className="flex flex-col gap-2 rounded-lg border border-violet-500/20 bg-white/50 px-3 py-2 dark:border-white/10 dark:bg-black/20 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {format(new Date(g.starts_at_ms), 'PPpp')}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {g.duration_minutes} minutes{g.label ? ` · ${g.label}` : ''}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1"
                            onClick={() => exportGatheringIcs(g)}
                            disabled={busyId !== null}
                          >
                            <Calendar className="h-3.5 w-3.5" aria-hidden />
                            .ics
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => openGatheringGoogle(g)}
                            disabled={busyId !== null}
                          >
                            Google
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8"
                            onClick={() => void removePlannedGathering(g.id)}
                            disabled={busyId !== null}
                          >
                            Remove
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">No planned gatherings yet.</p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {!myGroup ? (
        <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] dark:bg-emerald-500/10 px-4 py-3">
          <Label htmlFor="lobby-friends-cap" className="text-sm font-medium">
            Friends group — max participants
          </Label>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 mb-2">
            Only for &quot;Create friends group&quot; ({LOBBY_FRIENDS_MEMBER_CAP_MIN}–{LOBBY_FRIENDS_MEMBER_CAP_MAX}).
            Start lobby stays {LOBBY_GROUP_MAX}.
          </p>
          <Input
            id="lobby-friends-cap"
            type="number"
            min={LOBBY_FRIENDS_MEMBER_CAP_MIN}
            max={LOBBY_FRIENDS_MEMBER_CAP_MAX}
            value={friendsMemberCap}
            onChange={(e) => setFriendsMemberCap(Number(e.target.value))}
            disabled={busyId !== null}
            className="max-w-[120px]"
          />
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
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
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
            {qrImageUrl ? (
              <div className="rounded-xl border border-purple-500/25 bg-purple-500/[0.06] dark:bg-purple-500/10 p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <QrCode className="h-4 w-4 text-purple-700 dark:text-purple-300" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Session QR for repeat group meetings
                  </p>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Print this QR on flyers/posters. It opens the lobby with your friends code prefilled.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <img
                    src={qrImageUrl}
                    alt={`QR code to join friends group ${myFriendsCode}`}
                    className="h-36 w-36 rounded-md border border-black/10 dark:border-white/10 bg-white"
                    loading="lazy"
                  />
                  <div className="space-y-2">
                    <Input value={joinLink} readOnly className="max-w-[360px] text-xs" />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleCopyJoinLink}
                        disabled={busyId !== null}
                      >
                        Copy join link
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(qrImageUrl, '_blank', 'noopener,noreferrer')}
                        disabled={busyId !== null}
                      >
                        Open QR image
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {myGroup && (
        <>
          <p className="text-xs text-violet-700 dark:text-violet-300/90 mb-3 rounded-lg bg-violet-500/10 dark:bg-violet-500/10 px-3 py-2 border border-violet-500/20">
            {myGroup.member_uids.length}/{myGroup.member_cap} in your group
            {myGroup.member_uids.length >= myGroup.member_cap
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
          {myGroup.session ? (
            <div className="mb-4 rounded-xl border border-sky-500/25 bg-sky-500/[0.06] dark:bg-sky-500/10 px-3 py-3 text-sm">
              <p className="font-semibold text-gray-900 dark:text-white mb-1">Group schedule — upcoming sessions</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                The next {LOBBY_SCHEDULE_UPCOMING_DISPLAY_LIMIT} planned starts (local time). Export each to your own
                calendar — everyone stays in sync symbolically, not by sharing accounts.
              </p>
              {isGroupCreator ? (
                <div className="mb-4 space-y-3 rounded-lg border border-sky-500/20 bg-white/40 p-3 dark:border-white/10 dark:bg-black/20">
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200">Add a gathering (creator)</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="group-gathering-when">Start (local time)</Label>
                      <Input
                        id="group-gathering-when"
                        type="datetime-local"
                        value={gatheringStartLocal}
                        onChange={(e) => setGatheringStartLocal(e.target.value)}
                        disabled={busyId !== null}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="group-gathering-duration">Length</Label>
                      <Select
                        value={String(gatheringDurationMin)}
                        onValueChange={(v) => setGatheringDurationMin(Number(v))}
                        disabled={busyId !== null}
                      >
                        <SelectTrigger id="group-gathering-duration" className="w-full">
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
                    <div className="space-y-2">
                      <Label htmlFor="group-gathering-label">Label (optional)</Label>
                      <Input
                        id="group-gathering-label"
                        value={gatheringLabel}
                        onChange={(e) => setGatheringLabel(e.target.value)}
                        placeholder="e.g. Evening circle"
                        maxLength={120}
                        disabled={busyId !== null}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => void addPlannedGathering()}
                    disabled={busyId !== null}
                  >
                    {busyId === 'sched' ? 'Saving…' : 'Add to group schedule'}
                  </Button>
                </div>
              ) : null}
              {gatheringSchedulePreview.totalUpcoming > 0 ? (
                <>
                  <ul className="space-y-2">
                    {gatheringSchedulePreview.items.map((g) => (
                      <li
                        key={g.id}
                        className="flex flex-col gap-2 rounded-lg border border-sky-500/20 bg-white/50 px-3 py-2 dark:border-white/10 dark:bg-black/25 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {format(new Date(g.starts_at_ms), 'PPpp')}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {g.duration_minutes} minutes{g.label ? ` · ${g.label}` : ''}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1"
                            onClick={() => exportGatheringIcs(g)}
                            disabled={busyId !== null}
                          >
                            <Calendar className="h-3.5 w-3.5" aria-hidden />
                            .ics
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => openGatheringGoogle(g)}
                            disabled={busyId !== null}
                          >
                            Google
                          </Button>
                          {isGroupCreator ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8"
                              onClick={() => void removePlannedGathering(g.id)}
                              disabled={busyId !== null}
                            >
                              Remove
                            </Button>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {gatheringSchedulePreview.totalUpcoming > LOBBY_SCHEDULE_UPCOMING_DISPLAY_LIMIT ? (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      Showing {LOBBY_SCHEDULE_UPCOMING_DISPLAY_LIMIT} of {gatheringSchedulePreview.totalUpcoming}{' '}
                      upcoming sessions.
                    </p>
                  ) : null}
                </>
              ) : myGroup.scheduled_gatherings.length > 0 && gatheringSchedulePreview.pastCount > 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  No upcoming sessions — all {gatheringSchedulePreview.pastCount} planned times have passed.{' '}
                  {isGroupCreator ? 'Add new times above.' : 'Ask the creator to add new times.'}
                </p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isGroupCreator
                    ? 'No gatherings yet — add times above so members can sync their calendars.'
                    : 'No gatherings scheduled yet.'}
                </p>
              )}
            </div>
          ) : null}
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
