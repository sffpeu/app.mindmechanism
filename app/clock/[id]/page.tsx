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
import { Settings, Maximize2, Minimize2, Satellite, Info, X, List, ChevronLeft, ChevronRight } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import Timer from '@/components/Timer'
import { pauseSession, updateSessionActivity, updateSession } from '@/lib/sessions'
import { motion } from 'framer-motion'

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
// Updated color mapping for deployment trigger
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

// Clock titles mapping
const clockTitles = [
  "Galileo's First Observation",
  "Neptune's Discovery",
  "Galileo's Spring Observation",
  "Jupiter's Moons",
  "Uranus Discovery",
  "Saturn's Rings",
  "Ancient Star Charts",
  "Winter Solstice Study",
  "Medieval Observations"
]

// Clock descriptions
const clockDescriptions = [
  "Galileo's groundbreaking first observation of celestial bodies, marking the beginning of modern astronomy.",
  "The historic discovery of Neptune, predicted through mathematical calculations before visual confirmation.",
  "Detailed spring observations by Galileo, revealing new insights about planetary movements.",
  "The first documented observation of Jupiter's moons, changing our understanding of the solar system.",
  "William Herschel's unexpected discovery of Uranus, expanding the known boundaries of our solar system.",
  "The first detailed study of Saturn's rings, revealing their complex structure and composition.",
  "Ancient star charts from early astronomers, mapping the night sky with remarkable accuracy.",
  "Studies of the winter solstice, tracking the sun's annual journey across the sky.",
  "Medieval astronomical observations that bridged ancient and modern understanding of the cosmos."
]

export default function ClockPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = parseInt(params.id as string)
  const encodedWords = searchParams.get('words')
  const words = encodedWords ? JSON.parse(decodeURIComponent(encodedWords)) : []
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(() => {
    // Initialize from localStorage if available, otherwise default to false
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showSatellites')
      return saved ? JSON.parse(saved) : false
    }
    return false
  })
  const [showWords, setShowWords] = useState(() => {
    // Initialize from localStorage if available, otherwise default to true
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showWords')
      return saved ? JSON.parse(saved) : true
    }
    return true
  })
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
  const [showWordList, setShowWordList] = useState(true);
  const [isWordListVisible, setIsWordListVisible] = useState(true);
  const [areInfoCardsVisible, setAreInfoCardsVisible] = useState(true);
  const [clockInfo, setClockInfo] = useState({
    rotation: 0,
    rotationsCompleted: 0,
    elapsedTime: '0y 0d 0h 0m 0s'
  });
  const [wordDefinitions, setWordDefinitions] = useState<Record<string, string>>({})

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
            if (sessionIdParam) {
              // Update session as completed when timer ends
              updateSession(sessionIdParam, {
                status: 'completed',
                actual_duration: durationMs,
                progress: 100,
                end_time: new Date().toISOString()
              });
            }
            return 0;
          }
          // Calculate and update progress
          if (sessionIdParam) {
            const progress = ((durationMs - (prev - 1000)) / durationMs) * 100;
            updateSession(sessionIdParam, {
              status: 'in_progress',
              actual_duration: durationMs - prev,
              progress: Math.round(progress),
              last_active_time: new Date().toISOString()
            });
          }
          return prev - 1000;
        });
      }, 1000);
      return () => {
        clearInterval(timer);
        // Update session when leaving the page
        if (sessionIdParam && remainingTime && remainingTime > 0) {
          const progress = ((durationMs - remainingTime) / durationMs) * 100;
          updateSession(sessionIdParam, {
            status: 'in_progress',
            actual_duration: durationMs - remainingTime,
            progress: Math.round(progress),
            last_active_time: new Date().toISOString()
          });
        }
      };
    }
    if (sessionIdParam) {
      setSessionId(sessionIdParam);
    }
  }, [searchParams]);

  // Add cleanup effect when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionId && remainingTime && remainingTime > 0) {
        const duration = searchParams.get('duration');
        if (duration) {
          const durationMs = parseInt(duration);
          const progress = ((durationMs - remainingTime) / durationMs) * 100;
          updateSession(sessionId, {
            status: 'in_progress',
            actual_duration: durationMs - remainingTime,
            progress: Math.round(progress),
            last_active_time: new Date().toISOString()
          });
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionId, remainingTime, searchParams]);

  // Add effect to persist satellite state
  useEffect(() => {
    localStorage.setItem('showSatellites', JSON.stringify(showSatellites))
  }, [showSatellites])

  // Update the satellite toggle handler
  const handleSatellitesChange = (value: boolean) => {
    setShowSatellites(value)
    localStorage.setItem('showSatellites', JSON.stringify(value))
  }

  // Add effect to persist words visibility state
  useEffect(() => {
    localStorage.setItem('showWords', JSON.stringify(showWords))
  }, [showWords])

  // Update the words toggle handler
  const handleWordsChange = (value: boolean) => {
    setShowWords(value)
    localStorage.setItem('showWords', JSON.stringify(value))
  }

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

  // Add this effect to fetch word definitions when words change
  useEffect(() => {
    const fetchWordDefinitions = async () => {
      const newDefinitions: Record<string, string> = {};
      for (const word of words) {
        if (word) {
          try {
            // Fetch exact word match
            const response = await fetch(`/api/words?search=${encodeURIComponent(word.toLowerCase())}`);
            const data = await response.json();
            if (data.success && data.words && data.words.length > 0) {
              // Find exact match (case-insensitive)
              const matchingWord = data.words.find((w: any) => 
                w.word.toLowerCase() === word.toLowerCase()
              );
              if (matchingWord) {
                newDefinitions[word] = matchingWord.definition;
              }
            }
          } catch (error) {
            console.error('Error fetching word definition:', error);
          }
        }
      }
      setWordDefinitions(newDefinitions);
    };

    if (words.length > 0) {
      fetchWordDefinitions();
    }
  }, [words]);

  const WordList = () => {
    if (!words.length || !showWordList) return null;

    return (
      <div 
        className={`fixed left-0 top-16 z-50 transition-all duration-300 ease-in-out transform ${
          isWordListVisible ? 'translate-x-0' : '-translate-x-[calc(100%-24px)]'
        }`}
      >
        <div className="bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-black/10 dark:border-white/10 rounded-lg p-3 w-48 relative">
          <button
            onClick={() => setIsWordListVisible(!isWordListVisible)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-black/5 dark:border-white/10 hover:bg-white/90 dark:hover:bg-black/90 transition-colors"
            aria-label={isWordListVisible ? "Minimize word list" : "Expand word list"}
          >
            {isWordListVisible ? (
              <ChevronLeft className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            )}
          </button>

          <div className="flex items-center mb-2">
            <h3 className="text-xs font-medium text-black/90 dark:text-white/90">Focus Words</h3>
          </div>
          <div className="space-y-1.5">
            {words.map((word: string, index: number) => (
              <div
                key={index}
                className="group relative flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-help"
              >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-medium ${clockColors[id].split(' ')[1]} text-white`}>
                  {index + 1}
                </div>
                <span className="text-xs font-medium text-black/90 dark:text-white/90">{word}</span>
                {wordDefinitions[word] && (
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-64 p-2.5 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">{wordDefinitions[word]}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Don't render clock until we have client-side time
  if (!currentTime) {
    return null
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-black/95">
        <div className="relative z-[999]">
          {/* Dot Navigation - Made smaller and repositioned */}
          {showElements && (
            <div className="fixed top-1/2 -translate-y-1/2 right-4">
              <DotNavigation
                activeDot={id}
                isSmallMultiView={isSmallMultiView}
                onOutlinedDotClick={() => setIsSmallMultiView(!isSmallMultiView)}
              />
            </div>
          )}

          {/* Menu */}
          <Menu
            showElements={showElements}
            onToggleShow={() => setShowElements(!showElements)}
            showSatellites={showSatellites}
            onSatellitesChange={handleSatellitesChange}
            showInfoCards={showInfoCards}
            onInfoCardsChange={setShowInfoCards}
          />
        </div>

        {/* Clock - Centered in viewport */}
        <div className="fixed inset-0 flex items-center justify-center relative z-0">
          <Clock
            {...localClockSettings}
            id={id}
            showElements={showElements}
            onToggleShow={() => setShowElements(!showElements)}
            currentTime={currentTime}
            syncTrigger={syncTrigger}
            hideControls={false}
            showSatellites={showSatellites}
            showWords={showWords}
            showInfo={showInfoCards && !isFullscreen}
            isMultiView={false}
            isMultiView2={false}
            allClocks={clockSettings}
            customWords={words}
            wordDefinitions={wordDefinitions}
            onInfoUpdate={setClockInfo}
          />
        </div>

        {/* Timer Component - Moved to bottom left */}
        <div className="fixed bottom-4 left-4 z-50">
          <Timer
            remainingTime={remainingTime}
            isPaused={isPaused}
            onPauseResume={handlePauseResume}
          />
        </div>
        
        {/* Info Cards with minimize/expand functionality */}
        {showInfoCards && (
          <div className={`fixed bottom-20 left-0 z-50 transition-all duration-300 ease-in-out transform ${
            areInfoCardsVisible ? 'translate-x-0' : '-translate-x-[calc(100%-24px)]'
          }`}>
            <div className="bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-black/10 dark:border-white/10 rounded-lg p-4 w-64 relative">
              {/* Minimize/Expand button */}
              <button
                onClick={() => setAreInfoCardsVisible(!areInfoCardsVisible)}
                className="absolute -right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-black/5 dark:border-white/10 hover:bg-white/90 dark:hover:bg-black/90 transition-colors"
                aria-label={areInfoCardsVisible ? "Minimize info cards" : "Expand info cards"}
              >
                {areInfoCardsVisible ? (
                  <ChevronLeft className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                )}
              </button>

              <div className="space-y-3">
                {/* Clock Title and Description */}
                <div className="space-y-2 pb-3 border-b border-black/10 dark:border-white/10">
                  <h3 className={`text-sm font-medium ${clockColors[id].split(' ')[0]}`}>
                    {clockTitles[id]}
                  </h3>
                  <p className="text-xs text-black/60 dark:text-white/60 line-clamp-2">
                    {clockDescriptions[id]}
                  </p>
                </div>

                {/* Clock Information */}
                <div className="space-y-2 pb-3 border-b border-black/10 dark:border-white/10">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs font-medium text-black/60 dark:text-white/60">Current</p>
                      <p className="text-sm font-medium text-black/90 dark:text-white/90">
                        {currentTime.toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-black/60 dark:text-white/60">Started</p>
                      <p className="text-sm font-medium text-black/90 dark:text-white/90">
                        {localClockSettings.startDateTime.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs font-medium text-black/60 dark:text-white/60">Rotation</p>
                      <motion.p 
                        className="text-sm font-medium text-black/90 dark:text-white/90"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.span
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          key={clockInfo.rotation}
                          transition={{ type: "spring", damping: 10, stiffness: 100 }}
                        >
                          {clockInfo.rotation.toFixed(3)}°
                        </motion.span>
                      </motion.p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-black/60 dark:text-white/60">R. Complete</p>
                      <motion.p 
                        className="text-sm font-medium text-black/90 dark:text-white/90"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.span
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          key={clockInfo.rotationsCompleted}
                          transition={{ type: "spring", damping: 10, stiffness: 100 }}
                        >
                          {clockInfo.rotationsCompleted}
                        </motion.span>
                      </motion.p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-black/60 dark:text-white/60">Elapsed</p>
                    <p className="text-sm font-medium text-black/90 dark:text-white/90 font-mono">
                      {clockInfo.elapsedTime}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs font-medium text-black/60 dark:text-white/60">Start °</p>
                      <p className="text-sm font-medium text-black/90 dark:text-white/90">
                        {localClockSettings.startingDegree.toFixed(1)}°
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-black/60 dark:text-white/60">Rot. Time</p>
                      <p className="text-sm font-medium text-black/90 dark:text-white/90">
                        {localClockSettings.rotationTime / 1000}s
                      </p>
                    </div>
                  </div>
                </div>

                {/* Weather and Moon Information */}
                <div className="space-y-2">
                  {weatherData && (
                    <div>
                      <p className="text-xs font-medium text-black/60 dark:text-white/60">Weather</p>
                      <motion.p 
                        className="text-sm font-medium text-black/90 dark:text-white/90"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.span
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          key={weatherData.current.temp_c}
                          transition={{ type: "spring", damping: 10, stiffness: 100 }}
                        >
                          {weatherData.current.temp_c}°C · {weatherData.current.condition.text}
                        </motion.span>
                      </motion.p>
                    </div>
                  )}
                  {moon && (
                    <div>
                      <p className="text-xs font-medium text-black/60 dark:text-white/60">Moon Phase</p>
                      <p className="text-sm font-medium text-black/90 dark:text-white/90">
                        {moon.moon_phase}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
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
                  onCheckedChange={handleSatellitesChange}
                />
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center justify-between" onSelect={(e) => e.preventDefault()}>
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  <span>Focus Words</span>
                </div>
                <Switch
                  checked={showWords}
                  onCheckedChange={handleWordsChange}
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

        {showSettings && (
          <ClockSettings
            settings={localClockSettings}
            onSave={handleSettingsSave}
            onCancel={() => setShowSettings(false)}
          />
        )}
        <WordList />
      </div>
    </ProtectedRoute>
  )
} 