'use client'

import { useState } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { Card } from '@/components/ui/card'
import { Play, Clock, MoreVertical } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Session {
  title: string
  date: Date
  timeRemaining: number
  progress: number
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
      <Menu
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
        showSatellites={showSatellites}
        onSatellitesChange={setShowSatellites}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
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
            {Array.from({ length: 9 }, (_, i) => (
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
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {i === 0 ? "Galileo's First Observation" :
                     i === 1 ? "Neptune's Discovery" :
                     i === 2 ? "Mars' Deimos" : `Clock ${i + 1}`}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span>60 minutes</span>
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