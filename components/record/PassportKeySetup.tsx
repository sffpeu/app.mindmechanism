'use client'

import { useState } from 'react'
import {
  downloadKeyBackup,
  exportKeyAsBase64,
  getOrCreatePassportKey,
} from '@/lib/passportCrypto'
import { syncPassportKeyMeta } from '@/lib/passportSilo'
import { PASSPORT_BACKUP_REMINDER_KEY } from '@/lib/passportCipherUi'

type PassportKeySetupProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  userUid: string
  onSkipWithoutBackup: () => void
  onCompleted: () => void
}

export function PassportKeySetup({
  open,
  onOpenChange,
  userUid,
  onSkipWithoutBackup,
  onCompleted,
}: PassportKeySetupProps) {
  const [busy, setBusy] = useState(false)

  if (!open) return null

  const finishWithBackup = async () => {
    setBusy(true)
    try {
      const key = await getOrCreatePassportKey()
      const b64 = await exportKeyAsBase64(key)
      downloadKeyBackup(b64)
      try {
        localStorage.setItem(PASSPORT_BACKUP_REMINDER_KEY, 'dismissed')
      } catch {
        /* ignore */
      }
      await syncPassportKeyMeta(userUid, key)
      onOpenChange(false)
      onCompleted()
    } finally {
      setBusy(false)
    }
  }

  const finishSkip = async () => {
    setBusy(true)
    try {
      const key = await getOrCreatePassportKey()
      await syncPassportKeyMeta(userUid, key)
      onSkipWithoutBackup()
      onOpenChange(false)
      onCompleted()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-950"
        role="dialog"
        aria-modal="true"
        aria-labelledby="passport-key-setup-title"
      >
        <h2
          id="passport-key-setup-title"
          className="text-sm font-semibold uppercase tracking-widest text-neutral-600 dark:text-neutral-300"
        >
          Your personal vocabulary is private
        </h2>
        <p className="mt-3 border-t border-neutral-200 pt-3 text-xs text-neutral-400 dark:border-neutral-800 dark:text-neutral-500">
          ───────────────────────────────────────────
        </p>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
          <p>
            The definitions and context you write for your personal words are encrypted on your device. Not even Mind
            Mechanism can read them.
          </p>
          <p>Your encryption key is stored in your browser.</p>
          <p>
            Download a backup — if you clear your browser data without a backup, your private definitions cannot be
            recovered.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void finishWithBackup()}
            className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900"
          >
            {busy ? 'Please wait…' : 'Download key backup and continue'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void finishSkip()}
            className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm dark:border-neutral-600"
          >
            Skip backup for now — I understand the risk
          </button>
        </div>
      </div>
    </div>
  )
}
