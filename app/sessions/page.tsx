'use client'

import { useState, useEffect } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { Play, Clock, Calendar, RotateCw, Timer, Compass, LayoutGrid, List, ChevronUp, ChevronDown, Eye } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import DotNavigation from '@/components/DotNavigation'
import { clockSettings } from '@/lib/clockSettings'
import { SatelliteSettings } from '@/types/ClockSettings'
import { SessionDurationDialog } from '@/components/SessionDurationDialog'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { getUserSessions } from '@/lib/sessions'

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

export default function SessionsPage() {
  const { theme } = useTheme()
  const [showSatellites, setShowSatellites] = useState(false)
  const [isListView, setIsListView] = useState(false)
  const [showRecentSessions, setShowRecentSessions] = useState(true)
  const [recentSessions, setRecentSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    const fetchSessions = async () => {
      if (user) {
        try {
          const sessions = await getUserSessions(user.uid)
          setRecentSessions(sessions)
        } catch (error) {
          console.error('Error fetching sessions:', error)
        }
      }
      setIsLoading(false)
    }

    fetchSessions()
  }, [user])

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
    // Implementation of handleStartSession
  }

  const handleDurationSelected = (duration: number | null, words: string[]) => {
    // Implementation of handleDurationSelected
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95">
      {/* Rest of the component code... */}
    </div>
  )
} 