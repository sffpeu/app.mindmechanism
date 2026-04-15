'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'mindmechanism_mvp_home_panel_dismissed_v1'

export function MvpHomePanel() {
  const [dismissed, setDismissed] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === '1')
    } catch {
      setDismissed(false)
    }
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  if (dismissed === null || dismissed) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[11000] flex justify-center px-3 pt-3 sm:pt-4"
      role="region"
      aria-label="Getting started"
    >
      <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-black/10 bg-white/90 px-4 py-3 shadow-lg shadow-black/10 backdrop-blur-md dark:border-white/15 dark:bg-black/75 dark:shadow-black/40">
        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white sm:text-lg">
              Mind Mechanism
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400 sm:text-sm">
              Nine celestial mandalas for timed practice: start a session, capture notes, and use the glossary as
              acoustic keys for your vocabulary.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" className="rounded-full" asChild>
                <Link href="/sessions">Start a session</Link>
              </Button>
              <Button size="sm" variant="outline" className="rounded-full" asChild>
                <Link href="/glossary">Glossary</Link>
              </Button>
              <Button size="sm" variant="outline" className="rounded-full" asChild>
                <Link href="/notes">Notes</Link>
              </Button>
              <Button size="sm" variant="ghost" className="rounded-full" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="h-8 w-8 shrink-0 rounded-full text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Dismiss getting started"
          >
            <X className="mx-auto h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
