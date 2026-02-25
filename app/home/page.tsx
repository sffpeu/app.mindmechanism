'use client'

import { useAuth } from '@/lib/FirebaseAuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { setCookie } from 'cookies-next'
import { toast } from 'sonner'
import { useEffect, Suspense } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

function HomeLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  useEffect(() => {
    if (user) {
      router.replace(callbackUrl)
    }
  }, [user, router, callbackUrl])

  const handleGoogleSignIn = async () => {
    try {
      if (!auth) {
        throw new Error('Firebase auth is not initialized')
      }
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)

      const token = await result.user.getIdToken()
      setCookie('__firebase_auth_token', token, {
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })

      toast.success('Successfully signed in!')
      router.replace(callbackUrl)
    } catch (error) {
      console.error('Error signing in with Google:', error)
      toast.error('Failed to sign in. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-[hsl(var(--background))]">
      {/* Left: 60% - Dashboard preview image */}
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

      {/* Right: 40% - Login panel (matches dashboard card style) */}
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
            Sign in to track your meditation journey and save your progress.
          </p>

          <Button
            onClick={handleGoogleSignIn}
            className="w-full h-11 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm"
          >
            <svg className="w-5 h-5 mr-3 shrink-0" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
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
        <div className="min-h-screen bg-white dark:bg-[hsl(var(--background))] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 dark:border-white/20 border-t-red-600 dark:border-t-red-500" />
        </div>
      }
    >
      <HomeLoginContent />
    </Suspense>
  )
}
