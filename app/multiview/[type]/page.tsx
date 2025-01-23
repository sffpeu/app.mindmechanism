'use client'

import { useParams } from 'next/navigation'
import Clock from '@/components/Clock'
import { useState, useEffect } from 'react'
import DotNavigation from '@/components/DotNavigation'
import { clockSettings } from '@/lib/clockSettings'
import { motion, AnimatePresence } from 'framer-motion'
import Menu from '@/components/Menu'

export default function MultiViewPage() {
  const params = useParams()
  const isMultiView2 = params.type === '2'
  const [showElements, setShowElements] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showSatellites, setShowSatellites] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Initialize dark mode from system preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  // Handle dark mode changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const multiview2Variants = {
    initial: { opacity: 0, scale: 0.75 },
    animate: { 
      opacity: 1, 
      scale: 0.75,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.7,
      transition: {
        duration: 0.4,
        ease: "easeIn"
      }
    }
  }

  const multiview1Variants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0,
      transition: {
        duration: 0.4,
        ease: "easeIn"
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col dark:bg-black">
      {/* Logo */}
      <div className="fixed top-6 left-6 text-2xl font-bold text-gray-800 dark:text-white">
        M
      </div>

      {/* DotNavigation */}
      <DotNavigation
        activeDot={9}
        isSmallMultiView={isMultiView2}
      />

      {/* Menu */}
      <Menu
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
        showSatellites={showSatellites}
        onSatellitesChange={setShowSatellites}
        isDarkMode={isDarkMode}
        onDarkModeChange={setIsDarkMode}
      />

      <div className="flex-grow flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={isMultiView2 ? 'multiview2' : 'multiview1'}
            variants={isMultiView2 ? multiview2Variants : multiview1Variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="transition-all duration-500 ease-in-out transform-gpu"
          >
            <Clock
              id={9}
              isMultiView={!isMultiView2}
              isMultiView2={isMultiView2}
              allClocks={clockSettings}
              startDateTime={new Date()}
              rotationTime={60000}
              imageUrl="/placeholder.svg"
              startingDegree={0}
              focusNodes={clockSettings.reduce((sum, clock) => sum + clock.focusNodes, 0)}
              rotationDirection="clockwise"
              imageOrientation={0}
              imageScale={1}
              imageX={0}
              imageY={0}
              showElements={showElements}
              onToggleShow={() => setShowElements(!showElements)}
              currentTime={currentTime}
              syncTrigger={0}
              hideControls={false}
              showSatellites={showSatellites}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
} 