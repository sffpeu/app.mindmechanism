'use client'

import { useAuth } from '@/lib/FirebaseAuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useEffect, Suspense } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

function hasAuthCookie(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.includes('__firebase_auth_token=')
}

function HomeLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const rawCallback = searchParams.get('callbackUrl') || '/dashboard'
  const callbackUrl =
    !rawCallback ||
    rawCallback === '/' ||
    rawCallback === '/home' ||
    rawCallback === '/home/' ||
    rawCallback.startsWith('/auth/')
      ? '/dashboard'
      : rawCallback

  useEffect(() => {
    if (user && hasAuthCookie()) {
      router.replace(callbackUrl)
    }
  }, [user, router, callbackUrl])

  const handleEnter = () => {
    router.replace(callbackUrl)
  }

  return (
    <div className="h-full flex bg-white dark:bg-[hsl(var(--background))]">
      <div className="hidden md:block md:w-[60%] relative overflow-hidden bg-gray-100 dark:bg-black/80">
        <Image
          src="/dashboard-preview.png"
          alt="Mindmechanism dashboard — Recent Sessions and Create Session"
          fill
          className="object-cover object-left-top"
          priority
          sizes="60vw"
        />
      </div>

      <div className="w-full md:w-[40%] flex flex-col justify-center px-6 sm:px-10 lg:px-14 py-12 bg-white dark:bg-[hsl(var(--background))]">
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-sm mx-auto w-full rounded-xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_3px_rgba(255,255,255,0.06)] border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[hsl(var(--card))]"
        >
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-1">
            Welcome back
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mb-8">
            Continue to track your meditation journey and save your progress.
          </p>

          <Button
            onClick={handleEnter}
            className="w-full h-11 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm"
          >
            Enter
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="h-full bg-white dark:bg-[hsl(var(--background))] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 dark:border-white/20 border-t-red-600 dark:border-t-red-500" />
        </div>
      }
    >
      <HomeLoginContent />
    </Suspense>
  )
}
