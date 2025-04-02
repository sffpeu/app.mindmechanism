'use client'

import { useState } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function NodesPage() {
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const { isDarkMode } = useTheme()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-black/95">
        <Menu
          showElements={showElements}
          onToggleShow={() => setShowElements(!showElements)}
          showSatellites={showSatellites}
          onSatellitesChange={setShowSatellites}
        />
        
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-medium text-gray-900 dark:text-white">Nodes</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-lg">
                Manage your nodes here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
} 