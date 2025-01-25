'use client'

import { useEffect, useState } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { Logo } from '@/components/Logo'
import Clock from '@/components/Clock'
import { Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { isDarkMode } = useTheme()
  const router = useRouter()
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
      <div className="absolute top-24 left-1/2 -translate-x-1/2">
        <button 
          onClick={() => router.push('/home')}
          className="w-fit px-4 py-2 rounded-lg bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all text-gray-900 dark:text-white"
        >
          <Home className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-6xl w-full mx-auto p-4 md:p-6">
          <Clock
            id={1}
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