'use client'

import { useRouter } from 'next/navigation'
import { SettingsDialog } from '@/components/settings/SettingsDialog'

export default function SettingsPage() {
  const router = useRouter()

  return (
    <div className="h-full min-h-[40vh] bg-gray-50 dark:bg-black/95" aria-hidden>
      <SettingsDialog
        isOpen
        onClose={() => {
          router.push('/dashboard')
        }}
      />
    </div>
  )
}
