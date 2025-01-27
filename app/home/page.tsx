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
import Image from 'next/image'

export default function HomePage() {
  const { isDarkMode } = useTheme()
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95">
      <Menu
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
        showSatellites={showSatellites}
        onSatellitesChange={setShowSatellites}
      />
      
      {/* Auth Buttons */}
      <div className="absolute top-8 right-32 flex items-center gap-4">
        <button className="px-6 py-2 rounded-lg bg-transparent border-2 border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all">
          Log in
        </button>
        <button className="px-6 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 transition-all">
          Sign up
        </button>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="grid grid-cols-[1fr_1.2fr] gap-16 items-center mb-24">
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

          {/* MultiView 2 */}
          <div className="relative aspect-square">
            <div className="grid grid-cols-3 gap-4 h-full">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="relative aspect-square bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 rounded-2xl overflow-hidden group hover:border-black/10 dark:hover:border-white/20 transition-all">
                  <Image
                    src={`/${i + 1}_small.svg`}
                    alt={`Clock ${i + 1}`}
                    fill
                    className="object-contain p-4 dark:invert [&>path]:fill-white"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-4 gap-8 mb-24">
          <div className="p-8 rounded-2xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10">
            <div className="text-4xl font-bold text-black dark:text-white mb-2">9</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Unique Clocks</div>
          </div>
          <div className="p-8 rounded-2xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10">
            <div className="text-4xl font-bold text-black dark:text-white mb-2">300+</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Focus Words</div>
          </div>
          <div className="p-8 rounded-2xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10">
            <div className="text-4xl font-bold text-black dark:text-white mb-2">∞</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Session Modes</div>
          </div>
          <div className="p-8 rounded-2xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10">
            <div className="text-4xl font-bold text-black dark:text-white mb-2">24/7</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Availability</div>
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