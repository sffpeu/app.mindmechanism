'use client'

import { useRouter } from 'next/navigation'

export function AuthButtons() {
  const router = useRouter()

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => router.push('/signin')}
        className="px-4 py-2 rounded-lg text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
      >
        Sign In
      </button>
      <button
        onClick={() => router.push('/signup')}
        className="px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 transition-all"
      >
        Sign Up
      </button>
    </div>
  )
} 