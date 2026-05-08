'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/lib/FirebaseAuthContext'
import StepSequencer from '@/components/StepSequencer'

export default function SequencerPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    document.title = 'Sequencer'
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/signin')
    }
  }, [loading, router, user])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" isLoading />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-full overflow-y-auto pl-16 pr-4 py-6 sm:pr-6">
      <StepSequencer />
    </div>
  )
}
