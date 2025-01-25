'use client'

import { useState } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { Play, BookOpen, ClipboardList } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function HomePage() {
  const { isDarkMode } = useTheme()
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const router = useRouter()

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Background Image with Vignette */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/background.jpg"
          alt="Background"
          layout="fill"
          objectFit="cover"
          className="opacity-50"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
      </div>

      <Menu
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
        showSatellites={showSatellites}
        onSatellitesChange={setShowSatellites}
      />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-[1440px] mx-auto">
          {/* Hero Section - Using Golden Ratio for width (1.618) */}
          <div className="max-w-[61.8%] mx-auto text-center mb-16">
            <motion.h1 
              className="text-6xl md:text-8xl font-bold text-white mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0, 0.54, 0.56, 1] }}
            >
              Mind Mechanism
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl text-gray-300 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0, 0.54, 0.56, 1] }}
            >
              Design your meditation journey with an innovative clock system
            </motion.p>
          </div>

          {/* Main CTA */}
          <motion.div 
            className="flex justify-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0, 0.54, 0.56, 1] }}
          >
            <motion.button
              onClick={() => router.push('/')}
              className="group relative px-8 py-4 text-lg font-medium text-white bg-transparent border-2 border-white/20 rounded-full hover:border-white/40 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10">Start for free</span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          </motion.div>

          {/* Feature Links */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[61.8%] mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0, 0.54, 0.56, 1] }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/glossary')}
              className="p-6 rounded-xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 text-center">Explore Words</h3>
              <p className="text-sm text-gray-400 text-center">Discover meditation focus words and their meanings</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/')}
              className="p-6 rounded-xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="flex items-center justify-center mb-4">
                <Play className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 text-center">Start Session</h3>
              <p className="text-sm text-gray-400 text-center">Begin your meditation practice</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/notes')}
              className="p-6 rounded-xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="flex items-center justify-center mb-4">
                <ClipboardList className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 text-center">Track Progress</h3>
              <p className="text-sm text-gray-400 text-center">Document your meditation journey</p>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  )
} 