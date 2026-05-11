'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Mail, KeyRound } from 'lucide-react'
import { ExportButton } from '@/components/record/ExportButton'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { cn } from '@/lib/utils'
import { downloadKeyBackup, exportKeyAsBase64, hasPassportKey, importKeyFromBase64, loadKey } from '@/lib/passportCrypto'
import { syncPassportKeyMeta } from '@/lib/passportSilo'
import { rotatePassportKey } from '@/lib/passportKeyRotation'
import { PASSPORT_BACKUP_REMINDER_KEY } from '@/lib/passportCipherUi'
import { usePassportKey } from '@/components/passport/PassportKeyProvider'
import { collection, getCountFromServer, query, where, getDocs, type Firestore } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const TIER_CONFIG = {
  open:      { label: 'Open',      color: 'text-gray-500 dark:text-gray-400' },
  standard:  { label: 'Standard',  color: 'text-sky-600 dark:text-sky-400'   },
  sovereign: { label: 'Sovereign', color: 'text-violet-600 dark:text-violet-400' },
} as const

export function AccountSettings() {
  const { user, profile } = useAuth()
  const { refreshFromIdb } = usePassportKey()
  const tier = profile?.tier ?? 'open'
  const tierCfg = TIER_CONFIG[tier]
  const [keyMsg, setKeyMsg] = useState<string | null>(null)
  const [hasKey, setHasKey] = useState<boolean | null>(null)
  const [personalWordCount, setPersonalWordCount] = useState<number | null>(null)
  const [rotateBusy, setRotateBusy] = useState(false)
  const restoreInputRef = useRef<HTMLInputElement>(null)

  const refreshKeyState = useCallback(async () => {
    setHasKey(await hasPassportKey())
  }, [])

  useEffect(() => {
    void refreshKeyState()
  }, [refreshKeyState])

  const uid = user?.uid

  useEffect(() => {
    if (!uid || !db) {
      setPersonalWordCount(0)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const glossaryRef = collection(db as Firestore, 'glossary')
        const q = query(
          glossaryRef,
          where('source', '==', 'user'),
          where('user_id', '==', uid),
          where('personal', '==', true)
        )
        const snap = await getCountFromServer(q)
        if (!cancelled) setPersonalWordCount(snap.data().count)
      } catch {
        if (!cancelled) setPersonalWordCount(0)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [uid])

  const handleManageAccount = () => {
    window.open('https://myaccount.google.com/security', '_blank')
  }

  const handleDownloadKeyBackup = async () => {
    setKeyMsg(null)
    const key = await loadKey()
    if (!key) {
      setKeyMsg('No encryption key found in this browser.')
      return
    }
    const b64 = await exportKeyAsBase64(key)
    downloadKeyBackup(b64)
    try {
      localStorage.setItem(PASSPORT_BACKUP_REMINDER_KEY, 'dismissed')
    } catch {
      /* ignore */
    }
  }

  const handleRestoreKeyFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyMsg(null)
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !uid) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as { mm_passport_key?: string }
      const b64 = typeof parsed.mm_passport_key === 'string' ? parsed.mm_passport_key : ''
      if (!b64.trim()) {
        setKeyMsg('That file does not contain a valid mm_passport_key field.')
        return
      }
      const key = await importKeyFromBase64(b64)
      await syncPassportKeyMeta(uid, key)
      setHasKey(true)
      await refreshFromIdb()
      await refreshKeyState()
      setKeyMsg('Key restored. Your personal definitions are now readable.')
    } catch {
      setKeyMsg('Could not read that backup file. Check the format and try again.')
    }
  }

  const handleRotateEncryptionKey = async () => {
    setKeyMsg(null)
    if (!uid) return
    if (!window.confirm('Rotate your encryption key? All encrypted personal fields will be re-encrypted.')) return
    if (!window.confirm('Confirm again: without a fresh backup you could lose access if something fails.')) return
    const oldKey = await loadKey()
    if (!oldKey) {
      setKeyMsg('No key in this browser to rotate.')
      return
    }
    setRotateBusy(true)
    try {
      const newKey = await rotatePassportKey(oldKey, async () => {
        const glossaryRef = collection(db as Firestore, 'glossary')
        const q = query(
          glossaryRef,
          where('source', '==', 'user'),
          where('user_id', '==', uid),
          where('personal', '==', true)
        )
        const snap = await getDocs(q)
        return snap.docs
          .filter((d) => d.data().encrypted === true)
          .map((d) => {
            const data = d.data()
            const fields: Record<string, string> = {}
            if (typeof data.own_definition === 'string' && data.own_definition)
              fields.own_definition = data.own_definition
            if (typeof data.context === 'string' && data.context) fields.context = data.context
            return { ref: d.ref, fields }
          })
          .filter((r) => Object.keys(r.fields).length > 0)
      })
      await syncPassportKeyMeta(uid, newKey)
      await refreshFromIdb()
      await refreshKeyState()
      setKeyMsg('Encryption key rotated. Download a new backup immediately.')
    } catch (e) {
      console.error(e)
      setKeyMsg('Key rotation failed. If your data looks wrong, restore from your most recent backup file.')
    } finally {
      setRotateBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Membership ────────────────────────────────────────────────── */}
      <Card className="p-4 bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 space-y-3">
        <p className="text-sm font-medium text-gray-900 dark:text-white">Membership</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Tier</span>
          <span className={cn('font-medium tabular-nums', tierCfg.color)}>{tierCfg.label}</span>
        </div>
        {user?.email && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Email</span>
            <span className="text-gray-700 dark:text-gray-300 truncate max-w-[16rem]">{user.email}</span>
          </div>
        )}
        {user?.metadata?.creationTime && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Member since</span>
            <span className="text-gray-700 dark:text-gray-300 tabular-nums">
              {new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
              })}
            </span>
          </div>
        )}
      </Card>

      {/* ── Your data (GDPR portability) ───────────────────────────── */}
      <Card className="space-y-3 border-neutral-200 bg-neutral-100 p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-neutral-500">
          Your data
        </p>
        <p className="text-sm leading-relaxed text-gray-600 dark:text-neutral-300">
          Export everything the platform holds for you — vocabulary, phrase progress, practice log, and consent — as
          one JSON file (GDPR Art.&nbsp;20 portability).
        </p>
        <ExportButton variant="full" />
      </Card>

      {/* ── Encryption key (personal lexicon) ───────────────────────── */}
      <Card className="space-y-3 border-neutral-200 bg-neutral-100 p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden />
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-neutral-500">
            Encryption key
          </p>
        </div>
        <p className="text-xs text-neutral-300 dark:text-neutral-700">──────────────────────────────────────────────</p>
        <p className="text-sm leading-relaxed text-gray-600 dark:text-neutral-300">
          Your personal vocabulary definitions are encrypted on your device.
        </p>
        {hasKey === null || (uid && personalWordCount === null) ? (
          <p className="text-xs text-gray-500 dark:text-neutral-400">Checking encryption state…</p>
        ) : hasKey === false && personalWordCount === 0 ? (
          <p className="text-sm text-gray-600 dark:text-neutral-400">
            Your encryption key will be generated when you add your first personal word.
          </p>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={hasKey !== true}
              onClick={() => void handleDownloadKeyBackup()}
            >
              Download key backup
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => restoreInputRef.current?.click()}
            >
              Restore from backup file
            </Button>
            <input
              ref={restoreInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => void handleRestoreKeyFile(e)}
            />
            <details className="w-full border-t border-neutral-200 pt-3 text-xs text-gray-500 dark:border-neutral-800 dark:text-neutral-500">
              <summary className="cursor-pointer select-none text-gray-600 dark:text-neutral-400">
                Advanced: rotate encryption key
              </summary>
              <p className="mt-2 leading-relaxed">
                Generates a new key and re-encrypts encrypted personal lexicon fields in Firestore. Download a fresh
                backup immediately afterward. Only use if you understand the risk.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                disabled={hasKey !== true || rotateBusy}
                onClick={() => void handleRotateEncryptionKey()}
              >
                {rotateBusy ? 'Rotating…' : 'Rotate encryption key…'}
              </Button>
            </details>
          </div>
        )}
        {keyMsg && <p className="text-sm text-gray-700 dark:text-neutral-200">{keyMsg}</p>}
      </Card>

      {/* ── Authentication ────────────────────────────────────────────── */}
      <Card className="p-4 bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Google Account</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Password and two-factor authentication</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManageAccount}
            className="flex items-center gap-1.5 shrink-0"
          >
            <Shield className="h-4 w-4" />
            Manage
          </Button>
        </div>
      </Card>
    </div>
  )
}
