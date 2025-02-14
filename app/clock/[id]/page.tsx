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
import { useTimeTracking } from '@/lib/hooks/useTimeTracking'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { Settings, Maximize2, Minimize2, Satellite, Info } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import Timer from '@/components/Timer'
import { pauseSession, updateSessionActivity } from '@/lib/sessions'

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
  const encodedWords = searchParams.get('words')
  const words = encodedWords ? JSON.parse(decodeURIComponent(encodedWords)) : []
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const [showInfoCards, setShowInfoCards] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
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
  const { user } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Add time tracking
  useTimeTracking(user?.uid, `clock-${params.id}`)

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

  // Update fullscreen effect to handle escape key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    const duration = searchParams.get('duration');
    const sessionIdParam = searchParams.get('sessionId');
    if (duration) {
      const durationMs = parseInt(duration);
      setRemainingTime(durationMs);
      // Start countdown immediately
      const timer = setInterval(() => {
        setRemainingTime(prev => {
          if (!prev || prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
    if (sessionIdParam) {
      setSessionId(sessionIdParam);
    }
  }, [searchParams]);

  const handleSettingsSave = (newSettings: Partial<ClockSettingsType>) => {
    setLocalClockSettings({ ...localClockSettings, ...newSettings })
    setShowSettings(false)
    // Trigger a sync when settings change
    setSyncTrigger(prev => prev + 1)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const handlePauseResume = async () => {
    if (!sessionId) return;
    setIsPaused(!isPaused);
    if (!isPaused) {
      // Pausing
      await pauseSession(sessionId);
    } else {
      // Resuming
      await updateSessionActivity(sessionId);
    }
  };

  // Don't render clock until we have client-side time
  if (!currentTime) {
    return null
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-black/95">
        {/* Timer Component - Moved to bottom left */}
        <div className="fixed bottom-4 left-4 z-50">
          <Timer
            remainingTime={remainingTime}
            isPaused={isPaused}
            onPauseResume={handlePauseResume}
          />
        </div>
        
        {/* Settings Dropdown */}
        <div className="fixed top-4 right-4 z-50">
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-black/5 dark:border-white/10 hover:bg-white/90 dark:hover:bg-black/90 transition-colors">
                <Settings className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="flex items-center justify-between" onSelect={(e) => e.preventDefault()}>
                <div className="flex items-center gap-2">
                  <Satellite className="h-4 w-4" />
                  <span>Satellites</span>
                </div>
                <Switch
                  checked={showSatellites}
                  onCheckedChange={setShowSatellites}
                />
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center justify-between" onSelect={(e) => e.preventDefault()}>
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <span>Info Cards</span>
                </div>
                <Switch
                  checked={showInfoCards}
                  onCheckedChange={setShowInfoCards}
                />
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center justify-between" onSelect={(e) => e.preventDefault()}>
                <div className="flex items-center gap-2">
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                  <span>Fullscreen</span>
                </div>
                <Switch
                  checked={isFullscreen}
                  onCheckedChange={() => toggleFullscreen()}
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

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
          showInfo={showInfoCards && !isFullscreen}
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
      </div>
    </ProtectedRoute>
  )
} 