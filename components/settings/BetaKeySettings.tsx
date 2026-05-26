'use client'

import { useEffect, useRef, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { BetaAccessClaim } from '@/types/Passport'
import type { Firestore } from 'firebase/firestore'

const SECTOR_LABELS: Record<string, string> = {
  consumer:  'Consumer',
  academic:  'Academic',
  corporate: 'Corporate',
}

async function getIdToken(): Promise<string | null> {
  const { auth } = await import('@/lib/firebase')
  if (!auth) return null
  const user = auth.currentUser
  if (!user) return null
  return user.getIdToken()
}

export function BetaKeySettings() {
  const { user } = useAuth()
  const [existing, setExisting] = useState<BetaAccessClaim | null>(null)
  const [loadingExisting, setLoadingExisting] = useState(true)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user || !db) { setLoadingExisting(false); return }
    getDoc(doc(db as Firestore, 'passport', user.uid))
      .then((snap) => {
        const claim = snap.data()?.betaAccess as BetaAccessClaim | undefined
        setExisting(claim ?? null)
      })
      .catch(() => {})
      .finally(() => setLoadingExisting(false))
  }, [user])

  async function handleRedeem() {
    if (!code.trim()) return
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      const token = await getIdToken()
      const res = await fetch('/api/beta-key/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Redemption failed.')
      } else {
        const label = SECTOR_LABELS[data.sector] ?? data.sector
        setSuccess(`${label} beta access granted.`)
        setExisting({ sector: data.sector, grantedAt: new Date().toISOString(), keyCode: code.trim().toUpperCase() })
        setCode('')
      }
    } catch {
      setError('Network error — please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
          Beta Access
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Enter your beta access key to unlock your sector. Keys are issued per sector: Consumer, Academic, or Corporate.
        </p>
      </div>

      {/* Current status */}
      {!loadingExisting && (
        <div className={cn(
          'rounded-lg border px-4 py-3 text-sm',
          existing
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
            : 'border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400',
        )}>
          {existing ? (
            <span>
              <span className="font-semibold">{SECTOR_LABELS[existing.sector] ?? existing.sector} beta</span>
              {' '}active — key{' '}
              <span className="font-mono">{existing.keyCode}</span>
            </span>
          ) : (
            'No beta key redeemed yet.'
          )}
        </div>
      )}

      {/* Redemption form */}
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase())
            setError(null)
            setSuccess(null)
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleRedeem() }}
          placeholder="MMW-XXXX-XXXX"
          className="font-mono tracking-widest uppercase"
          maxLength={14}
          disabled={busy}
          aria-label="Beta access key"
        />
        <Button
          onClick={handleRedeem}
          disabled={busy || !code.trim()}
          className="shrink-0"
        >
          {busy ? 'Redeeming…' : 'Redeem'}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {success && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>
      )}
    </div>
  )
}
