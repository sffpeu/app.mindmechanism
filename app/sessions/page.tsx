'use client'

import { useState, useEffect } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { Play, Clock, Calendar, RotateCw, Timer, Compass, LayoutGrid, List, ChevronUp, ChevronDown, Eye, Grid } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import DotNavigation from '@/components/DotNavigation'
import { clockSettings } from '@/lib/clockSettings'
import { SatelliteSettings } from '@/types/ClockSettings'
import { SessionDurationDialog } from '@/components/SessionDurationDialog'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createSession } from '@/lib/sessions'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { useTimeTracking } from '@/lib/hooks/useTimeTracking'
import { RecentSessions } from '@/components/RecentSessions'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// Update satellites count for each clock
const clockSatellites: Record<number, number> = {
  0: 8, // Clock 1
  1: 2, // Clock 2
  2: 2, // Clock 3
  3: 0, // Clock 4
  4: 5, // Clock 5
  5: 0, // Clock 6
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

// Function to get the clock image path
const getImagePath = (index: number) => {
  return `/clock_${index + 1}.svg`;
};

export default function SessionsPage() {
  const { isDarkMode } = useTheme()
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const [showRecentSessions, setShowRecentSessions] = useState(true)
  const [isListView, setIsListView] = useState(false)
  const [isCreateListView, setIsCreateListView] = useState(false)
  const [selectedClockId, setSelectedClockId] = useState<number | null>(null)
  const [selectedClockColor, setSelectedClockColor] = useState<string>('')
  const [isDurationDialogOpen, setIsDurationDialogOpen] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  
  // Add time tracking
  useTimeTracking(user?.uid, 'sessions')

  // Function to calculate elapsed time
  const getElapsedTime = (startDate: Date): string => {
    const now = new Date()
    const elapsed = now.getTime() - startDate.getTime()
    const years = Math.floor(elapsed / (365 * 24 * 60 * 60 * 1000))
    const days = Math.floor((elapsed % (365 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000))
    const hours = Math.floor((elapsed % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    return `${years}y ${days}d ${hours}h`
  }

  // Function to format start date
  const formatStartDate = (date: Date): string => {
    return `Started ${date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })}`
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

  // Map clockSettings to clockData
  const clockData: ClockData[] = clockSettings.map((clock, index) => ({
    ...clock,
    title: clockTitles[index],
    startDate: formatStartDate(clock.startDateTime),
    timeElapsed: getElapsedTime(clock.startDateTime),
    focusNodes: clock.focusNodes,
    satellites: Array.from({ length: clockSatellites[index] || 0 }).map((_, i) => ({
      id: i,
      rotationTime: 60000, // default 60 seconds
      rotationDirection: 'clockwise' as const
    })),
    totalRotations: Math.floor((Date.now() - clock.startDateTime.getTime()) / clock.rotationTime),
    color: clockColors[index],
    description: clockDescriptions[index]
  }))

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

        // Navigate to the clock page with the session ID
        const encodedWords = encodeURIComponent(JSON.stringify(words));
        router.push(`/clock/${selectedClockId}?duration=${durationMs}&words=${encodedWords}&sessionId=${session.id}`);
      } catch (error) {
        console.error('Error creating session:', error);
        // Still navigate to clock page even if session creation fails
        const durationMs = duration * 60 * 1000;
        const encodedWords = encodeURIComponent(JSON.stringify(words));
        router.push(`/clock/${selectedClockId}?duration=${durationMs}&words=${encodedWords}`);
      }
    }
    setIsDurationDialogOpen(false);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-black/95">
        {showElements && (
          <div className="fixed right-8 top-8 z-50">
            <DotNavigation
              activeDot={9}
              isSmallMultiView={false}
            />
          </div>
        )}
        <Menu
          showElements={showElements}
          onToggleShow={() => setShowElements(!showElements)}
          showSatellites={showSatellites}
          onSatellitesChange={setShowSatellites}
        />
        
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="space-y-8">
            {/* Recent Sessions Section */}
            <div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-medium text-gray-900 dark:text-white">Recent Sessions</h2>
                  <button 
                    onClick={() => setShowRecentSessions(!showRecentSessions)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                  >
                    <Eye className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {showRecentSessions ? 'Hide' : 'Show'}
                    </span>
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-lg">
                  View your meditation journey through past sessions and track your progress.
                </p>
              </div>
              {showRecentSessions && <RecentSessions />}
            </div>

            {/* Create New Session Section */}
            <div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-medium text-gray-900 dark:text-white">Create New Session</h2>
                  <button 
                    onClick={() => setIsCreateListView(!isCreateListView)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                  >
                    {isCreateListView ? (
                      <Grid className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    ) : (
                      <List className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-lg">
                  Choose a clock to start your meditation session.
                </p>
              </div>

              <div className={isCreateListView ? "space-y-2" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"}>
                {clockData.map((clock, index) => (
                  <div
                    key={index}
                    className={`p-3.5 rounded-xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all cursor-pointer ${
                      isCreateListView ? 'flex items-center justify-between' : ''
                    }`}
                    onClick={() => handleStartSession(index, clock.color)}
                  >
                    <div className={isCreateListView ? 'flex items-center gap-4 flex-1' : ''}>
                      <div className="relative aspect-square w-full max-w-[120px] mx-auto mb-3">
                        <Image
                          src={getImagePath(index)}
                          alt={clock.title}
                          width={120}
                          height={120}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className={`flex-1 min-w-0 ${isCreateListView ? '' : 'flex flex-col h-full'}`}>
                        <div>
                          <h3 className={`text-lg font-medium ${clock.color.split(' ')[0]}`}>
                            {clock.title}
                          </h3>
                          {isCreateListView && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {clock.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
                            <Calendar className="h-4 w-4" />
                            {clock.startDate}
                          </div>
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
                              <Timer className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                              Rot. Time
                            </span>
                            <span className="text-xs font-medium text-gray-900 dark:text-white block text-center">
                              {(clock.rotationTime / 1000).toFixed(0)}s
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartSession(index, clock.color);
                            }}
                            className={`flex-1 flex items-center justify-center px-6 py-4 rounded-lg text-center transition-all bg-white/50 dark:bg-white/5 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 hover:bg-white dark:hover:bg-white/10 ${
                              clock.color.includes('red') ? 'hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]' :
                              clock.color.includes('orange') ? 'hover:shadow-[0_0_15px_rgba(249,115,22,0.1)]' :
                              clock.color.includes('yellow') ? 'hover:shadow-[0_0_15px_rgba(234,179,8,0.1)]' :
                              clock.color.includes('green') ? 'hover:shadow-[0_0_15px_rgba(34,197,94,0.1)]' :
                              clock.color.includes('blue') ? 'hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]' :
                              clock.color.includes('pink') ? 'hover:shadow-[0_0_15px_rgba(236,72,153,0.1)]' :
                              clock.color.includes('purple') ? 'hover:shadow-[0_0_15px_rgba(147,51,234,0.1)]' :
                              clock.color.includes('indigo') ? 'hover:shadow-[0_0_15px_rgba(99,102,241,0.1)]' :
                              'hover:shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                            }`}
                          >
                            <span className={`text-base font-medium ${clock.color.split(' ')[0]}`}>
                              Start Session
                            </span>
                          </Button>
                          <Link
                            href={`/clock/${index + 1}`}
                            className={`h-[60px] w-[60px] flex items-center justify-center rounded-full transition-all bg-white/50 dark:bg-white/5 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 hover:bg-white dark:hover:bg-white/10 ${
                              clock.color.includes('red') ? 'hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]' :
                              clock.color.includes('orange') ? 'hover:shadow-[0_0_15px_rgba(249,115,22,0.1)]' :
                              clock.color.includes('yellow') ? 'hover:shadow-[0_0_15px_rgba(234,179,8,0.1)]' :
                              clock.color.includes('green') ? 'hover:shadow-[0_0_15px_rgba(34,197,94,0.1)]' :
                              clock.color.includes('blue') ? 'hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]' :
                              clock.color.includes('pink') ? 'hover:shadow-[0_0_15px_rgba(236,72,153,0.1)]' :
                              clock.color.includes('purple') ? 'hover:shadow-[0_0_15px_rgba(147,51,234,0.1)]' :
                              clock.color.includes('indigo') ? 'hover:shadow-[0_0_15px_rgba(99,102,241,0.1)]' :
                              'hover:shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                            }`}
                          >
                            <Eye className={`h-5 w-5 ${clock.color.split(' ')[0]}`} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
