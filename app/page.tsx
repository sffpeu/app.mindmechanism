'use client'

import { useEffect, useState } from 'react'
import { Menu } from '@/components/Menu'
import { Card } from '@/components/ui/card'
import { Calendar, Clock, Cloud, Droplets, Gauge, Wind, Moon, ClipboardList, BookOpen, Sun, MapPin, Mountain, Waves } from 'lucide-react'

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

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [showElements, setShowElements] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showSatellites, setShowSatellites] = useState(false)
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null)
  const [moon, setMoon] = useState<MoonData | null>(null)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  // Handle mounting
  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())
  }, [])

  const formatTime = (date: Date | null) => {
    if (!date) return '--:--:--'
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }

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
    if (!mounted) return

    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [mounted])

  // Fetch weather and moon data
  useEffect(() => {
    if (!mounted) return

    const fetchData = async () => {
      try {
        const weatherRes = await fetch(
          'https://api.weatherapi.com/v1/current.json?key=6cb652a81cb64a19a84103447252001&q=auto:ip&aqi=no'
        )
        const weatherData = await weatherRes.json()
        setWeatherData(weatherData)

        const astronomyRes = await fetch(
          'https://api.weatherapi.com/v1/astronomy.json?key=6cb652a81cb64a19a84103447252001&q=auto:ip'
        )
        const astronomyData = await astronomyRes.json()
        setMoon(astronomyData.astronomy.astro)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
    // Refresh data every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [mounted])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Logo */}
      <div className="fixed top-4 left-4 z-50 w-10 h-10 rounded-full bg-white dark:bg-white/10 backdrop-blur-lg border border-black/5 dark:border-white/20 flex items-center justify-center">
        <span className="text-xl font-bold text-black dark:text-white">M</span>
      </div>

      <Menu
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
        showSatellites={showSatellites}
        onSatellitesChange={setShowSatellites}
        isDarkMode={isDarkMode}
        onDarkModeChange={setIsDarkMode}
      />

      <main className="p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Profile and Progress Section - Combined in one row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 bg-white dark:bg-white/10 backdrop-blur-lg border border-black/5 dark:border-white/20 hover:border-black/10 dark:hover:border-white/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/20 flex items-center justify-center">
                  <span className="text-xl font-semibold dark:text-white">B</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h1 className="text-xl font-semibold dark:text-white truncate">Bosen Kid Rai</h1>
                    <button className="px-3 py-1.5 text-sm bg-white dark:bg-white/20 rounded-md dark:text-white shadow-sm hover:shadow-md transition-shadow">
                      Edit
                    </button>
                  </div>
                  <p className="text-gray-600 dark:text-gray-200 text-sm truncate">user@example.com</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Member since March 2024
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white dark:bg-white/10 backdrop-blur-lg border border-black/5 dark:border-white/20 hover:border-black/10 dark:hover:border-white/30 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold dark:text-white">Monthly Progress</h2>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-white/20 text-gray-600 dark:text-gray-200">
                    0 / 2 sessions
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-200">
                      <div className="p-2 rounded-full bg-gray-100 dark:bg-white/20">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold dark:text-white">1 day</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Current Streak</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-200">
                      <div className="p-2 rounded-full bg-gray-100 dark:bg-white/20">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold dark:text-white">2h</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Time</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Time and Calendar Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-white dark:bg-white/10 backdrop-blur-lg border border-black/5 dark:border-white/20 hover:border-black/10 dark:hover:border-white/30 transition-colors md:col-span-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold dark:text-white">Time</h2>
                <Clock className="h-4 w-4 text-gray-500" />
              </div>
              <p className="text-5xl font-bold dark:text-white tracking-tight">
                {formatTime(currentTime)}
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {currentTime?.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </Card>

            <Card className="p-4 bg-white dark:bg-white/10 backdrop-blur-lg border border-black/5 dark:border-white/20 hover:border-black/10 dark:hover:border-white/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold dark:text-white">Calendar</h2>
                <Calendar className="h-4 w-4 text-gray-500" />
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 31 }, (_, i) => (
                  <div
                    key={i}
                    className={`text-[10px] p-0.5 rounded-full ${
                      i + 1 === currentTime?.getDate()
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Weather and Moon Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weatherData && (
              <Card className="p-4 bg-white dark:bg-white/10 backdrop-blur-lg border border-black/5 dark:border-white/20 hover:border-black/10 dark:hover:border-white/30 transition-colors">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold dark:text-white mb-1">Current Weather</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{weatherData.current.condition.text}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold dark:text-white">{weatherData.current.temp_c}°C</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Droplets className="h-3.5 w-3.5" />
                        <span>{weatherData.current.humidity}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg bg-gray-100 dark:bg-white/20">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4 text-gray-600 dark:text-gray-200" />
                        <span className="text-sm text-gray-600 dark:text-gray-200">UV Index</span>
                      </div>
                      <p className="text-lg font-semibold mt-1 dark:text-white">{weatherData.current.uv}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-100 dark:bg-white/20">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-gray-600 dark:text-gray-200" />
                        <span className="text-sm text-gray-600 dark:text-gray-200">Pressure</span>
                      </div>
                      <p className="text-lg font-semibold mt-1 dark:text-white">{weatherData.current.pressure_mb} mb</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-100 dark:bg-white/20">
                      <div className="flex items-center gap-2">
                        <Wind className="h-4 w-4 text-gray-600 dark:text-gray-200" />
                        <span className="text-sm text-gray-600 dark:text-gray-200">Wind</span>
                      </div>
                      <p className="text-lg font-semibold mt-1 dark:text-white">{weatherData.current.wind_kph} km/h</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-4 bg-white dark:bg-white/10 backdrop-blur-lg border border-black/5 dark:border-white/20 hover:border-black/10 dark:hover:border-white/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold dark:text-white">Moon Phase</h2>
                <Moon className="h-4 w-4 text-gray-500" />
              </div>
              {moon && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/20 flex items-center justify-center">
                      <Moon className="w-10 h-10 text-gray-600 dark:text-gray-200" />
                    </div>
                    <div>
                      <p className="text-base font-semibold dark:text-white">{moon.moon_phase}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{moon.moon_illumination}% illuminated</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-gray-100 dark:bg-white/20">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Moonrise</p>
                      <p className="text-sm font-semibold dark:text-white">{moon.moonrise}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-100 dark:bg-white/20">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Moonset</p>
                      <p className="text-sm font-semibold dark:text-white">{moon.moonset}</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Location Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {weatherData && (
              <Card className="p-4 bg-white dark:bg-white/10 backdrop-blur-lg border border-black/5 dark:border-white/20 hover:border-black/10 dark:hover:border-white/30 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold dark:text-white">Location</h2>
                  <MapPin className="h-4 w-4 text-gray-500" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-gray-100 dark:bg-white/20">
                      <MapPin className="h-4 w-4 text-gray-600 dark:text-gray-200" />
                    </div>
                    <div>
                      <p className="text-sm font-medium dark:text-white">{weatherData.location.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{weatherData.location.country}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-200">
                        <Mountain className="h-3.5 w-3.5" />
                        <span className="text-xs">Elevation</span>
                      </div>
                      <p className="text-sm font-medium dark:text-white">1,234 m</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-200">
                        <Waves className="h-3.5 w-3.5" />
                        <span className="text-xs">Sea Level</span>
                      </div>
                      <p className="text-sm font-medium dark:text-white">+45 m</p>
                    </div>
                  </div>
                  <div className="pt-2 text-xs text-gray-500 dark:text-gray-400">
                    {weatherData.location.lat.toFixed(4)}°N, {weatherData.location.lon.toFixed(4)}°E
                  </div>
                </div>
              </Card>
            )}

            {/* Notebook and Word of the Day */}
            <Card className="p-4 bg-white dark:bg-white/10 backdrop-blur-lg border border-black/5 dark:border-white/20 md:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold dark:text-white">Notebook</h2>
                <ClipboardList className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex flex-col items-center justify-center h-[calc(100%-2rem)] text-center space-y-3">
                <ClipboardList className="h-10 w-10 text-gray-400" />
                <div>
                  <p className="font-semibold text-sm dark:text-white">Your Digital Notes</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Capture thoughts and insights</p>
                </div>
                <button className="text-blue-500 hover:text-blue-600 font-medium text-sm">
                  Open Notebook →
                </button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

