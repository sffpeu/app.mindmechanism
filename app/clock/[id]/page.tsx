'use client'

import { useParams } from 'next/navigation'
import Clock from '@/components/Clock'
import { useState, useEffect } from 'react'
import DotNavigation from '@/components/DotNavigation'
import { clockSettings } from '@/lib/clockSettings'
import { Menu } from '@/components/Menu'
import { ClockSettings } from '@/components/ClockSettings'
import { ClockSettings as ClockSettingsType } from '@/types/ClockSettings'
import { useTheme } from '@/app/ThemeContext'
import { Logo } from '@/components/Logo'

export default function ClockPage() {
  const params = useParams()
  const id = parseInt(params.id as string)
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const [showInfoCards, setShowInfoCards] = useState(true)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const { isDarkMode } = useTheme()
  const [isSmallMultiView, setIsSmallMultiView] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [localClockSettings, setLocalClockSettings] = useState<ClockSettingsType>(clockSettings[id])
  const [syncTrigger, setSyncTrigger] = useState(0)

  // Initialize current time
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

  const handleSettingsSave = (newSettings: Partial<ClockSettingsType>) => {
    setLocalClockSettings({ ...localClockSettings, ...newSettings })
    setShowSettings(false)
    // Trigger a sync when settings change
    setSyncTrigger(prev => prev + 1)
  }

  // Don't render clock until we have client-side time
  if (!currentTime) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95">
      <Logo />
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
        showSatellites={showSatellites}
        onSatellitesChange={setShowSatellites}
        showInfoCards={showInfoCards}
        onInfoCardsChange={setShowInfoCards}
      />
      <Clock
        {...localClockSettings}
        id={id}
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
        currentTime={currentTime}
        syncTrigger={syncTrigger}
        hideControls={false}
        showSatellites={showSatellites}
        showInfo={showInfoCards}
        isMultiView={false}
        isMultiView2={false}
        allClocks={clockSettings}
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