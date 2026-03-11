'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/app/ThemeContext'
import { Play, Clock, RotateCw, Timer, Compass, LayoutGrid, List, ChevronUp, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import DotNavigation from '@/components/DotNavigation'
import { clockSettings } from '@/lib/clockSettings'
import { SatelliteSettings } from '@/types/ClockSettings'
import { SessionDurationDialog } from '@/components/SessionDurationDialog'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createSession } from '@/lib/sessions'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { useTimeTracking } from '@/lib/hooks/useTimeTracking'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useSoundEffects } from '@/lib/sounds'
import { clockTitles } from '@/lib/clockTitles'

// Update satellites count for each clock
const clockSatellites: Record<number, number> = {
  0: 8, // Clock 1
  1: 2, // Clock 2
  2: 2, // Clock 3
  3: 1, // Clock 4 (added 1 satellite)
  4: 5, // Clock 5
  5: 1, // Clock 6 (added 1 satellite)
  6: 5, // Clock 7
  7: 5, // Clock 8
  8: 1, // Clock 9
}

interface Session {
  title: string
  date: Date
  timeRemaining: number
  progress: number
  clockId: number
}

interface ClockData extends Omit<typeof clockSettings[0], 'startDateTime'> {
  title: string
  startDate: string
  timeElapsed: string
  currentDegree: number
  focusNodes: number
  satellites: SatelliteSettings[]
  totalRotations: number
  color: string
  description?: string
}

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

// Clock 1–9 hex palette (match Clock.tsx, glossary, SessionDurationDialog)
const CLOCK_HEX = ['#fd290a', '#fba63b', '#f7da5f', '#6dc037', '#156fde', '#941952', '#541b96', '#ee5fa7', '#56c1ff']

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 0xff
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  return `rgba(${r},${g},${b},${alpha})`
}

// Tailwind arbitrary classes from hex for text/bg (SessionDurationDialog compatible)
const clockColors = CLOCK_HEX.map((hex) => `text-[${hex}] bg-[${hex}]`)

export default function SessionsPage() {
  const { isDarkMode } = useTheme()
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const [isListView, setIsListView] = useState(false)
  const [isCreateListView, setIsCreateListView] = useState(false)
  const [selectedClockId, setSelectedClockId] = useState<number | null>(null)
  const [selectedClockColor, setSelectedClockColor] = useState<string>('')
  const [isDurationDialogOpen, setIsDurationDialogOpen] = useState(false)
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode')
  const isClockMode = mode === 'clock'
  const { user } = useAuth()
  const { theme } = useTheme()
  const { playStart, playClick } = useSoundEffects()
  useTimeTracking(user?.uid, 'sessions')  // Start time tracking for sessions page

  // Function to calculate elapsed time
  const getElapsedTime = (startDate: Date): string => {
    const now = new Date()
    const elapsed = now.getTime() - startDate.getTime()
    const years = Math.floor(elapsed / (365 * 24 * 60 * 60 * 1000))
    const days = Math.floor((elapsed % (365 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000))
    const hours = Math.floor((elapsed % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    return `${years}y ${days}d ${hours}h`
  }

  // Date as DD.MM.YYYY for session cards
  const formatClockDate = (date: Date): string => {
    const d = date.getDate().toString().padStart(2, '0')
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    const y = date.getFullYear()
    return `${d}.${m}.${y}`
  }

  // Map clockSettings to clockData
  const clockData: ClockData[] = clockSettings.map((clock, index) => {
    const elapsedMs = Date.now() - clock.startDateTime.getTime()
    const rotationFraction = (elapsedMs / clock.rotationTime) % 1
    const currentDegree = clock.rotationDirection === 'clockwise'
      ? (clock.startingDegree + rotationFraction * 360) % 360
      : (clock.startingDegree - rotationFraction * 360 + 360) % 360
    return {
      ...clock,
      title: clockTitles[index],
      startDate: formatClockDate(clock.startDateTime),
      timeElapsed: getElapsedTime(clock.startDateTime),
      currentDegree,
      focusNodes: clock.focusNodes,
      satellites: Array.from({ length: clockSatellites[index] || 0 }).map((_, i) => ({
        id: i,
        rotationTime: 60000, // default 60 seconds
        rotationDirection: 'clockwise' as const
      })),
      totalRotations: Math.floor(elapsedMs / clock.rotationTime),
      color: clockColors[index],
      description: clockDescriptions[index]
    }
  })

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds)}s remaining`
  }

  const formatDate = (date: Date) => {
    return `${date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })} · ${date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })}`
  }

  const handleStartSession = (clockId: number, clockColor: string) => {
    setSelectedClockId(clockId)
    setSelectedClockColor(clockColor)
    setIsDurationDialogOpen(true)
    playClick()
  }

  const handleDurationSelected = async (duration: number | null, words: string[]) => {
    if (selectedClockId !== null && duration !== null && user?.uid) {
      try {
        // Convert minutes to milliseconds
        const durationMs = duration * 60 * 1000;

        // Create a new session
        const session = await createSession({
          user_id: user.uid,
          clock_id: selectedClockId,
          duration: durationMs,
          words: words,
          moon_phase: '',
          moon_illumination: 0,
          moon_rise: '',
          moon_set: '',
          weather_condition: '',
          temperature: 0,
          humidity: 0,
          uv_index: 0,
          pressure: 0,
          wind_speed: 0,
          city: '',
          country: '',
          elevation: 0,
          sea_level: 0,
          latitude: 0,
          longitude: 0,
          progress: 0 // Initialize progress at 0
        });

        // Navigate to the new page structure with the session ID
        const encodedWords = encodeURIComponent(JSON.stringify(words));
        router.push(`/${selectedClockId}?duration=${durationMs}&words=${encodedWords}&sessionId=${session.id}`);
      } catch (error) {
        console.error('Error creating session:', error);
        // Still navigate to the page even if session creation fails
        const durationMs = duration * 60 * 1000;
        const encodedWords = encodeURIComponent(JSON.stringify(words));
        router.push(`/${selectedClockId}?duration=${durationMs}&words=${encodedWords}`);
      }
    }
    setIsDurationDialogOpen(false);
  };

  return (
    <ProtectedRoute>
      <div className="h-full overflow-hidden flex flex-col bg-gray-50 dark:bg-black/95">
        {showElements && (
          <div className="fixed right-8 top-8 z-50">
            <DotNavigation
              activeDot={9}
              isSmallMultiView={false}
            />
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="space-y-8">
            {/* Create Session Section */}
            {!isClockMode && (
              <div>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-medium text-gray-900 dark:text-white">Create Session</h2>
                    <button
                      onClick={() => setIsCreateListView(!isCreateListView)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all"
                    >
                      {isCreateListView ? (
                        <>
                          <LayoutGrid className="h-4 w-4 text-gray-600 dark:text-white" />
                          <span className="text-sm text-gray-600 dark:text-white">Grid</span>
                        </>
                      ) : (
                        <>
                          <List className="h-4 w-4 text-gray-600 dark:text-white" />
                          <span className="text-sm text-gray-600 dark:text-white">List</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-lg">
                    Choose from nine unique clock designs to begin your meditation practice.
                  </p>
                </div>
                <div className={isCreateListView ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-1"}>
                  {clockData.map((clock, i) => (
                    <div
                      key={i}
                      className={`p-6 rounded-xl bg-white dark:bg-black/40 backdrop-blur-lg border-0 transition-all group relative ${isCreateListView ? 'flex gap-8 items-start' : 'flex flex-col'}`}
                      style={{
                        boxShadow: hoveredCardIndex === i ? `0 0 15px ${hexToRgba(CLOCK_HEX[i], 0.3)}` : undefined,
                      }}
                      onMouseEnter={() => setHoveredCardIndex(i)}
                      onMouseLeave={() => setHoveredCardIndex(null)}
                    >
                      <div className={`aspect-square relative flex items-center justify-center ${isCreateListView ? 'w-28 shrink-0' : ''}`}>
                        <div className="w-[75%] h-[75%] relative rounded-full overflow-hidden">
                          <div
                            className="absolute inset-0"
                            style={{
                              transform: `rotate(${clock.imageOrientation}deg)`,
                            }}
                          >
                            <div
                              className="absolute inset-0"
                              style={{
                                transform: `translate(${clock.imageX || 0}%, ${clock.imageY || 0}%) scale(${clock.imageScale})`,
                                transformOrigin: 'center',
                              }}
                            >
                              <Image
                                src={clock.imageUrl}
                                alt={`Clock ${i + 1}`}
                                fill
                                className="object-cover rounded-full dark:invert [&_*]:fill-current [&_*]:stroke-none"
                                priority
                                loading="eager"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-[90%] h-[90%] rounded-full relative">
                            {Array.from({ length: clock.focusNodes }).map((_, index) => {
                              const angle = (index * 360) / clock.focusNodes
                              const radius = 48
                              const x = 50 + radius * Math.cos((angle - 90) * (Math.PI / 180))
                              const y = 50 + radius * Math.sin((angle - 90) * (Math.PI / 180))
                              return (
                                <div
                                  key={index}
                                  className={`absolute w-2 h-2 rounded-full ${clock.color.split(' ')[1]}`}
                                  style={{
                                    left: `${x}%`,
                                    top: `${y}%`,
                                    transform: 'translate(-50%, -50%)'
                                  }}
                                />
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      <div className={`flex-1 min-w-0 ${isCreateListView ? '' : 'flex flex-col h-full'}`}>
                        <div className="text-center">
                          <h3 className={`text-lg font-medium ${clock.color.split(' ')[0]}`}>
                            {clock.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {clock.startDate}
                          </p>
                          {isCreateListView && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {clock.description}
                            </p>
                          )}
                        </div>

                        <div className={`${isCreateListView ? "grid grid-cols-3 gap-4 mb-4" : "grid grid-cols-3 gap-1.5 my-4"}`}>
                          <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5">
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                              <Clock className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                              Elapsed
                            </span>
                            <span className="text-xs font-medium text-gray-900 dark:text-white block text-center">
                              {clock.timeElapsed}
                            </span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5">
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                              <RotateCw className={`h-3 w-3 text-gray-400 dark:text-gray-500 ${clock.rotationDirection === 'counterclockwise' ? 'transform -scale-x-100' : ''}`} />
                              Rotations
                            </span>
                            <span className="text-xs font-medium text-gray-900 dark:text-white block text-center">
                              {clock.totalRotations.toLocaleString()}
                            </span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5">
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                              <Compass className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                              Rotation
                            </span>
                            <span className="text-xs font-medium text-gray-900 dark:text-white block text-center">
                              {clock.currentDegree.toFixed(3)}°
                            </span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5">
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                              <div className={`w-1 h-1 rounded-full ${clock.color.split(' ')[1]}`} />
                              Focus Nodes
                            </span>
                            <span className="text-xs font-medium text-gray-900 dark:text-white block text-center">
                              {clock.focusNodes}
                            </span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5">
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                              <div className="w-1 h-1 rounded-full border border-gray-900 dark:border-white/40" />
                              Satellites
                            </span>
                            <span className="text-xs font-medium text-gray-900 dark:text-white block text-center">
                              {clock.satellites.length}
                            </span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5">
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                              <Compass className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                              Start °
                            </span>
                            <span className="text-xs font-medium text-gray-900 dark:text-white block text-center">
                              {clock.startingDegree}°
                            </span>
                          </div>
                        </div>

                        <div className={`flex gap-3 mt-auto items-center`}>
                          <Button
                            onClick={() => handleStartSession(clock.id, clock.color)}
                            className="flex-1 flex items-center justify-center px-6 py-4 rounded-lg text-center transition-all bg-white/50 dark:bg-white/5 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 hover:bg-white dark:hover:bg-white/10"
                            style={{
                              boxShadow: hoveredCardIndex === i ? `0 0 15px ${hexToRgba(CLOCK_HEX[i], 0.1)}` : undefined,
                            }}
                          >
                            <span className={`text-base font-medium ${clock.color.split(' ')[0]}`}>
                              Start Session
                            </span>
                          </Button>
                          <Link
                            href={`/${clock.id}`}
                            className="h-[45px] w-[45px] flex items-center justify-center rounded-full transition-all bg-white/50 dark:bg-white/5 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 hover:bg-white dark:hover:bg-white/10"
                            style={{
                              boxShadow: hoveredCardIndex === i ? `0 0 15px ${hexToRgba(CLOCK_HEX[i], 0.1)}` : undefined,
                            }}
                          >
                            <Play className={`h-4 w-4 ${clock.color.split(' ')[0]}`} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
        <SessionDurationDialog
          open={isDurationDialogOpen}
          onOpenChange={setIsDurationDialogOpen}
          clockId={selectedClockId ?? 0}
          clockColor={selectedClockColor}
          onNext={handleDurationSelected}
        />
      </div>
    </ProtectedRoute>
  )
} 
