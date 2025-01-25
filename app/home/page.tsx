'use client'

import { useEffect, useState } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { Logo } from '@/components/Logo'
import { Play, BookOpen, ClipboardList, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function HomePage() {
  const { isDarkMode } = useTheme()
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95">
      <Logo />
      <Menu
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
        showSatellites={showSatellites}
        onSatellitesChange={setShowSatellites}
      />
      
      <div className="max-w-6xl mx-auto p-4 md:p-6 pt-24">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold dark:text-white mb-4">
            Mind Mechanism
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Track your meditation journey with an innovative clock system, explore meditation focus words, and document your progress.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/')}
            className="p-6 rounded-xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <Play className="h-6 w-6 text-black dark:text-white" />
              <ArrowRight className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Start Session</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Begin a new meditation session with the Mind Mechanism clock.</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/glossary')}
            className="p-6 rounded-xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="h-6 w-6 text-black dark:text-white" />
              <ArrowRight className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Explore Words</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Browse through meditation focus words and their meanings.</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/notes')}
            className="p-6 rounded-xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <ClipboardList className="h-6 w-6 text-black dark:text-white" />
              <ArrowRight className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Add Note</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Document your meditation insights and track progress.</p>
          </motion.button>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-black dark:text-white">Meditation Clock</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">A unique clock interface designed to enhance your meditation practice with visual cues and timing.</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-black dark:text-white">Focus Words</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Access a curated collection of meditation focus words with meanings and ratings to guide your practice.</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-black dark:text-white">Progress Tracking</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Keep track of your meditation journey with personal notes and session records.</p>
          </div>
        </div>
      </div>
    </div>
  )
} 