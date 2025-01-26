'use client'

import { useState } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { Card } from '@/components/ui/card'
import { Play, Clock, MoreVertical, Circle, Satellite, RotateCw } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import DotNavigation from '@/components/DotNavigation'

interface Session {
  title: string
  date: Date
  timeRemaining: number
  progress: number
}

interface ClockData {
  title: string
  description: string
  startDate: string
  timeElapsed: string
  focusNodes: number
  satellites: number
  totalRotations: number
}

export default function SessionsPage() {
  const { isDarkMode } = useTheme()
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)

  // Mock recent sessions data
  const recentSessions: Session[] = [
    {
      title: "Galileo's First Observation",
      date: new Date('2025-01-20T10:36:00'),
      timeRemaining: 3600,
      progress: 0
    },
    {
      title: "Galileo's First Observation",
      date: new Date('2025-01-20T10:35:00'),
      timeRemaining: 3528,
      progress: 2
    }
  ]

  // Clock data from the screenshot
  const clockData: ClockData[] = [
    {
      title: "Galileo's First Observation",
      description: "First telescopic observations of the celestial bodies, marking the beginning of modern astronomy.",
      startDate: "Started December 21, 1610",
      timeElapsed: "414y 132d 18h",
      focusNodes: 8,
      satellites: 0,
      totalRotations: 329984
    },
    {
      title: "Neptune's Discovery",
      description: "Mathematical prediction and subsequent discovery of Neptune, showcasing the power of scientific theory.",
      startDate: "Started September 23, 1846",
      timeElapsed: "178y 164d 15h",
      focusNodes: 5,
      satellites: 0,
      totalRotations: 97701
    },
    {
      title: "Mars' Deimos",
      description: "Discovery of Mars' smaller moon, expanding our understanding of the solar system.",
      startDate: "Started August 17, 1877",
      timeElapsed: "147y 193d 9h",
      focusNodes: 10,
      satellites: 0,
      totalRotations: 52749
    },
    {
      title: "Clock 4",
      description: "A unique meditation experience focused on rhythmic patterns and celestial movements.",
      startDate: "Available Now",
      timeElapsed: "-",
      focusNodes: 6,
      satellites: 0,
      totalRotations: 0
    },
    {
      title: "Clock 5",
      description: "Explore the harmony of geometric patterns in this meditative journey.",
      startDate: "Available Now",
      timeElapsed: "-",
      focusNodes: 7,
      satellites: 0,
      totalRotations: 0
    },
    {
      title: "Clock 6",
      description: "A contemplative experience inspired by astronomical phenomena.",
      startDate: "Available Now",
      timeElapsed: "-",
      focusNodes: 8,
      satellites: 0,
      totalRotations: 0
    },
    {
      title: "Clock 7",
      description: "Discover inner peace through the lens of cosmic time.",
      startDate: "Available Now",
      timeElapsed: "-",
      focusNodes: 9,
      satellites: 0,
      totalRotations: 0
    },
    {
      title: "Clock 8",
      description: "A journey through space and consciousness.",
      startDate: "Available Now",
      timeElapsed: "-",
      focusNodes: 8,
      satellites: 0,
      totalRotations: 0
    },
    {
      title: "Clock 9",
      description: "Experience tranquility through celestial movements.",
      startDate: "Available Now",
      timeElapsed: "-",
      focusNodes: 7,
      satellites: 0,
      totalRotations: 0
    }
  ]

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds)}s remaining`
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: undefined,
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95">
      {showElements && (
        <DotNavigation
          activeDot={0}
          isSmallMultiView={false}
        />
      )}
      <Menu
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
        showSatellites={showSatellites}
        onSatellitesChange={setShowSatellites}
      />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Recent Sessions Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 dark:text-white">Recent Sessions</h2>
          <div className="space-y-4">
            {recentSessions.map((session, index) => (
              <Card 
                key={index}
                className="p-4 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <Play className="h-5 w-5 text-red-500 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{session.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(session.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatTime(session.timeRemaining)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{session.progress}% Complete</p>
                    </div>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                      <MoreVertical className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Create Session Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 dark:text-white">Create Session</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clockData.map((clock, i) => (
              <Card 
                key={i}
                className="p-4 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all"
              >
                <div className="aspect-square relative mb-4">
                  <Image
                    src={`/${i + 1}_small.svg`}
                    alt={`Clock ${i + 1}`}
                    fill
                    className="object-contain p-4"
                  />
                  {/* Focus Nodes */}
                  {Array.from({ length: clock.focusNodes }).map((_, index) => {
                    const angle = (index * 360) / clock.focusNodes
                    const radius = 45 // percentage from center
                    const x = 50 + radius * Math.cos((angle - 90) * (Math.PI / 180))
                    const y = 50 + radius * Math.sin((angle - 90) * (Math.PI / 180))
                    return (
                      <div
                        key={index}
                        className="absolute w-2 h-2 rounded-full bg-red-500 dark:bg-red-400"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      />
                    )
                  })}
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {clock.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {clock.description}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-2">
                      <p className="text-gray-500 dark:text-gray-400">{clock.startDate}</p>
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span>{clock.timeElapsed}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Circle className="h-4 w-4" />
                        <span>{clock.focusNodes} Focus Nodes</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Satellite className="h-4 w-4" />
                        <span>{clock.satellites} Satellites</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <RotateCw className="h-4 w-4" />
                      <span>{clock.totalRotations.toLocaleString()} Rotations</span>
                    </div>
                    <Link
                      href={`/clock/${i + 1}`}
                      className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                    >
                      Start Session
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
} 