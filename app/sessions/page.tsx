'use client'

import { useState } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { Card } from '@/components/ui/card'
import { Play, Clock, MoreVertical, Circle, Satellite, RotateCw, Calendar, LayoutGrid, List } from 'lucide-react'
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
  color: string
}

export default function SessionsPage() {
  const { isDarkMode } = useTheme()
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const [isListView, setIsListView] = useState(false)

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

  // Clock data from the screenshot with added colors
  const clockData: ClockData[] = [
    {
      title: "Galileo's First Observation",
      description: "First telescopic observations of the celestial bodies, marking the beginning of modern astronomy.",
      startDate: "Started December 21, 1610",
      timeElapsed: "414y 132d 18h",
      focusNodes: 8,
      satellites: 0,
      totalRotations: 329984,
      color: "text-red-500 dark:text-red-400"
    },
    {
      title: "Neptune's Discovery",
      description: "Mathematical prediction and subsequent discovery of Neptune, showcasing the power of scientific theory.",
      startDate: "Started September 23, 1846",
      timeElapsed: "178y 164d 15h",
      focusNodes: 5,
      satellites: 0,
      totalRotations: 97701,
      color: "text-orange-500 dark:text-orange-400"
    },
    {
      title: "Mars' Deimos",
      description: "Discovery of Mars' smaller moon, expanding our understanding of the solar system.",
      startDate: "Started August 17, 1877",
      timeElapsed: "147y 193d 9h",
      focusNodes: 10,
      satellites: 0,
      totalRotations: 52749,
      color: "text-yellow-500 dark:text-yellow-400"
    },
    {
      title: "Clock 4",
      description: "A unique meditation experience focused on rhythmic patterns and celestial movements.",
      startDate: "Available Now",
      timeElapsed: "-",
      focusNodes: 6,
      satellites: 0,
      totalRotations: 0,
      color: "text-green-500 dark:text-green-400"
    },
    {
      title: "Clock 5",
      description: "Explore the harmony of geometric patterns in this meditative journey.",
      startDate: "Available Now",
      timeElapsed: "-",
      focusNodes: 7,
      satellites: 0,
      totalRotations: 0,
      color: "text-blue-500 dark:text-blue-400"
    },
    {
      title: "Clock 6",
      description: "A contemplative experience inspired by astronomical phenomena.",
      startDate: "Available Now",
      timeElapsed: "-",
      focusNodes: 8,
      satellites: 0,
      totalRotations: 0,
      color: "text-indigo-500 dark:text-indigo-400"
    },
    {
      title: "Clock 7",
      description: "Discover inner peace through the lens of cosmic time.",
      startDate: "Available Now",
      timeElapsed: "-",
      focusNodes: 9,
      satellites: 0,
      totalRotations: 0,
      color: "text-purple-500 dark:text-purple-400"
    },
    {
      title: "Clock 8",
      description: "A journey through space and consciousness.",
      startDate: "Available Now",
      timeElapsed: "-",
      focusNodes: 8,
      satellites: 0,
      totalRotations: 0,
      color: "text-pink-500 dark:text-pink-400"
    },
    {
      title: "Clock 9",
      description: "Experience tranquility through celestial movements.",
      startDate: "Available Now",
      timeElapsed: "-",
      focusNodes: 7,
      satellites: 0,
      totalRotations: 0,
      color: "text-rose-500 dark:text-rose-400"
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold dark:text-white">Recent Sessions</h2>
            <button
              onClick={() => setIsListView(!isListView)}
              className="p-2 rounded-lg bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all text-gray-900 dark:text-white"
            >
              {isListView ? <LayoutGrid className="h-5 w-5" /> : <List className="h-5 w-5" />}
            </button>
          </div>
          <div className={isListView ? "space-y-2" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>
            {recentSessions.map((session, index) => (
              <Card 
                key={index}
                className="group p-3 bg-white/90 hover:bg-white dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Play className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">{session.title}</h3>
                    </div>
                    <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                      <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg border border-black/5 dark:border-white/10 bg-gray-50 dark:bg-black/50">
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">{formatDate(session.date)}</span>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg border border-black/5 dark:border-white/10 bg-gray-50 dark:bg-black/50">
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">{formatTime(session.timeRemaining)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gray-900 dark:bg-white rounded-full transition-all" 
                        style={{ width: `${session.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[2rem] text-right">
                      {session.progress}%
                    </span>
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
                className={`group p-4 bg-white/90 hover:bg-white dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border transition-all hover:shadow-lg hover:shadow-${clock.color.split(' ')[0]}/10 border-${clock.color.split(' ')[0]}/20 dark:border-${clock.color.split(' ')[1]}/20`}
              >
                <div className="aspect-square relative mb-4 overflow-hidden rounded-lg border border-black/5 dark:border-white/10 bg-gray-50 dark:bg-black/50">
                  <div className="group-hover:scale-105 transition-transform duration-300 relative">
                    <Image
                      src={`/${i + 1}_small.svg`}
                      alt={`Clock ${i + 1}`}
                      fill
                      className="object-contain p-4 z-10"
                    />
                    {/* Focus Nodes */}
                    {Array.from({ length: clock.focusNodes }).map((_, index) => {
                      const angle = (index * 360) / clock.focusNodes
                      const radius = 45
                      const x = 50 + radius * Math.cos((angle - 90) * (Math.PI / 180))
                      const y = 50 + radius * Math.sin((angle - 90) * (Math.PI / 180))
                      return (
                        <div
                          key={index}
                          className="absolute w-1.5 h-1.5 rounded-full bg-gray-900 dark:bg-white z-20"
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

                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-medium mb-2 text-gray-900 dark:text-white group-hover:opacity-90 transition-opacity">
                      {clock.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {clock.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg border border-black/5 dark:border-white/10 bg-gray-50 dark:bg-black/50">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-gray-900 dark:text-white">
                            <Circle className="h-3.5 w-3.5" />
                            <span className="font-medium">Focus Nodes</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-white">{clock.focusNodes}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-gray-900 dark:text-white">
                            <Satellite className="h-3.5 w-3.5" />
                            <span className="font-medium">Satellites</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-white">{clock.satellites}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg border border-black/5 dark:border-white/10 bg-gray-50 dark:bg-black/50">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-gray-900 dark:text-white">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="font-medium">Time</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-white">{clock.timeElapsed}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-gray-900 dark:text-white">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="font-medium">Started</span>
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-white">{clock.startDate.replace('Started ', '')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/clock/${i + 1}`}
                      className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg text-center transition-all bg-${clock.color.split(' ')[0]} dark:bg-${clock.color.split(' ')[1]} hover:opacity-90`}
                    >
                      <Play className="h-4 w-4 text-white mr-2" />
                      <span className="text-sm font-medium text-white">
                        Start Session
                      </span>
                    </Link>
                    <Link
                      href={`/clock/${i + 1}`}
                      className="flex items-center justify-center px-4 py-2.5 rounded-lg text-center transition-all border border-black/10 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        View
                      </span>
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