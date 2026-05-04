'use client'

import { useCallback, useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { applyActionCode, sendEmailVerification } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { syncFirebaseAuthCookie } from '@/lib/syncFirebaseAuthCookie'
import { requiresEmailVerification, getVerifyEmailContinueUrl } from '@/lib/authEmailVerification'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

function VerifyEmailContent() {
  const { user, loading, signOut } = useAuth()
  const searchParams = useSearchParams()
  const [resendBusy, setResendBusy] = useState(false)
  const [checkBusy, setCheckBusy] = useState(false)
  const [oobBusy, setOobBusy] = useState(false)

  const refreshAndRedirectIfVerified = useCallback(async () => {
    const u = auth?.currentUser
    if (!u) return false
    await u.reload()
    if (u.emailVerified) {
      await syncFirebaseAuthCookie(u)
      toast.success('Email verified — welcome!')
      window.location.replace('/welcome')
      return true
    }
    return false
  }, [])

  const oobCode = searchParams.get('oobCode')
  const mode = searchParams.get('mode')

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!oobCode || mode !== 'verifyEmail') {
      return
    }

    setOobBusy(true)
    let cancelled = false
    let tid: ReturnType<typeof setTimeout>
    const code = oobCode

    const finish = async () => {
      if (cancelled) return
      if (!auth) {
        tid = setTimeout(finish, 50)
        return
      }
      try {
        await applyActionCode(auth, code)
        if (cancelled) return
        window.history.replaceState({}, '', '/auth/verify-email')
        const u = auth.currentUser
        if (u) {
          await u.reload()
          await syncFirebaseAuthCookie(u)
          if (u.emailVerified) {
            toast.success('Email verified — welcome!')
            window.location.replace('/welcome')
            return
          }
        } else {
          toast.success('Email verified. Sign in to continue.')
          window.location.replace('/home')
          return
        }
      } catch (e) {
        console.error('applyActionCode (verify email):', e)
        if (!cancelled) toast.error('This verification link is invalid or expired.')
      } finally {
        if (!cancelled) setOobBusy(false)
      }
    }

    void finish()
    return () => {
      cancelled = true
      clearTimeout(tid)
    }
  }, [oobCode, mode])

  useEffect(() => {
    if (loading || oobBusy || !user) return
    if (!requiresEmailVerification(user)) {
      window.location.replace('/welcome')
    }
  }, [user, loading, oobBusy])

  const handleResend = async () => {
    const u = auth?.currentUser
    if (!u) {
      toast.error('Sign in again to resend verification.')
      return
    }
    setResendBusy(true)
    try {
      await sendEmailVerification(u, {
        url: getVerifyEmailContinueUrl(),
        handleCodeInApp: false,
      })
      toast.success('Verification email sent — check your inbox.')
    } catch (e) {
      console.error('sendEmailVerification:', e)
      toast.error('Could not send email. Try again in a few minutes.')
    } finally {
      setResendBusy(false)
    }
  }

  const handleCheckedInbox = async () => {
    const u = auth?.currentUser
    if (!u) return
    setCheckBusy(true)
    try {
      const ok = await refreshAndRedirectIfVerified()
      if (!ok) toast.info('Not verified yet — tap the link in the email, then try again.')
    } finally {
      setCheckBusy(false)
    }
  }

  if (loading || oobBusy) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 dark:border-white/20 border-t-red-600 dark:border-t-red-500" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full border-gray-200/80 dark:border-white/10 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Sign in required</CardTitle>
            <CardDescription>Create an account or sign in to verify your email.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full bg-red-600 hover:bg-red-700 text-white">
              <Link href="/home">Go to login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!requiresEmailVerification(user)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 dark:border-white/20 border-t-red-600 dark:border-t-red-500" />
      </div>
    )
  }

  const masked = user.email?.replace(/(^.).*(@.*$)/, '$1•••$2') ?? 'your email'

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12 bg-white dark:bg-[hsl(var(--background))]">
      <Card className="max-w-md w-full border-gray-200/80 dark:border-white/10 shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_3px_rgba(255,255,255,0.06)]">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Confirm your email</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            We sent a verification link to <span className="font-medium text-[hsl(var(--foreground))]">{masked}</span>.
            Open the email and tap <strong>Verify email</strong> to finish setting up your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
          <p>
            This extra step keeps your account secure. You can close this tab after verifying — or stay here and we will
            send you to the app automatically once it succeeds.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button
            type="button"
            className="w-full h-11 bg-red-600 hover:bg-red-700 text-white"
            disabled={checkBusy}
            onClick={() => void handleCheckedInbox()}
          >
            {checkBusy ? 'Checking…' : "I've verified — continue"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 border-gray-200 dark:border-white/10"
            disabled={resendBusy}
            onClick={() => void handleResend()}
          >
            {resendBusy ? 'Sending…' : 'Resend verification email'}
          </Button>
          <button
            type="button"
            onClick={() => void signOut()}
            className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] underline-offset-4 hover:underline w-full text-center pt-1"
          >
            Sign out and use a different email
          </button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 dark:border-white/20 border-t-red-600 dark:border-t-red-500" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
