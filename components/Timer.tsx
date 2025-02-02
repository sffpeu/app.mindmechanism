'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, RotateCw } from 'lucide-react'
import { motion } from 'framer-motion'

interface TimerProps {
  minutes: number // duration in minutes (e.g., 15 for 15 minutes)
  isRunning: boolean
  onToggle: () => void
  onReset: () => void
  onComplete?: () => void
  clockId: number
}

const clockColors = [
  '#fd290a', // 1. Red
  '#fba63b', // 2. Orange
  '#f7da5f', // 3. Yellow
  '#6dc037', // 4. Green
  '#156fde', // 5. Blue
  '#941952', // 6. Dark Pink
  '#541b96', // 7. Purple
  '#ee5fa7', // 8. Pink
  '#56c1ff', // 9. Light Blue
]

export function Timer({ minutes, isRunning, onToggle, onReset, onComplete, clockId }: TimerProps) {
  const [mins, setMins] = useState(minutes)
  const [secs, setSecs] = useState(0)

  // Reset timer when minutes prop changes
  useEffect(() => {
    setMins(minutes)
    setSecs(0)
  }, [minutes])

  // Handle countdown
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && (mins > 0 || secs > 0)) {
      interval = setInterval(() => {
        if (secs === 0) {
          if (mins === 0) {
            clearInterval(interval)
            onComplete?.()
          } else {
            setMins(m => m - 1)
            setSecs(59)
          }
        } else {
          setSecs(s => s - 1)
        }
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isRunning, mins, secs, onComplete])

  const clockColor = clockColors[clockId % clockColors.length]
  // Simple display time calculation with proper padding
  const displayTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/50 dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all"
    >
      <div 
        className="font-mono font-medium text-lg"
        style={{ color: clockColor }}
      >
        {displayTime}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggle}
          className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          style={{ color: clockColor }}
        >
          {isRunning ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={onReset}
          className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          style={{ color: clockColor }}
        >
          <RotateCw className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
} 