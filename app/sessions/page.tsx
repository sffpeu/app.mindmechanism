'use client'

import { useState } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'

export default function SessionsPage() {
  const { isDarkMode } = useTheme()
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95">
      <Menu
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
        showSatellites={showSatellites}
        onSatellitesChange={setShowSatellites}
      />
      
      <div className="max-w-6xl mx-auto p-4 md:p-6 pt-24">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold dark:text-white mb-2">Sessions</h1>
          <p className="text-gray-600 dark:text-gray-400">Start or continue your meditation sessions</p>
        </div>
      </div>
    </div>
  )
} 