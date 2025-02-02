'use client'

import { useParams, useSearchParams } from 'next/navigation'
import Clock from '@/components/Clock'
import { useState, useEffect } from 'react'
import DotNavigation from '@/components/DotNavigation'
import { clockSettings } from '@/lib/clockSettings'
import { Menu } from '@/components/Menu'
import { ClockSettings } from '@/components/ClockSettings'
import { ClockSettings as ClockSettingsType } from '@/types/ClockSettings'
import { useTheme } from '@/app/ThemeContext'
import { Timer } from '@/components/Timer'

interface WeatherResponse {
  location: {
    name: string
    region: string
    country: string
    lat: number
    lon: number
    tz_id: string
    localtime: string
  }
  current: {
    temp_c: number
    condition: {
      text: string
      icon: string
    }
    humidity: number
    uv: number
    pressure_mb: number
    wind_kph: number
  }
}

interface MoonData {
  moon_phase: string
  moon_illumination: string
  moonrise: string
  moonset: string
  next_full_moon: string
  next_new_moon: string
}

// Clock colors mapping
const clockColors = [
  'text-red-500 bg-red-500',
  'text-orange-500 bg-orange-500',
  'text-yellow-500 bg-yellow-500',
  'text-green-500 bg-green-500',
  'text-blue-500 bg-blue-500',
  'text-pink-500 bg-pink-500',
  'text-purple-500 bg-purple-500',
  'text-indigo-500 bg-indigo-500',
  'text-cyan-500 bg-cyan-500'
]

export default function ClockPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = parseInt(params.id as string)
  const [duration, setDuration] = useState(0)
  const encodedWords = searchParams.get('words')
  const words = encodedWords ? JSON.parse(decodeURIComponent(encodedWords)) : []
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const [showInfoCards, setShowInfoCards] = useState(true)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const { isDarkMode } = useTheme()
  const [isSmallMultiView, setIsSmallMultiView] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [localClockSettings, setLocalClockSettings] = useState<ClockSettingsType>(clockSettings[id])
  const [syncTrigger, setSyncTrigger] = useState(0)
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null)
  const [moon, setMoon] = useState<MoonData | null>(null)
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  // Initialize duration and start timer from URL params
  useEffect(() => {
    const durationParam = searchParams.get('duration')
    if (durationParam) {
      // Convert minutes to milliseconds (1 minute = 60 seconds = 60,000 milliseconds)
      const minutes = parseInt(durationParam)
      const durationMs = minutes * 60 * 1000
      setDuration(durationMs)
      // Automatically start the timer
      setIsRunning(true)
    }
  }, [searchParams])

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

  // Request location permission and get coordinates
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          })
          setLocationError(null)
        },
        (error) => {
          console.error('Error getting location:', error)
          setLocationError('Unable to get your location. Using IP-based location instead.')
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      )
    } else {
      setLocationError('Geolocation is not supported by your browser. Using IP-based location instead.')
    }
  }, [])

  // Fetch weather and moon data with precise location
  useEffect(() => {
    const fetchData = async () => {
      try {
        const weatherRes = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=6cb652a81cb64a19a84103447252001&q=${
            location ? `${location.lat},${location.lon}` : 'auto:ip'
          }&aqi=no`
        )
        const weatherData = await weatherRes.json()
        setWeatherData(weatherData)

        const astronomyRes = await fetch(
          `https://api.weatherapi.com/v1/astronomy.json?key=6cb652a81cb64a19a84103447252001&q=${
            location ? `${location.lat},${location.lon}` : 'auto:ip'
          }`
        )
        const astronomyData = await astronomyRes.json()
        setMoon(astronomyData.astronomy.astro)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [location])

  const handleSettingsSave = (newSettings: Partial<ClockSettingsType>) => {
    setLocalClockSettings({ ...localClockSettings, ...newSettings })
    setShowSettings(false)
    // Trigger a sync when settings change
    setSyncTrigger(prev => prev + 1)
  }

  const handleComplete = () => {
    setIsRunning(false)
    // Handle timer completion
    console.log('Timer completed')
  }

  const handleToggle = () => {
    setIsRunning(!isRunning)
  }

  const handleReset = () => {
    setIsRunning(false)
    // Reset duration to initial value from URL params
    const durationParam = searchParams.get('duration')
    if (durationParam) {
      // Convert minutes to milliseconds
      const minutes = parseInt(durationParam)
      const durationMs = minutes * 60 * 1000
      setDuration(durationMs)
    }
  }

  // Don't render clock until we have client-side time
  if (!currentTime) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95">
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
        customWords={words}
      />
      {showSettings && (
        <ClockSettings
          settings={localClockSettings}
          onSave={handleSettingsSave}
          onCancel={() => setShowSettings(false)}
        />
      )}
      <Timer
        duration={duration}
        onComplete={handleComplete}
        isRunning={isRunning}
        onToggle={handleToggle}
        onReset={handleReset}
        clockId={id}
      />
    </div>
  )
} 