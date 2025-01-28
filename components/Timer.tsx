import React, { useState, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'
import { motion } from 'framer-motion'

interface TimerProps {
  duration: number | null // Duration in milliseconds, null for endless
  clockColor: string // Color class from the clock
  onComplete?: () => void
}

export function Timer({ duration, clockColor = 'text-gray-500 bg-gray-500', onComplete }: TimerProps) {
  const [isPaused, setIsPaused] = useState(false)
  const [timeLeft, setTimeLeft] = useState(duration)
  const colorClass = clockColor?.split(' ')?.[1] || 'bg-gray-500'
  const textColorClass = clockColor?.split(' ')?.[0] || 'text-gray-500'

  useEffect(() => {
    if (!duration || isPaused) return

    const startTime = Date.now()
    const initialDuration = duration

    const interval = setInterval(() => {
      const elapsedTime = Date.now() - startTime
      const remaining = initialDuration - elapsedTime

      if (remaining <= 0) {
        clearInterval(interval)
        setTimeLeft(0)
        onComplete?.()
        return
      }

      setTimeLeft(remaining)
    }, 100) // Update more frequently for smoother countdown

    return () => clearInterval(interval)
  }, [duration, isPaused, onComplete])

  const formatTime = (ms: number | null) => {
    if (ms === null) return '∞'
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed bottom-8 left-8 flex items-center gap-4">
      <motion.button
        onClick={() => setIsPaused(!isPaused)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass} bg-opacity-10 dark:bg-opacity-20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-colors`}
      >
        {isPaused ? (
          <Play className={`w-5 h-5 ${textColorClass}`} />
        ) : (
          <Pause className={`w-5 h-5 ${textColorClass}`} />
        )}
      </motion.button>
      <div className={`text-2xl font-medium ${textColorClass}`}>
        {formatTime(timeLeft)}
      </div>
    </div>
  )
} 