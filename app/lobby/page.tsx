'use client'

import { SymbolicLobby } from '@/components/SymbolicLobby'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { useTimeTracking } from '@/lib/hooks/useTimeTracking'

export default function LobbyPage() {
  const { user } = useAuth()
  useTimeTracking(user?.uid, 'lobby')

  return (
    <div className="h-full overflow-hidden flex flex-col bg-transparent">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <header className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Lobby
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Anonymous symbolic presence only — no messaging.
            </p>
          </header>
          <SymbolicLobby />
        </div>
      </div>
    </div>
  )
}
