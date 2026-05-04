'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { cn } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'

const STORAGE_DONE = 'mindmechanism-welcome-completed'
const STORAGE_CHOICE = 'mindmechanism-welcome-choice'

type Choice = 'a' | 'b' | 'c'

/** Where users land after dismissing the splash (mandala home). */
const CONTINUE_PATH = '/layers'

export default function WelcomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [choice, setChoice] = useState<Choice | null>(null)

  const todayLine = useMemo(() => {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date())
  }, [])

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/home')
      return
    }
    try {
      if (typeof window !== 'undefined' && window.sessionStorage.getItem(STORAGE_DONE) === '1') {
        router.replace(CONTINUE_PATH)
      }
    } catch {
      /* ignore */
    }
  }, [user, loading, router])

  const handleContinue = () => {
    if (typeof window === 'undefined') return
    try {
      window.sessionStorage.setItem(STORAGE_DONE, '1')
      if (choice) {
        window.sessionStorage.setItem(STORAGE_CHOICE, choice)
      } else {
        window.sessionStorage.removeItem(STORAGE_CHOICE)
      }
    } catch {
      /* private mode / quota */
    }
    router.push(CONTINUE_PATH)
  }

  if (loading || !user) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100/90 dark:from-black dark:to-gray-950/80">
        <LoadingSpinner size="lg" isLoading />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100/90 dark:from-black dark:to-gray-950/80">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-8 px-6 py-12 sm:py-16">
        <header className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            Welcome to the mind mechanism
          </h1>
          <p
            className="mt-4 text-lg text-gray-600 dark:text-gray-300"
            aria-live="polite"
          >
            {todayLine}
          </p>
        </header>

        <div>
          <h2 className="mb-4 text-center text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            What would you like to do today?
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                { id: 'a' as const, label: 'A' },
                { id: 'b' as const, label: 'B' },
                { id: 'c' as const, label: 'C' },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setChoice((prev) => (prev === id ? null : id))}
                className={cn(
                  'rounded-2xl border-2 px-4 py-8 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950',
                  choice === id
                    ? 'border-violet-600 bg-violet-100/90 shadow-lg dark:border-violet-400 dark:bg-violet-950/50'
                    : 'border-gray-200 bg-white/90 hover:border-violet-300 hover:bg-violet-50/80 dark:border-white/15 dark:bg-white/5 dark:hover:border-violet-500/40 dark:hover:bg-white/10'
                )}
                aria-pressed={choice === id}
              >
                <span className="text-3xl font-bold tabular-nums text-gray-900 dark:text-white">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <Card className="border-violet-200/80 bg-white/95 p-6 shadow-xl dark:border-violet-500/25 dark:bg-gray-950/80">
          <p className="mb-4 text-center text-sm text-gray-600 dark:text-gray-300">
            Continue into the app when you&apos;re ready. You can skip choosing an option for now.
          </p>
          <Button
            type="button"
            size="lg"
            className="w-full gap-2 rounded-full text-base"
            onClick={handleContinue}
          >
            Continue
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Button>
        </Card>
      </div>
    </div>
  )
}
