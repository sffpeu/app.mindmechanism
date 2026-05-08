'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { requiresEmailVerification } from '@/lib/authEmailVerification'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function EmailVerificationGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading || !user) return
    if (requiresEmailVerification(user)) {
      router.replace('/auth/verify-email')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" isLoading />
      </div>
    )
  }

  if (user && requiresEmailVerification(user)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" isLoading />
      </div>
    )
  }

  return <>{children}</>
}
