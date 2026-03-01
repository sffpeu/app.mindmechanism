'use client'

import { useEffect, useState } from 'react'
import { Menu } from '@/components/Menu'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Mail, Calendar, LogIn, Pencil, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/FirebaseAuthContext'
import Link from 'next/link'
import { calculateUserTimeStats } from '@/lib/timeTracking'
import { startTimeTracking, endTimeTracking } from '@/lib/timeTracking'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { XCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DashboardRecentSessions } from '@/components/DashboardRecentSessions'

interface TimeStats {
  totalTime: number
  monthlyTime: number
  lastSignInTime: Date | null
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const [timeStats, setTimeStats] = useState<TimeStats>({
    totalTime: 0,
    monthlyTime: 0,
    lastSignInTime: null,
  })
  const [timeEntryId, setTimeEntryId] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        if (authLoading || !user) {
          if (!authLoading && !user) {
            router.push('/login')
          }
          return
        }
        setIsInitializing(true)
        setAuthError(null)
        const timeStatsData = await calculateUserTimeStats(user.uid)
        if (mounted) {
          setTimeStats(timeStatsData)
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
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" isLoading={isInitializing || authLoading} />
      </div>
    )
  }

  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <XCircle className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-600 dark:text-gray-300">{authError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
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
      <div className="min-h-screen bg-gray-50 dark:bg-black/95">
        <Menu />
        <div className="max-w-2xl mx-auto p-4 sm:p-6">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Profile
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5">
              Your account at a glance.
            </p>
          </header>

          <Card className="overflow-hidden bg-white dark:bg-black/40 border border-black/5 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-none">
            {/* Banner strip */}
            <div
              className="h-24 sm:h-28 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 dark:from-slate-800 dark:via-slate-700 dark:to-slate-900"
              aria-hidden
            />

            <div className="px-4 sm:px-6 pb-6">
              {/* Avatar overlapping banner */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-14">
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-4 border-white dark:border-black/40 shadow-xl ring-2 ring-black/5 dark:ring-white/10 flex-shrink-0">
                  <AvatarImage src={user.photoURL || undefined} className="object-cover" />
                  <AvatarFallback className="rounded-2xl bg-slate-500 text-white text-2xl font-medium">
                    {user.displayName
                      ? user.displayName
                          .split(/\s+/)
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : <User className="h-10 w-10" />}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 pt-1 sm:pt-0 sm:pb-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    {user.displayName || 'User'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 text-gray-500 dark:text-gray-400">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate">{user.email}</span>
                  </div>
                </div>
              </div>

              {/* Meta row */}
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/10 space-y-3">
                {timeStats.lastSignInTime && (
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-2">
                      <LogIn className="h-4 w-4 text-gray-400" />
                      Last sign in
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {timeStats.lastSignInTime.toLocaleString()}
                    </span>
                  </div>
                )}
                {memberSince && (
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      Member since
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {memberSince}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="outline" size="sm" asChild className="gap-2">
                  <Link href="/settings">
                    <Pencil className="h-4 w-4" />
                    Edit profile
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="gap-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>
          </Card>

          {/* Recent Sessions */}
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Recent Sessions
            </h2>
            <Card className="p-4 sm:p-6 bg-white dark:bg-black/40 border border-black/5 dark:border-white/10">
              <DashboardRecentSessions />
            </Card>
          </section>
        </div>
      </div>
    </ProtectedRoute>
  )
}
