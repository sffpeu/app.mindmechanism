'use client'

import { useParams } from 'next/navigation'
import Clock from '@/components/Clock'
import { useState, useEffect } from 'react'
import DotNavigation from '@/components/DotNavigation'
import { clockSettings } from '@/lib/clockSettings'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu } from '@/components/Menu'

export default function MultiViewPage() {
  const params = useParams()
  const type = parseInt(params.type as string)
  const [showElements, setShowElements] = useState(true)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [showSatellites, setShowSatellites] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Initialize current time on client side only
  useEffect(() => {
    setCurrentTime(new Date())
  }, [])

  // Initialize dark mode from system preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDarkMode(prefersDark)
      if (prefersDark) {
        document.documentElement.classList.add('dark')
      }
    }
  }, [])

  // Handle dark mode changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

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
    <div className="min-h-screen flex flex-col">
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
        isDarkMode={isDarkMode}
        onDarkModeChange={setIsDarkMode}
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