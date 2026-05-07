'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { exchangeSpotifyCode } from '@/lib/spotify'
import { useSettings } from '@/lib/hooks/useSettings'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Suspense } from 'react'

function SpotifyCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setSpotifyTokens } = useSettings()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      setErrorMsg(error === 'access_denied' ? 'You declined Spotify access.' : `Spotify error: ${error}`)
      setStatus('error')
      return
    }

    if (!code) {
      setErrorMsg('No authorisation code received from Spotify.')
      setStatus('error')
      return
    }

    exchangeSpotifyCode(code)
      .then((tokens) => {
        setSpotifyTokens(tokens)
        setStatus('success')
        setTimeout(() => router.push('/settings'), 1200)
      })
      .catch((err: unknown) => {
        setErrorMsg(err instanceof Error ? err.message : 'Connection failed')
        setStatus('error')
      })
  }, [searchParams, router, setSpotifyTokens])

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="flex flex-col items-center gap-4 p-8 text-center max-w-sm">
        {status === 'loading' && (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Connecting Spotify…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">Spotify connected</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Taking you back to settings…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">Connection failed</p>
            <p className="text-xs text-red-600 dark:text-red-400">{errorMsg}</p>
            <button
              type="button"
              onClick={() => router.push('/settings')}
              className="mt-2 text-xs text-gray-500 underline"
            >
              Back to settings
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function SpotifyCallbackPage() {
  return (
    <Suspense>
      <SpotifyCallbackInner />
    </Suspense>
  )
}
