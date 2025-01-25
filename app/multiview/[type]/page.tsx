'use client'

import { useState, useEffect } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import Clock from '@/components/Clock'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { clockSettings } from '@/lib/clockSettings'
import { motion, AnimatePresence } from 'framer-motion'
import DotNavigation from '@/components/DotNavigation'

export default function MultiViewPage() {
  const params = useParams()
  const type = parseInt(params.type as string)
  const [showElements, setShowElements] = useState(true)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [showSatellites, setShowSatellites] = useState(false)
  const { isDarkMode } = useTheme()

  // Initialize current time on client side only
  useEffect(() => {
    setCurrentTime(new Date())
  }, [])

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Don't render until we have client-side time
  if (!currentTime) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-black/95">
      {showElements && (
        <DotNavigation
          activeDot={9}
          isSmallMultiView={type === 2}
        />
      )}
      <Menu
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
        showSatellites={showSatellites}
        onSatellitesChange={setShowSatellites}
      />
      <div className="flex-grow flex items-center justify-center">
        <Clock
          id={9}
          showElements={showElements}
          onToggleShow={() => setShowElements(!showElements)}
          currentTime={currentTime}
          syncTrigger={0}
          hideControls={false}
          showSatellites={showSatellites}
          isMultiView={type === 1}
          isMultiView2={type === 2}
          allClocks={clockSettings}
        />
      </div>
    </div>
  )
} 