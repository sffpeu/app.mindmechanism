'use client'

import { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Mail, Calendar, CalendarClock, LogIn, Pencil, LogOut, Clock3, XCircle, ChevronDown } from 'lucide-react'
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

/** Shared surface for Group Sessions + Recent Sessions panels (contrasts with dashboard gradient). */
const DASHBOARD_VIOLET_PANEL =
  'rounded-2xl border border-violet-200/90 dark:border-violet-500/30 overflow-hidden bg-violet-50/95 dark:bg-indigo-950/50 shadow-xl shadow-violet-200/40 dark:shadow-indigo-950/40 backdrop-blur-sm'

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
  const [creatorSessionPanelOpen, setCreatorSessionPanelOpen] = useState(false)
  const recentSessionsRef = useRef<DashboardRecentSessionsHandle>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        if (authLoading || !user) {
          if (!authLoading && !user) {
            router.push('/home')
          }
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
          try {
            myGroup = await getMyLobbyGroup(user.uid)
          } catch (groupError) {
            console.error('Failed to load lobby group for dashboard summary:', groupError)
          }

          const now = Date.now()
          const upcoming = userSessions
            .filter((session) => session.status === 'waiting')
            .map((session) => {
              const raw = typeof session.scheduled_start_time === 'string' ? session.scheduled_start_time : ''
              const startsMs = raw ? new Date(raw).getTime() : NaN
              if (!Number.isFinite(startsMs) || startsMs < now) return null
              return {
                id: session.id,
                clockId: session.clock_id,
                startsAt: new Date(startsMs),
              } satisfies UpcomingScheduledSession
            })
            .filter((v): v is UpcomingScheduledSession => v !== null)
            .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
            .slice(0, 10)

          setTimeStats(timeStatsData)
          setScheduledSessionsCount(userSessions.filter((session) => session.status === 'waiting').length)
          setUpcomingScheduledSessions(upcoming)
          const lobbyPanel = lobbyPlanPanelState(myGroup)
          setGroupPlannedSessionsCount(lobbyPanel.plannedCount)
          setGroupUpcomingSessionsCount(lobbyPanel.upcomingPlannedCount)
          setGroupSessionSummary(lobbyPanel.groupSessionSummary)
        }
      } catch (error) {
        if (mounted) {
          setAuthError(error instanceof Error ? error.message : 'Failed to load profile')
        }
      } finally {
        if (mounted) setIsInitializing(false)
      }
    }

    init()
    return () => {
      mounted = false
    }
  }, [user?.uid, authLoading, router])

  useEffect(() => {
    if (authLoading || !user?.uid) return

    const refreshLobbyPanel = () => {
      void (async () => {
        try {
          const myGroup = await getMyLobbyGroup(user.uid)
          const lobbyPanel = lobbyPlanPanelState(myGroup)
          setGroupPlannedSessionsCount(lobbyPanel.plannedCount)
          setGroupUpcomingSessionsCount(lobbyPanel.upcomingPlannedCount)
          setGroupSessionSummary(lobbyPanel.groupSessionSummary)
        } catch (e) {
          console.error('Lobby panel refresh failed:', e)
        }
      })()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshLobbyPanel()
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [user?.uid, authLoading])

  useEffect(() => {
    let entryId: string | null = null
    let mounted = true

    const startTracking = async () => {
      if (user?.uid && mounted) {
        entryId = await startTimeTracking(user.uid, 'dashboard')
        if (mounted) setTimeEntryId(entryId)
      }
    }

    startTracking()
    return () => {
      mounted = false
      if (entryId) endTimeTracking(entryId)
    }
  }, [user?.uid])

  if (isInitializing || authLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50/80 dark:bg-black/95">
        <LoadingSpinner size="lg" isLoading={isInitializing || authLoading} />
      </div>
    )
  }

  if (authError) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-black/95">
        <div className="text-center px-4">
          <div className="text-red-500 mb-4">
            <XCircle className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-600 dark:text-gray-300">{authError}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-full"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!mounted || !user) {
    return null
  }

  const memberSince = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <ProtectedRoute>
      <div className="h-full overflow-hidden flex flex-col bg-gradient-to-b from-gray-50 to-gray-100/80 dark:from-black dark:to-gray-950/50">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Dashboard title */}
          <header className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Your account and recent sessions at a glance.
            </p>
          </header>

          {/* Profile card */}
          <Card className="overflow-hidden rounded-2xl bg-white/90 dark:bg-white/5 border-0 shadow-xl shadow-gray-200/50 dark:shadow-none backdrop-blur-sm">
            {/* Banner — compact strip, no overlap with content */}
            <div
              className="relative h-20 sm:h-24 overflow-hidden"
              aria-hidden
            >
              {profile?.bannerUrl?.trim() ? (
                <>
                  <img
                    src={profile.bannerUrl.trim()}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent dark:from-black/55"
                    aria-hidden
                  />
                </>
              ) : (
                <>
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-slate-800 via-indigo-900/95 to-violet-900 dark:from-slate-900 dark:via-indigo-950 dark:to-violet-950"
                    aria-hidden
                  />
                  <div
                    className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-violet-500/30 dark:bg-violet-400/20 blur-3xl"
                    aria-hidden
                  />
                  <div
                    className="absolute top-1/2 -left-8 h-32 w-32 rounded-full bg-indigo-500/25 dark:bg-indigo-400/15 blur-2xl"
                    aria-hidden
                  />
                  <svg
                    className="absolute inset-0 h-full w-full opacity-[0.07] dark:opacity-[0.12]"
                    aria-hidden
                  >
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
              <div className="absolute inset-x-0 top-0 h-px bg-white/20" aria-hidden />
            </div>

            {/* Profile: avatar + name in content area (no overlap, nothing clipped) */}
            <div className="px-4 sm:px-6 pt-5 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-2 border-white dark:border-gray-800 shadow-lg flex-shrink-0 ring-1 ring-black/5 dark:ring-white/10">
                  <AvatarImage src={user.photoURL || undefined} className="object-cover" />
                  <AvatarFallback className="rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xl font-semibold">
                    {user.displayName
                      ? user.displayName
                          .split(/\s+/)
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : <User className="h-8 w-8" />}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    {user.displayName || 'User'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 text-gray-500 dark:text-gray-400">
                    <Mail className="h-4 w-4 flex-shrink-0 opacity-70" />
                    <span className="text-sm truncate">{user.email}</span>
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/10 space-y-3">
                {timeStats.lastSignInTime && (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <LogIn className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      Last sign in
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white tabular-nums">
                      {timeStats.lastSignInTime.toLocaleString()}
                    </span>
                  </div>
                )}
                {memberSince && (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      Member since
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {memberSince}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => recentSessionsRef.current?.openOpenSessionsDialog('waiting')}
                  aria-label="View waiting lobby sessions"
                  className="flex w-full items-center justify-between gap-3 rounded-lg text-left text-sm text-gray-900 dark:text-white transition-colors hover:bg-gray-50 dark:hover:bg-white/5 -mx-2 px-2 py-1.5 -my-0.5"
                >
                  <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <CalendarClock className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                    Scheduled sessions
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white tabular-nums">
                    {scheduledSessionsCount}
                  </span>
                </button>
              </div>

              {/* Actions — pill-shaped buttons */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="outline" size="sm" asChild className="gap-2 rounded-full px-5">
                  <Link href="/settings">
                    <Pencil className="h-4 w-4" />
                    Edit profile
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="gap-2 rounded-full px-5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>
          </Card>

          {/* Group Sessions — collapsible */}
          <section className="mt-8">
            <Card className={DASHBOARD_VIOLET_PANEL}>
              <button
                type="button"
                id="dashboard-creator-session-toggle"
                aria-expanded={creatorSessionPanelOpen}
                aria-controls="dashboard-creator-session-panel"
                onClick={() => setCreatorSessionPanelOpen((open) => !open)}
                className="flex w-full items-start justify-between gap-3 px-4 sm:px-6 py-4 text-left transition-colors hover:bg-violet-100/80 dark:hover:bg-indigo-900/45"
              >
                <span className="min-w-0">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white block">
                    Group Sessions
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 block">
                    Planned sessions and mandala settings from Lobby. Tap to expand.
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    'h-5 w-5 shrink-0 text-violet-600 dark:text-violet-300 transition-transform duration-200 mt-0.5',
                    creatorSessionPanelOpen ? 'rotate-180' : 'rotate-0'
                  )}
                  aria-hidden
                />
              </button>
              {creatorSessionPanelOpen ? (
                <div
                  id="dashboard-creator-session-panel"
                  role="region"
                  aria-labelledby="dashboard-creator-session-toggle"
                  className="border-t border-violet-200/80 dark:border-violet-500/25 px-4 sm:px-6 pb-5 pt-1"
                >
                  <div className="flex justify-end mb-4">
                    <Button asChild type="button" variant="outline" size="sm" className="rounded-full bg-white/90 dark:bg-indigo-950/60 border-violet-200/90 dark:border-violet-500/35">
                      <Link href="/lobby">Manage in Lobby</Link>
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-violet-200/70 dark:border-white/10 bg-white/90 dark:bg-black/25 px-3 py-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Planned sessions</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white tabular-nums mt-1">
                        {groupPlannedSessionsCount}
                      </p>
                    </div>
                    <div className="rounded-xl border border-violet-200/70 dark:border-white/10 bg-white/90 dark:bg-black/25 px-3 py-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Upcoming planned</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white tabular-nums mt-1">
                        {groupUpcomingSessionsCount}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-sm">
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
              ) : null}
            </Card>
          </section>

          {/* Upcoming scheduled sessions */}
          <section className="mt-8">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Upcoming Scheduled Sessions
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Next planned starts from your waiting lobby sessions.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => recentSessionsRef.current?.openOpenSessionsDialog('waiting')}
              >
                Open waiting
              </Button>
            </div>
            <Card className="rounded-2xl border-0 p-4 sm:p-6 bg-white/90 dark:bg-white/5 shadow-xl shadow-gray-200/50 dark:shadow-none backdrop-blur-sm">
              {upcomingScheduledSessions.length > 0 ? (
                <ul className="space-y-2">
                  {upcomingScheduledSessions.map((session) => (
                    <li
                      key={session.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {clockTitles[session.clockId] ?? `Clock ${session.clockId}`} session
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {session.startsAt.toLocaleString()}
                        </p>
                      </div>
                      <Clock3 className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" aria-hidden />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No future scheduled sessions found. Planned sessions will appear here automatically.
                </p>
              )}
            </Card>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Recent Sessions
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Continue or restart from your latest sessions. Times reflect when you left the session.
            </p>
            <Card className={cn(DASHBOARD_VIOLET_PANEL, 'p-4 sm:p-6')}>
              <DashboardRecentSessions ref={recentSessionsRef} />
            </Card>
          </section>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
