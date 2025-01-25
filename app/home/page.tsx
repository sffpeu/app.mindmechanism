'use client'

import { useState } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { Play, BookOpen, ClipboardList, Brain, Target, PenTool } from 'lucide-react'
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
      {/* Background Multiview */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="relative w-full h-full">
          {[...Array(9)].map((_, index) => {
            const angle = (360 / 9) * index + 90
            const radius = 30
            const x = 50 + radius * Math.cos((angle * Math.PI) / 180)
            const y = 50 + radius * Math.sin((angle * Math.PI) / 180)
            return (
              <div
                key={index}
                className="absolute w-[25%] aspect-square"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <Image
                  src={`/${index + 1}_small.svg`}
                  alt={`Clock ${index + 1}`}
                  width={200}
                  height={200}
                  className="w-full h-full [&_*]:stroke-white [&_*]:stroke-[0.5]"
                />
              </div>
            )
          })}
        </div>
      </div>

      <Menu
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
        showSatellites={showSatellites}
        onSatellitesChange={setShowSatellites}
      />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-[1440px] mx-auto">
          {/* Hero Section */}
          <div className="max-w-[61.8%] mx-auto text-center mb-16">
            <motion.h1 
              className="text-8xl md:text-9xl font-bold mb-8 text-transparent [-webkit-text-stroke:1px_white]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0, 0.54, 0.56, 1] }}
            >
              1M3
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl text-gray-300 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0, 0.54, 0.56, 1] }}
            >
              Train your mind with an innovative meditation system
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
              <span className="relative z-10">Begin Journey</span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          </motion.div>

          {/* Interactive Feature Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[80%] mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0, 0.54, 0.56, 1] }}
          >
            {/* Explore Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="relative p-6 rounded-xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-white/20 transition-all group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-4">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-4 text-center">Explore Your Mind</h3>
                <p className="text-sm text-gray-400 text-center mb-4">Discover a unique approach to meditation with our innovative clock system</p>
                <div className="flex justify-center">
                  <motion.div
                    className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center"
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Target className="h-6 w-6 text-white" />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Meditate Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="relative p-6 rounded-xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-white/20 transition-all group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-4">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-4 text-center">Meditate with Words</h3>
                <p className="text-sm text-gray-400 text-center mb-4">Focus your practice with curated meditation words and meanings</p>
                <div className="flex justify-center">
                  <motion.div
                    className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center"
                    whileHover={{ scale: 1.2 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Play className="h-6 w-6 text-white" />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Track Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="relative p-6 rounded-xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-white/20 transition-all group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-4">
                  <PenTool className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-4 text-center">Track Progress</h3>
                <p className="text-sm text-gray-400 text-center mb-4">Document your journey with personal notes and insights</p>
                <div className="flex justify-center">
                  <motion.div
                    className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center"
                    whileHover={{ rotate: -180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ClipboardList className="h-6 w-6 text-white" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
} 