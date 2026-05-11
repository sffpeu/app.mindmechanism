'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { HeroSection } from '@/components/landing/HeroSection'
import { FeatureStrip } from '@/components/landing/FeatureStrip'
import { ResearchCallout } from '@/components/landing/ResearchCallout'

export function RootPortalLanding() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      window.location.replace('/welcome')
    }
  }, [user, loading])

  if (loading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center bg-transparent">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-red-600 dark:border-white/20 dark:border-t-red-500" />
      </main>
    )
  }

  if (user) {
    return (
      <main className="flex min-h-[40vh] items-center justify-center bg-transparent">
        <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting…</p>
      </main>
    )
  }

  return (
    <main>
      <HeroSection />
      <FeatureStrip />
      <ResearchCallout />
    </main>
  )
}
