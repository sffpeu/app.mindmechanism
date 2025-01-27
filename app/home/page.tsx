'use client'

import { useEffect, useState } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { Play, BookOpen, ClipboardList, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import styles from './page.module.css'
import DotNavigation from '@/components/DotNavigation'
import { clockSettings } from '@/lib/clockSettings'
import { AuthButtons } from '@/components/AuthButtons'

export default function HomePage() {
  const { isDarkMode } = useTheme()
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95">
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-50/80 dark:bg-black/80 backdrop-blur-lg border-b border-black/5 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Menu
            showElements={showElements}
            onToggleShow={() => setShowElements(!showElements)}
            showSatellites={showSatellites}
            onSatellitesChange={setShowSatellites}
          />
          <AuthButtons />
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        {/* Hero Section */}
        <div className="mb-24">
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold dark:text-white mb-6">
                Mind Mechanism
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Track your meditation journey with an innovative clock system, explore meditation focus words, and document your progress.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/sessions')}
                className="px-8 py-4 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 transition-all flex items-center gap-2"
              >
                <Play className="h-5 w-5" />
                Start Session
              </button>
              <button 
                onClick={() => router.push('/glossary')}
                className="px-8 py-4 rounded-xl bg-transparent border-2 border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center gap-2"
              >
                <BookOpen className="h-5 w-5" />
                Explore Words
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="space-y-16">
          <h2 className="text-3xl font-bold text-black dark:text-white">Key Features</h2>
          
          <div className="grid grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center mb-6">
                <Play className="h-6 w-6 text-black dark:text-white" />
              </div>
              <h3 className="text-xl font-semibold text-black dark:text-white mb-4">Meditation Clock</h3>
              <p className="text-gray-600 dark:text-gray-400">A unique clock interface designed to enhance your meditation practice with visual cues and timing.</p>
              <button 
                onClick={() => router.push('/sessions')}
                className="mt-6 flex items-center gap-2 text-sm font-medium text-black dark:text-white group-hover:gap-3 transition-all"
              >
                Learn more
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-8 rounded-2xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center mb-6">
                <BookOpen className="h-6 w-6 text-black dark:text-white" />
              </div>
              <h3 className="text-xl font-semibold text-black dark:text-white mb-4">Focus Words</h3>
              <p className="text-gray-600 dark:text-gray-400">Access a curated collection of meditation focus words with meanings and ratings to guide your practice.</p>
              <button 
                onClick={() => router.push('/glossary')}
                className="mt-6 flex items-center gap-2 text-sm font-medium text-black dark:text-white group-hover:gap-3 transition-all"
              >
                Learn more
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-8 rounded-2xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center mb-6">
                <ClipboardList className="h-6 w-6 text-black dark:text-white" />
              </div>
              <h3 className="text-xl font-semibold text-black dark:text-white mb-4">Progress Tracking</h3>
              <p className="text-gray-600 dark:text-gray-400">Keep track of your meditation journey with personal notes and session records.</p>
              <button 
                onClick={() => router.push('/notes')}
                className="mt-6 flex items-center gap-2 text-sm font-medium text-black dark:text-white group-hover:gap-3 transition-all"
              >
                Learn more
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 