'use client'

import { useEffect, useState } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { Logo } from '@/components/Logo'
import Clock from '@/components/Clock'

export default function DashboardPage() {
  const { isDarkMode } = useTheme()
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [syncTrigger, setSyncTrigger] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95 flex flex-col">
      <Logo />
      <Menu
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
        showSatellites={showSatellites}
        onSatellitesChange={setShowSatellites}
      />
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-6xl w-full mx-auto p-4 md:p-6">
          <Clock
            id="main-clock"
            currentTime={currentTime}
            syncTrigger={syncTrigger}
            showElements={showElements}
            showSatellites={showSatellites}
          />
        </div>
      </div>
    </div>
  )
} 