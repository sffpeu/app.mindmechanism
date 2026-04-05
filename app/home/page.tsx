'use client'

import { useAuth } from '@/lib/FirebaseAuthContext'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  sendEmailVerification,
} from 'firebase/auth'
import { auth, waitForFirebaseAuth } from '@/lib/firebase'
import { syncFirebaseAuthCookie } from '@/lib/syncFirebaseAuthCookie'
import {
  FIREBASE_EMAIL_LINK_STORAGE_KEY,
  getEmailLinkActionUrl,
} from '@/lib/firebaseEmailLink'
import { requiresEmailVerification, getVerifyEmailContinueUrl } from '@/lib/authEmailVerification'
import { toast } from 'sonner'
import { useEffect, Suspense, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function hasAuthCookie(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.includes('__firebase_auth_token=')
}

const isDevBypassVisible = process.env.NODE_ENV === 'development'

function firebaseAuthMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code?: string }).code)
    const map: Record<string, string> = {
      'auth/email-already-in-use': 'That email is already registered. Try signing in instead.',
      'auth/invalid-email': 'Enter a valid email address.',
      'auth/weak-password': 'Use a stronger password (at least 6 characters).',
      'auth/user-not-found': 'No account found for that email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-credential': 'Email or password is incorrect.',
      'auth/too-many-requests': 'Too many attempts. Try again in a few minutes.',
      'auth/unauthorized-continue-uri':
        'This sign-in link URL is not allowed. In Firebase Console → Authentication → Settings, add your site under Authorized domains (e.g. localhost and your production domain).',
    }
    if (map[code]) return map[code]
  }
  return 'Something went wrong. Please try again.'
}

function HomeLoginContent() {
  const [devEmail, setDevEmail] = useState('')
  const [emailAuthEmail, setEmailAuthEmail] = useState('')
  const [emailAuthPassword, setEmailAuthPassword] = useState('')
  const [emailAuthMode, setEmailAuthMode] = useState<'signin' | 'signup'>('signin')
  const [emailAuthBusy, setEmailAuthBusy] = useState(false)
  const [emailLinkBusy, setEmailLinkBusy] = useState(false)
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const rawCallback = searchParams.get('callbackUrl') || '/dashboard'
  // Avoid redirect loop: never send logged-in user back to /home or auth
  const callbackUrl =
    !rawCallback ||
    rawCallback === '/' ||
    rawCallback === '/home' ||
    rawCallback === '/home/' ||
    rawCallback.startsWith('/auth/')
      ? '/dashboard'
      : rawCallback

  useEffect(() => {
    // Full navigation so middleware always sees the cookie (client router alone can race).
    if (user && hasAuthCookie()) {
      if (requiresEmailVerification(user)) {
        window.location.replace('/auth/verify-email')
        return
      }
      window.location.replace(callbackUrl)
    }
  }, [user, callbackUrl])

  const handleGoogleSignIn = async () => {
    try {
      const authInstance = await waitForFirebaseAuth()
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(authInstance, provider)
      await syncFirebaseAuthCookie(result.user)

      toast.success('Successfully signed in!')
      window.location.assign(callbackUrl)
    } catch (error) {
      console.error('Error signing in with Google:', error)
      toast.error('Failed to sign in. Please try again.')
    }
  }

  const signInWithDevToken = async (body: object | undefined, successMessage: string) => {
    const authInstance = await waitForFirebaseAuth()
    const res = await fetch('/api/auth/dev-bypass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : '{}',
    })
    const data = (await res.json()) as { token?: string; error?: string }
    if (!res.ok || !data.token) {
      throw new Error(data.error || 'Dev bypass failed')
    }
    const credential = await signInWithCustomToken(authInstance, data.token)
    await syncFirebaseAuthCookie(credential.user)
    toast.success(successMessage)
    window.location.assign(callbackUrl)
  }

  const handleDevBypass = async () => {
    try {
      await signInWithDevToken(undefined, 'Signed in as dev admin')
    } catch (error) {
      console.error('Dev bypass error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Dev sign-in failed. Check server credentials in .env.local.'
      )
    }
  }

  const handleDevEmailBypass = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!devEmail.trim()) {
        toast.error('Enter your dev email')
        return
      }
      await signInWithDevToken({ email: devEmail.trim() }, 'Signed in with allowlisted email')
    } catch (error) {
      console.error('Dev email bypass error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Dev sign-in failed. Check DEV_AUTH_ALLOWLIST_EMAILS in .env.local.'
      )
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = emailAuthEmail.trim()
    if (!email) {
      toast.error('Enter your email')
      return
    }

    let authInstance: NonNullable<typeof auth>
    try {
      authInstance = await waitForFirebaseAuth()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Firebase is not ready.')
      return
    }

    if (isDevBypassVisible && email.toLowerCase() === 'admin') {
      if (emailAuthMode === 'signup') {
        toast.error('For the local admin account, use Sign in (not sign up).')
        return
      }
      setEmailAuthBusy(true)
      try {
        await signInWithDevToken(
          { username: email, password: emailAuthPassword },
          'Signed in as local admin'
        )
      } catch (error) {
        console.error('Local dev admin sign-in error:', error)
        toast.error(
          error instanceof Error ? error.message : 'Local sign-in failed. Check FIREBASE_SERVICE_ACCOUNT_JSON in .env.local.'
        )
      } finally {
        setEmailAuthBusy(false)
      }
      return
    }

    setEmailAuthBusy(true)
    try {
      const credential =
        emailAuthMode === 'signin'
          ? await signInWithEmailAndPassword(authInstance, email, emailAuthPassword)
          : await createUserWithEmailAndPassword(authInstance, email, emailAuthPassword)
      await syncFirebaseAuthCookie(credential.user)

      if (emailAuthMode === 'signup') {
        await sendEmailVerification(credential.user, {
          url: getVerifyEmailContinueUrl(),
          handleCodeInApp: false,
        })
        toast.success('Check your email — we sent a link to verify your account.')
        window.location.assign('/auth/verify-email')
        return
      }

      if (requiresEmailVerification(credential.user)) {
        toast.info('Please verify your email to continue.')
        window.location.assign('/auth/verify-email')
        return
      }

      toast.success('Signed in!')
      window.location.assign(callbackUrl)
    } catch (error) {
      console.error('Email auth error:', error)
      toast.error(firebaseAuthMessage(error))
    } finally {
      setEmailAuthBusy(false)
    }
  }

  const handleSendEmailLink = async () => {
    const email = emailAuthEmail.trim()
    if (!email) {
      toast.error('Enter your email to receive a sign-in link.')
      return
    }
    setEmailLinkBusy(true)
    try {
      const authInstance = await waitForFirebaseAuth()
      const actionCodeSettings = {
        url: getEmailLinkActionUrl(callbackUrl),
        handleCodeInApp: true,
      }
      await sendSignInLinkToEmail(authInstance, email, actionCodeSettings)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(FIREBASE_EMAIL_LINK_STORAGE_KEY, email)
      }
      toast.success('Check your email — we sent you a sign-in link.')
    } catch (error) {
      console.error('sendSignInLinkToEmail error:', error)
      toast.error(firebaseAuthMessage(error))
    } finally {
      setEmailLinkBusy(false)
    }
  }

  return (
    <div className="h-full flex bg-white dark:bg-[hsl(var(--background))]">
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
            {emailAuthMode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm mb-8">
            {emailAuthMode === 'signin'
              ? 'Sign in to track your meditation journey and save your progress.'
              : 'Sign up with email to save your progress and pick up where you left off.'}
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <span className="w-full border-t border-gray-200/80 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-[hsl(var(--card))] px-3 text-[hsl(var(--muted-foreground))]">
                Or use email
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="home-auth-email" className="text-sm text-[hsl(var(--foreground))]">
                {isDevBypassVisible ? 'Email (dev: use admin)' : 'Email'}
              </Label>
              <Input
                id="home-auth-email"
                type="text"
                inputMode="email"
                autoComplete="username"
                value={emailAuthEmail}
                onChange={(e) => setEmailAuthEmail(e.target.value)}
                required
                className="h-10 bg-white dark:bg-black/40 border-gray-200 dark:border-white/10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="home-auth-password" className="text-sm text-[hsl(var(--foreground))]">
                Password
              </Label>
              <Input
                id="home-auth-password"
                type="password"
                autoComplete={emailAuthMode === 'signin' ? 'current-password' : 'new-password'}
                value={emailAuthPassword}
                onChange={(e) => setEmailAuthPassword(e.target.value)}
                required
                minLength={
                  isDevBypassVisible && emailAuthEmail.trim().toLowerCase() === 'admin' ? 3 : 6
                }
                className="h-10 bg-white dark:bg-black/40 border-gray-200 dark:border-white/10"
              />
            </div>
            <Button
              type="submit"
              disabled={emailAuthBusy || emailLinkBusy}
              variant="outline"
              className="w-full h-11 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
            >
              {emailAuthBusy
                ? 'Please wait…'
                : emailAuthMode === 'signin'
                  ? 'Sign in with email'
                  : 'Create account'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={emailAuthBusy || emailLinkBusy}
              onClick={() => void handleSendEmailLink()}
              className="w-full h-10 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              {emailLinkBusy ? 'Sending link…' : 'Email me a sign-in link (no password)'}
            </Button>
            <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
              {emailAuthMode === 'signin' ? (
                <>
                  New here?{' '}
                  <button
                    type="button"
                    className="text-red-600 dark:text-red-400 font-medium hover:underline underline-offset-2"
                    onClick={() => setEmailAuthMode('signup')}
                  >
                    Sign up with email
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="text-red-600 dark:text-red-400 font-medium hover:underline underline-offset-2"
                    onClick={() => setEmailAuthMode('signin')}
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </form>

          {isDevBypassVisible ? (
            <div className="mt-6 pt-6 border-t border-gray-200/80 dark:border-white/10 space-y-4">
              <form onSubmit={handleDevEmailBypass} className="space-y-2">
                <Label htmlFor="dev-auth-email" className="text-xs text-[hsl(var(--muted-foreground))]">
                  Dev: allowlisted email
                </Label>
                <Input
                  id="dev-auth-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  className="h-9 text-sm"
                />
                <Button type="submit" variant="outline" size="sm" className="w-full h-9 text-xs">
                  Continue with this email
                </Button>
              </form>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))] leading-snug">
                Or above: email <code className="text-[10px]">admin</code>, password{' '}
                <code className="text-[10px]">123</code> (requires{' '}
                <code className="text-[10px]">FIREBASE_SERVICE_ACCOUNT_JSON</code>). Allowlisted email: set{' '}
                <code className="text-[10px]">DEV_AUTH_ALLOWLIST_EMAILS</code> in{' '}
                <code className="text-[10px]">.env.local</code>.
              </p>
              <button
                type="button"
                onClick={handleDevBypass}
                className="w-full text-center text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] underline-offset-4 hover:underline"
              >
                Dev: fixed admin user (no email)
              </button>
            </div>
          ) : null}
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
