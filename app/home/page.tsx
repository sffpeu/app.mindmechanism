'use client'

import { useState } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { Play, BookOpen, ClipboardList, ArrowRight, LogIn, LogOut, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'

export default function HomePage() {
  const { isDarkMode } = useTheme()
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95">
      <Menu
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
        showSatellites={showSatellites}
        onSatellitesChange={setShowSatellites}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold dark:text-white mb-3">
                Mind Mechanism
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400 max-w-xl">
                Track your meditation journey with an innovative clock system, explore meditation focus words, and document your progress.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push('/sessions')}
                className="px-6 py-2.5 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 transition-all text-sm"
              >
                Explore
              </button>
              {!session && (
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="px-6 py-2.5 rounded-lg bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all flex items-center gap-2 text-sm text-black dark:text-white"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="space-y-8">
          <h2 className="text-lg font-semibold text-black dark:text-white">Key Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center mb-3">
                <Play className="h-4 w-4 text-black dark:text-white" />
              </div>
              <h3 className="text-base font-medium text-black dark:text-white mb-2">Meditation Clock</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">A unique clock interface designed to enhance your meditation practice.</p>
              <button 
                onClick={() => router.push('/sessions')}
                className="flex items-center gap-1.5 text-xs font-medium text-black dark:text-white group-hover:gap-2 transition-all"
              >
                Learn more
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            
            <div className="p-4 rounded-xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center mb-3">
                <BookOpen className="h-4 w-4 text-black dark:text-white" />
              </div>
              <h3 className="text-base font-medium text-black dark:text-white mb-2">Focus Words</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Access a curated collection of meditation focus words with meanings.</p>
              <button 
                onClick={() => router.push('/glossary')}
                className="flex items-center gap-1.5 text-xs font-medium text-black dark:text-white group-hover:gap-2 transition-all"
              >
                Learn more
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            
            <div className="p-4 rounded-xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all group">
              <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center mb-3">
                <ClipboardList className="h-4 w-4 text-black dark:text-white" />
              </div>
              <h3 className="text-base font-medium text-black dark:text-white mb-2">Progress Tracking</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Keep track of your meditation journey with personal notes.</p>
              <button 
                onClick={() => router.push('/notes')}
                className="flex items-center gap-1.5 text-xs font-medium text-black dark:text-white group-hover:gap-2 transition-all"
              >
                Learn more
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 