'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

function SignInRedirectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const callbackUrl = searchParams.get('callbackUrl')
    const url = callbackUrl ? `/home?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/home'
    router.replace(url)
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 dark:border-white/20 border-t-black dark:border-t-white" />
    </div>
  )
}

/** Legacy route: redirects to the new home login screen (/home). Preserves callbackUrl. */
export default function SignInRedirect() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-black/95 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 dark:border-white/20 border-t-black dark:border-t-white" />
      </div>
    }>
      <SignInRedirectContent />
    </Suspense>
  )
}
