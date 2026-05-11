'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="shrink-0 border-t border-black/8 bg-white/80 px-4 py-2 dark:border-white/10 dark:bg-neutral-950/80">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center">
        <Link
          href="/datenschutz"
          className="text-xs text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          Datenschutz
        </Link>
      </div>
    </footer>
  )
}
