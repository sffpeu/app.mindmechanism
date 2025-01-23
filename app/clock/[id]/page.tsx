'use client'

import { useParams } from 'next/navigation'
import Clock from '@/components/Clock'
import { useState, useEffect } from 'react'
import DotNavigation from '@/components/DotNavigation'
import { clockSettings } from '@/lib/clockSettings'
import { Menu } from '@/components/Menu'
import { ClockSettings } from '@/components/ClockSettings'
import { ClockSettings as ClockSettingsType } from '@/types/ClockSettings'

export default function ClockPage() {
  const params = useParams()
  const id = parseInt(params.id as string)
  const [showElements, setShowElements] = useState(true)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isSmallMultiView, setIsSmallMultiView] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showSatellites, setShowSatellites] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [localClockSettings, setLocalClockSettings] = useState<ClockSettingsType>(clockSettings[id])

  // Initialize current time on client side only
  useEffect(() => {
    setCurrentTime(new Date())
  }, [])

  // Initialize dark mode from system preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  // Handle dark mode changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleSettingsSave = (newSettings: Partial<ClockSettingsType>) => {
    setLocalClockSettings({ ...localClockSettings, ...newSettings })
    setShowSettings(false)
  }

  // Don't render clock until we have client-side time
  if (!currentTime) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {showElements && (
        <DotNavigation
          activeDot={id}
          isSmallMultiView={isSmallMultiView}
          onOutlinedDotClick={() => setIsSmallMultiView(!isSmallMultiView)}
        />
      )}
      <Menu
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
        onSettingsClick={() => setShowSettings(true)}
        showSatellites={showSatellites}
        onSatellitesChange={setShowSatellites}
        isDarkMode={isDarkMode}
        onDarkModeChange={setIsDarkMode}
      />
      <Clock
        {...localClockSettings}
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
        currentTime={currentTime}
        syncTrigger={0}
        hideControls={false}
        showSatellites={showSatellites}
      />
      {showSettings && (
        <ClockSettings
          settings={localClockSettings}
          onSave={handleSettingsSave}
          onCancel={() => setShowSettings(false)}
        />
      )}
    </div>
  )
} 