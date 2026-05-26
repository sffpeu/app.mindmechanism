'use client'

import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { DatenschutzContent } from '@/components/legal/DatenschutzContent'

export default function DatenschutzPage() {
  const router = useRouter()
  return (
    <main className="relative mx-auto max-w-2xl px-6 py-16">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Close"
        className="fixed top-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700 transition-colors"
      >
        <X size={16} />
      </button>
      <DatenschutzContent />
    </main>
  )
}
