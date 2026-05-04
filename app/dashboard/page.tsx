'use client'

import { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  User, Mail, CalendarClock, Pencil, LogOut,
  Clock3, XCircle, ChevronDown, CalendarDays, Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/FirebaseAuthContext'
import Link from 'next/link'
import { calculateUserTimeStats } from '@/lib/timeTracking'
import { startTimeTracking, endTimeTracking } from '@/lib/timeTracking'
import { getUserSessions } from '@/lib/sessions'
import { getMyLobbyGroup, type LobbyGroup } from '@/lib/lobbyGroups'
import { upcomingGatheringsWindow } from '@/lib/lobbySchedule'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DashboardRecentSessions,
  type DashboardRecentSessionsHandle,
} from '@/components/DashboardRecentSessions'
import { clockTitles } from '@/lib/clockTitles'
import { cn } from '@/lib/utils'

interface TimeStats {
  totalTime: number
  monthlyTime: number
  lastSignInTime: Date | null
}

type UpcomingScheduledSession = {
  id: string
  clockId: number
  startsAt: Date
}

type GroupSessionSummary = {
  clockId: number
  durationMinutes: number
  focusNodeCount: number
}

function lobbyPlanPanelState(myGroup: LobbyGroup | null) {
  return {
    plannedCount: myGroup?.scheduled_gatherings?.length ?? 0,
    upcomingPlannedCount: myGroup
      ? upcomingGatheringsWindow(myGroup.scheduled_gatherings).totalUpcoming
      : 0,
    groupSessionSummary: myGroup?.session
      ? {
          clockId: myGroup.session.mandala_clock_id,
          durationMinutes: myGroup.session.session_duration_minutes,
          focusNodeCount: myGroup.session.focus_node_indices.length,
        }
      : null,
  }
}

// ─── TIER CONFIG ─────────────────────────────────────────────────────────────
// Deliberately understated — no badge, no crown, no rank signalling.
// The label and color are drawn from the MM's own vocabulary.

const TIER_CONFIG = {
  open: {
    label: 'Open',
    color: 'text-gray-500 dark:text-gray-400',
  },
  standard: {
    label: 'Standard',
    color: 'text-sky-600 dark:text-sky-400',
  },
  sovereign: {
    label: 'Sovereign',
    color: 'text-violet-600 dark:text-violet-400',
  },
} as const

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const [timeStats, setTimeStats] = useState<TimeStats>({
    totalTime: 0,
    monthlyTime: 0,
    lastSignInTime: null,
  })
  const [timeEntryId, setTimeEntryId] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [scheduledSessionsCount, setScheduledSessionsCount] = useState(0)
  const [upcomingScheduledSessions, setUpcomingScheduledSessions] = useState<UpcomingScheduledSession[]>([])
  const [groupPlannedSessionsCount, setGroupPlannedSessionsCount] = useState(0)
  const [groupUpcomingSessionsCount, setGroupUpcomingSessionsCount] = useState(0)
  const [groupSessionSummary, setGroupSessionSummary] = useState<GroupSessionSummary | null>(null)
  const [scheduledPanelOpen, setScheduledPanelOpen] = useState(false)
  const recentSessionsRef = useRef<DashboardRecentSessionsHandle>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        if (authLoading || !user) {
          if (!authLoading && !user) router.push('/home')
          return
        }
        setIsInitializing(true)
        setAuthError(null)
        const [timeStatsData, userSessions] = await Promise.all([
          calculateUserTimeStats(user.uid),
          getUserSessions(user.uid),
        ])
        if (mounted) {
          let myGroup = null
          try { myGroup = await getMyLobbyGroup(user.uid) } catch {}

          const now = Date.now()
          const upcoming = userSessions
            .filter((s) => s.status === 'waiting')
            .map((s) => {
              const raw = typeof s.scheduled_start_time === 'string' ? s.scheduled_start_time : ''
              const ms = raw ? new Date(raw).getTime() : NaN
              if (!Number.isFinite(ms) || ms < now) return null
              return { id: s.id, clockId: s.clock_id, startsAt: new Date(ms) } satisfies UpcomingScheduledSession
            })
            .filter((v): v is UpcomingScheduledSession => v !== null)
            .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
            .slice(0, 10)

          setTimeStats(timeStatsData)
          setScheduledSessionsCount(userSessions.filter((s) => s.status === 'waiting').length)
          setUpcomingScheduledSessions(upcoming)
          const lp = lobbyPlanPanelState(myGroup)
          setGroupPlannedSessionsCount(lp.plannedCount)
          setGroupUpcomingSessionsCount(lp.upcomingPlannedCount)
          setGroupSessionSummary(lp.groupSessionSummary)
        }
      } catch (error) {
        if (mounted) setAuthError(error instanceof Error ? error.message : 'Failed to load profile')
      } finally {
        if (mounted) setIsInitializing(false)
      }
    }
    init()
    return () => { mounted = false }
  }, [user?.uid, authLoading, router])

  useEffect(() => {
    if (authLoading || !user?.uid) return
    const refresh = () => void (async () => {
      try {
        const myGroup = await getMyLobbyGroup(user.uid)
        const lp = lobbyPlanPanelState(myGroup)
        setGroupPlannedSessionsCount(lp.plannedCount)
        setGroupUpcomingSessionsCount(lp.upcomingPlannedCount)
        setGroupSessionSummary(lp.groupSessionSummary)
      } catch {}
    })()
    const onVisibility = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [user?.uid, authLoading])

  useEffect(() => {
    let entryId: string | null = null
    let mounted = true
    const start = async () => {
      if (user?.uid && mounted) {
        entryId = await startTimeTracking(user.uid, 'dashboard')
        if (mounted) setTimeEntryId(entryId)
      }
    }
    start()
    return () => { mounted = false; if (entryId) endTimeTracking(entryId) }
  }, [user?.uid])

  // ─── Guards ────────────────────────────────────────────────────────────────

  if (isInitializing || authLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50/80 dark:bg-black/95">
        <LoadingSpinner size="lg" isLoading />
      </div>
    )
  }

  if (authError) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-black/95">
        <div className="text-center px-4">
          <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-300">{authError}</p>
          <Button onClick={() => window.location.reload()} className="mt-4 rounded-full">Retry</Button>
        </div>
      </div>
    )
  }

  if (!mounted || !user) return null

  const memberSince = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null

  const tier = profile?.tier ?? 'open'
  const tierCfg = TIER_CONFIG[tier]

  // Counts for the scheduled/group drawer badge
  const scheduledActivityCount = scheduledSessionsCount + groupUpcomingSessionsCount

  return (
    <ProtectedRoute>
      <div className="h-full overflow-hidden flex flex-col bg-gradient-to-b from-gray-50 to-gray-100/80 dark:from-black dark:to-gray-950/50">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto max-w-2xl space-y-4 px-4 py-4 sm:px-6 sm:py-5">

            {/* ── Profile card ──────────────────────────────────────────── */}
            <Card className="overflow-hidden rounded-xl border-0 bg-white/90 shadow-md shadow-gray-200/40 backdrop-blur-sm dark:bg-white/5 dark:shadow-none">
              {/* Banner — short strip so the fold reaches Recent Sessions sooner */}
              <div className="relative h-10 overflow-hidden sm:h-11" aria-hidden>
                {profile?.bannerUrl?.trim() ? (
                  <>
                    <img src={profile.bannerUrl.trim()} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent dark:from-black/55" />
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-indigo-900/95 to-violet-900 dark:from-slate-900 dark:via-indigo-950 dark:to-violet-950" />
                    <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-violet-500/30 dark:bg-violet-400/20 blur-3xl" />
                    <div className="absolute top-1/2 -left-8 h-32 w-32 rounded-full bg-indigo-500/25 dark:bg-indigo-400/15 blur-2xl" />
                    <svg className="absolute inset-0 h-full w-full opacity-[0.07] dark:opacity-[0.12]" aria-hidden>
                      <defs>
                        <linearGradient id="banner-arc" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="white" stopOpacity="0" />
                          <stop offset="100%" stopColor="white" stopOpacity="1" />
                        </linearGradient>
                      </defs>
                      <ellipse cx="50%" cy="60%" rx="55%" ry="45%" fill="none" stroke="url(#banner-arc)" strokeWidth="1.5" />
                      <ellipse cx="50%" cy="60%" rx="40%" ry="32%" fill="none" stroke="url(#banner-arc)" strokeWidth="1" />
                      <ellipse cx="50%" cy="60%" rx="25%" ry="20%" fill="none" stroke="url(#banner-arc)" strokeWidth="0.75" />
                    </svg>
                  </>
                )}
                <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
              </div>

              {/* Content — dense: meta runs under the name; actions immediately follow */}
              <div className="px-3 pb-3 pt-3 sm:px-5 sm:pb-3.5 sm:pt-3.5">
                <div className="flex gap-3 sm:items-start sm:gap-4">
                  <Avatar className="h-14 w-14 shrink-0 rounded-xl border-2 border-white shadow-md ring-1 ring-black/5 dark:border-gray-800 dark:ring-white/10 sm:h-16 sm:w-16">
                    <AvatarImage src={user.photoURL || undefined} className="object-cover" />
                    <AvatarFallback className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-base font-semibold text-white sm:text-lg">
                      {user.displayName
                        ? user.displayName.split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                        : <User className="h-6 w-6" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-bold leading-tight text-gray-900 dark:text-white sm:text-xl">
                      {user.displayName || 'User'}
                    </h2>
                    <div className="mt-0.5 flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                      <Mail className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      <span className="truncate text-xs">{user.email}</span>
                    </div>

                    {/* Compact account detail — one secondary block, small type */}
                    <div className="mt-1.5 space-y-1 text-[11px] leading-snug text-gray-500 dark:text-gray-400 sm:text-xs">
                      {(memberSince || timeStats.lastSignInTime) ? (
                        <p className="flex flex-wrap gap-x-2 gap-y-0.5">
                          {memberSince ? (
                            <span>
                              Member since{' '}
                              <span className="font-medium text-gray-700 dark:text-gray-300">{memberSince}</span>
                            </span>
                          ) : null}
                          {memberSince && timeStats.lastSignInTime ? (
                            <span className="text-gray-300 dark:text-gray-600" aria-hidden>
                              ·
                            </span>
                          ) : null}
                          {timeStats.lastSignInTime ? (
                            <span>
                              Last sign-in{' '}
                              <span className="font-medium tabular-nums text-gray-700 dark:text-gray-300">
                                {timeStats.lastSignInTime.toLocaleString(undefined, {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })}
                              </span>
                            </span>
                          ) : null}
                        </p>
                      ) : null}
                      <p className={cn('font-medium', tierCfg.color)}>
                        Membership · {tierCfg.label}
                      </p>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild className="h-8 gap-1.5 rounded-full px-3 text-xs">
                        <Link href="/settings">
                          <Pencil className="h-3.5 w-3.5" />
                          Edit profile
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => signOut()}
                        className="h-8 gap-1.5 rounded-full px-3 text-xs text-gray-600 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign out
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* ── Recent Sessions ───────────────────────────────────────── */}
            <section>
              <h2 className="mb-0.5 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                Recent Sessions
              </h2>
              <p className="mb-3 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                Continue or restart from your latest sessions.
              </p>
              <Card className="rounded-2xl border border-violet-200/90 dark:border-violet-500/30 overflow-hidden bg-violet-50/95 dark:bg-indigo-950/50 shadow-xl shadow-violet-200/40 dark:shadow-indigo-950/40 backdrop-blur-sm p-4 sm:p-6">
                <DashboardRecentSessions ref={recentSessionsRef} />
              </Card>
            </section>

            {/* ── Practice shortcuts ────────────────────────────────────── */}
            <section
              className="rounded-2xl border border-violet-200/90 bg-violet-50/90 p-4 dark:border-violet-500/25 dark:bg-indigo-950/45"
              aria-label="Practice shortcuts"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-violet-800 dark:text-violet-200/90 mb-3">
                Practice
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="rounded-full" asChild>
                  <Link href="/layers">Home mandala</Link>
                </Button>
                <Button size="sm" variant="secondary" className="rounded-full" asChild>
                  <Link href="/sessions">Sessions</Link>
                </Button>
                <Button size="sm" variant="outline" className="rounded-full border-violet-300/80 bg-white/80 dark:border-violet-500/40 dark:bg-black/30" asChild>
                  <Link href="/glossary">Glossary</Link>
                </Button>
                <Button size="sm" variant="outline" className="rounded-full border-violet-300/80 bg-white/80 dark:border-violet-500/40 dark:bg-black/30" asChild>
                  <Link href="/notes">Notes</Link>
                </Button>
              </div>
            </section>

            {/* ── Scheduled & Group — collapsed by default ──────────────── */}
            <section>
              <Card className="rounded-2xl border border-black/5 dark:border-white/10 overflow-hidden bg-white/90 dark:bg-white/5 shadow-sm backdrop-blur-sm">
                <button
                  type="button"
                  aria-expanded={scheduledPanelOpen}
                  onClick={() => setScheduledPanelOpen((v) => !v)}
                  className="flex w-full items-center justify-between gap-3 px-4 sm:px-6 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <CalendarDays className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Scheduled &amp; Group
                    </span>
                    {scheduledActivityCount > 0 && (
                      <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-violet-100 dark:bg-violet-900/50 px-1.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300">
                        {scheduledActivityCount}
                      </span>
                    )}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500 transition-transform duration-200',
                      scheduledPanelOpen ? 'rotate-180' : 'rotate-0'
                    )}
                    aria-hidden
                  />
                </button>

                {scheduledPanelOpen && (
                  <div className="border-t border-black/5 dark:border-white/10 px-4 sm:px-6 pb-5 pt-4 space-y-6">

                    {/* Upcoming scheduled sessions */}
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <CalendarClock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Upcoming scheduled
                          </h3>
                        </div>
                        <Button
                          type="button" variant="ghost" size="sm"
                          className="rounded-full text-xs h-7 px-3"
                          onClick={() => recentSessionsRef.current?.openOpenSessionsDialog('waiting')}
                        >
                          View all
                        </Button>
                      </div>
                      {upcomingScheduledSessions.length > 0 ? (
                        <ul className="space-y-2">
                          {upcomingScheduledSessions.map((s) => (
                            <li
                              key={s.id}
                              className="flex items-center justify-between gap-3 rounded-xl border border-black/5 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.03] px-3 py-2.5"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {clockTitles[s.clockId] ?? `Clock ${s.clockId}`} session
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {s.startsAt.toLocaleString()}
                                </p>
                              </div>
                              <Clock3 className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No upcoming sessions.
                        </p>
                      )}
                    </div>

                    {/* Group sessions */}
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Group sessions
                          </h3>
                        </div>
                        <Button asChild type="button" variant="ghost" size="sm" className="rounded-full text-xs h-7 px-3">
                          <Link href="/lobby">Lobby</Link>
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="rounded-xl border border-black/5 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.03] px-3 py-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Planned</p>
                          <p className="text-xl font-semibold text-gray-900 dark:text-white tabular-nums mt-0.5">
                            {groupPlannedSessionsCount}
                          </p>
                        </div>
                        <div className="rounded-xl border border-black/5 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.03] px-3 py-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Upcoming</p>
                          <p className="text-xl font-semibold text-gray-900 dark:text-white tabular-nums mt-0.5">
                            {groupUpcomingSessionsCount}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-gray-500 dark:text-gray-400">Mandala</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {groupSessionSummary
                              ? (clockTitles[groupSessionSummary.clockId] ?? `Clock ${groupSessionSummary.clockId}`)
                              : 'Not set'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-gray-500 dark:text-gray-400">Session length</span>
                          <span className="font-medium text-gray-900 dark:text-white tabular-nums">
                            {groupSessionSummary ? `${groupSessionSummary.durationMinutes} min` : 'Not set'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-gray-500 dark:text-gray-400">Focus nodes</span>
                          <span className="font-medium text-gray-900 dark:text-white tabular-nums">
                            {groupSessionSummary ? groupSessionSummary.focusNodeCount : 0}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </Card>
            </section>

          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
