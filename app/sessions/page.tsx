'use client'

import { useState } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { Play, Clock, MoreVertical, Calendar, Circle } from 'lucide-react'
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
  startDate: string
  timeElapsed: string
  focusNodes: number
  satellites: number
  totalRotations: number
  color: string
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

  // Clock data
  const clockData: ClockData[] = [
    {
      title: "Galileo's First Observation",
      startDate: "Started December 21, 1610",
      timeElapsed: "414y 132d 18h",
      focusNodes: 8,
      satellites: 0,
      totalRotations: 329984,
      color: "text-red-500 bg-red-500"
    },
    {
      title: "Neptune's Discovery",
      startDate: "Started September 23, 1846",
      timeElapsed: "178y 164d 15h",
      focusNodes: 5,
      satellites: 0,
      totalRotations: 97701,
      color: "text-orange-500 bg-orange-500"
    },
    {
      title: "Mars' Deimos",
      startDate: "Started August 17, 1877",
      timeElapsed: "147y 193d 9h",
      focusNodes: 10,
      satellites: 0,
      totalRotations: 52749,
      color: "text-yellow-500 bg-yellow-500"
    }
  ]

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

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Menu
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
        showSatellites={showSatellites}
        onSatellitesChange={setShowSatellites}
      />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Recent Sessions Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-medium mb-6 dark:text-white">Recent Sessions</h2>
          <div className="space-y-2">
            {recentSessions.map((session, index) => (
              <div 
                key={index}
                className={`py-3 px-4 ${index === 1 ? 'border border-red-100/20 dark:border-red-500/20 rounded-lg' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-base font-medium mb-1 ${index === 1 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                      {session.title}
                    </h3>
                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(session.date)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {formatTime(session.timeRemaining)}
                      </div>
                      <div>
                        {session.progress}% Complete
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 rounded-full hover:bg-gray-50 dark:hover:bg-white/5">
                      <Play className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-gray-50 dark:hover:bg-white/5">
                      <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Create Session Section */}
        <section>
          <h2 className="text-2xl font-medium mb-6 dark:text-white">Create Session</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {clockData.map((clock, i) => (
              <div key={i} className="space-y-6">
                <div className="aspect-square relative">
                  <Image
                    src={`/${i + 1}_small.svg`}
                    alt={`Clock ${i + 1}`}
                    fill
                    className="object-contain mix-blend-darken dark:mix-blend-lighten"
                  />
                  {Array.from({ length: clock.focusNodes }).map((_, index) => {
                    const angle = (index * 360) / clock.focusNodes
                    const radius = 45
                    const x = 50 + radius * Math.cos((angle - 90) * (Math.PI / 180))
                    const y = 50 + radius * Math.sin((angle - 90) * (Math.PI / 180))
                    return (
                      <div
                        key={index}
                        className={`absolute w-1.5 h-1.5 rounded-full ${clock.color.split(' ')[1]}`}
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      />
                    )
                  })}
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className={`text-lg font-medium ${clock.color.split(' ')[0]}`}>
                      {clock.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      {clock.startDate}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-500 dark:text-gray-400">Elapsed</span>
                        <span className="font-medium text-gray-900 dark:text-white">{clock.timeElapsed}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${clock.color.split(' ')[1]}`} />
                        <span className="font-medium text-gray-900 dark:text-white">{clock.focusNodes}</span>
                        <span className="text-gray-500 dark:text-gray-400">Focus Nodes</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full border border-gray-900 dark:border-white" />
                        <span className="font-medium text-gray-900 dark:text-white">{clock.satellites}</span>
                        <span className="text-gray-500 dark:text-gray-400">Satellites</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-500 dark:text-gray-400">Total Rotations</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {clock.totalRotations.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/clock/${i + 1}`}
                      className="flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg text-center transition-all border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Start Session
                      </span>
                    </Link>
                    <Link
                      href={`/clock/${i + 1}`}
                      className="flex items-center justify-center px-4 py-2.5 rounded-lg text-center transition-all border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        View
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
} 