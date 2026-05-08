'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { exportUserData } from '@/lib/dataExport'

export interface ExportButtonProps {
  variant?: 'full' | 'compact'
}

export function ExportButton({ variant = 'full' }: ExportButtonProps) {
  const { user, profile } = useAuth()
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const handleExport = async () => {
    if (!user?.uid || state === 'loading') return
    setState('loading')
    try {
      await exportUserData(user.uid, profile, user.metadata?.creationTime)
      setState('done')
      setTimeout(() => setState('idle'), 3000)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={() => void handleExport()}
        disabled={state === 'loading'}
        title="Export my data"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 bg-white/60 text-gray-700 transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.07]"
      >
        <Download className="h-4 w-4" aria-hidden />
        <span className="sr-only">
          {state === 'loading' && 'Preparing export'}
          {state === 'done' && 'Downloaded'}
          {state === 'error' && 'Export failed'}
          {state === 'idle' && 'Export my data'}
        </span>
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void handleExport()}
        disabled={state === 'loading'}
        className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white/60 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.07]"
      >
        <Download className="h-4 w-4 shrink-0" aria-hidden />
        {state === 'loading' && 'Preparing…'}
        {state === 'done' && 'Downloaded'}
        {state === 'error' && 'Something went wrong'}
        {state === 'idle' && 'Export my data'}
      </button>
      <p className="text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
        Downloads a JSON file containing your personal lexicon, phrase progress, practice log, and consent record.
        Voice recordings are not included — they never leave your device.
      </p>
    </div>
  )
}
