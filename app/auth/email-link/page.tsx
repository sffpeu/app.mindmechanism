'use client'

import { useCallback, useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { syncFirebaseAuthCookie } from '@/lib/syncFirebaseAuthCookie'
import {
  FIREBASE_EMAIL_LINK_STORAGE_KEY,
  sanitizeEmailLinkCallback,
} from '@/lib/firebaseEmailLink'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function firebaseLinkErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code?: string }).code)
    const map: Record<string, string> = {
      'auth/invalid-email': 'Enter a valid email address.',
      'auth/invalid-action-code': 'This sign-in link is invalid or was already used.',
      'auth/expired-action-code': 'This sign-in link has expired. Request a new one from the login page.',
    }
    if (map[code]) return map[code]
  }
  return 'Could not complete sign-in. Try requesting a new link.'
}

function EmailLinkFinishInner() {
  const searchParams = useSearchParams()
  const urlCallback = sanitizeEmailLinkCallback(searchParams.get('callbackUrl'))

  const [phase, setPhase] = useState<'checking' | 'working' | 'need-email' | 'bad-link'>('checking')
  const [error, setError] = useState('')
  const [emailInput, setEmailInput] = useState('')

  const completeSignIn = useCallback(
    async (email: string) => {
      if (!auth || typeof window === 'undefined') {
        setError('Authentication is not available.')
        return
      }
      setPhase('working')
      setError('')
      try {
        const credential = await signInWithEmailLink(auth, email.trim(), window.location.href)
        await syncFirebaseAuthCookie(credential.user)
        window.localStorage.removeItem(FIREBASE_EMAIL_LINK_STORAGE_KEY)
        window.location.replace(urlCallback)
      } catch (err) {
        console.error('Email link sign-in error:', err)
        setPhase('need-email')
        setError(firebaseLinkErrorMessage(err))
      }
    },
    [urlCallback]
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout>

    const tryFinish = () => {
      if (cancelled) return
      if (!auth) {
        timeoutId = setTimeout(tryFinish, 50)
        return
      }

      if (!isSignInWithEmailLink(auth, window.location.href)) {
        setPhase('bad-link')
        return
      }

      const stored = window.localStorage.getItem(FIREBASE_EMAIL_LINK_STORAGE_KEY)
      if (stored) {
        void completeSignIn(stored)
        return
      }

      setPhase('need-email')
    }

    tryFinish()
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [completeSignIn])

  if (phase === 'bad-link') {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center space-y-4">
        <h1 className="text-xl font-semibold text-[hsl(var(--foreground))]">Sign-in link</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Open the link from your sign-in email on this device, or go back and choose{' '}
          <span className="whitespace-nowrap">“Email me a sign-in link”</span> again.
        </p>
        <Button asChild variant="outline" className="mt-2">
          <Link href="/home">Back to login</Link>
        </Button>
      </div>
    )
  }

  if (phase === 'checking' || phase === 'working') {
    return (
      <div className="h-full min-h-[40vh] flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 dark:border-white/20 border-t-red-600 dark:border-t-red-500 mx-auto" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {phase === 'checking' ? 'Preparing sign-in…' : 'Completing sign-in…'}
          </p>
        </div>
      </div>
    )
  }

  if (phase === 'need-email') {
    return (
      <div className="max-w-md mx-auto px-6 py-16 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-xl font-semibold text-[hsl(var(--foreground))]">Confirm your email</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            If you opened this link on another device or browser, enter the same email you used to request the
            link.
          </p>
        </div>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!emailInput.trim()) {
              setError('Enter your email address.')
              return
            }
            void completeSignIn(emailInput.trim())
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="email-link-confirm">Email</Label>
            <Input
              id="email-link-confirm"
              type="email"
              autoComplete="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="h-10"
              required
            />
          </div>
          {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
          <Button type="submit" className="w-full h-11 bg-red-600 hover:bg-red-700 text-white">
            Continue
          </Button>
        </form>
        <p className="text-center text-sm">
          <Link href="/home" className="text-red-600 dark:text-red-400 hover:underline underline-offset-2">
            Back to login
          </Link>
        </p>
      </div>
    )
  }

  return null
}

export default function EmailLinkFinishPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full min-h-[40vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 dark:border-white/20 border-t-red-600 dark:border-t-red-500" />
        </div>
      }
    >
      <EmailLinkFinishInner />
    </Suspense>
  )
}
