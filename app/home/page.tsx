'use client'

import { useState, useRef } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { Play, BookOpen, ClipboardList, ArrowRight, LogIn, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useAuth } from '@/lib/FirebaseAuthContext'

export default function HomePage() {
  const { theme } = useTheme()
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const router = useRouter()
  const { user, signOut } = useAuth()
  const featuresRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/signin')
  }

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <Menu
            showElements={showElements}
            onToggleShow={() => setShowElements(!showElements)}
            showSatellites={showSatellites}
            onSatellitesChange={setShowSatellites}
          />
        </div>

        {/* Welcome Section */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-7xl font-bold text-black dark:text-white mb-4">
              1M3 Mindmechanism
            </h1>
            <p className="text-xl md:text-2xl text-black/90 dark:text-white/90 max-w-2xl mx-auto mb-8">
              Your mind. Your mechanism.
            </p>
            <div className="flex items-center justify-center gap-3">
              {user && (
                <button
                  onClick={scrollToFeatures}
                  className="px-6 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all text-sm"
                >
                  Explore
                </button>
              )}
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="px-6 py-2.5 rounded-lg bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all flex items-center gap-2 text-sm text-black dark:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="px-6 py-2.5 rounded-lg bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all flex items-center gap-2 text-sm text-black dark:text-white"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        {user && (
          <div ref={featuresRef} className="space-y-8 mt-32">
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
                <h3 className="text-base font-medium text-black dark:text-white mb-2">Guided Sessions</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Access a library of guided meditation sessions for all levels.</p>
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
                  <ClipboardList className="h-4 w-4 text-black dark:text-white" />
                </div>
                <h3 className="text-base font-medium text-black dark:text-white mb-2">Progress Tracking</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Monitor your meditation journey with detailed insights and statistics.</p>
                <button
                  onClick={() => router.push('/sessions')}
                  className="flex items-center gap-1.5 text-xs font-medium text-black dark:text-white group-hover:gap-2 transition-all"
                >
                  Learn more
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 