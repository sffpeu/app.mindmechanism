'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { usePortal } from '@/contexts/PortalContext'

type Props = {
  /** When false, omit primary / secondary CTAs (e.g. on /home where auth lives beside copy). */
  showCtas?: boolean
  className?: string
}

export function HeroSection({ showCtas = true, className }: Props) {
  const { config } = usePortal()

  return (
    <section
      className={cn(
        'mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center px-6 py-20',
        className
      )}
    >
      <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
        {config.name}
      </p>
      <h1 className="mb-6 font-serif text-4xl font-semibold leading-tight text-gray-900 dark:text-gray-100">
        {config.heroHeadline}
      </h1>
      <p className="mb-10 max-w-xl text-lg leading-relaxed text-gray-500 dark:text-gray-400">{config.heroSubtext}</p>
      {showCtas ? (
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/register"
            className="bg-gray-900 px-6 py-3 text-sm font-medium tracking-wide text-gray-100 transition-opacity hover:opacity-80 dark:bg-gray-100 dark:text-gray-900"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="text-sm text-gray-500 transition-colors hover:text-gray-700 dark:hover:text-gray-300"
          >
            Sign in →
          </Link>
        </div>
      ) : null}
    </section>
  )
}
