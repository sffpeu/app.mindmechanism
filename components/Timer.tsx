import React, { useState, useEffect, useRef } from 'react'
import { Play, Pause } from 'lucide-react'
import { motion } from 'framer-motion'

interface TimerProps {
  duration: number | null // Duration in milliseconds, null for endless
  clockColor: string // Color class from the clock
  onComplete?: () => void
}

export function Timer({ duration, clockColor = 'text-gray-500 bg-gray-500', onComplete }: TimerProps) {
  const [isPaused, setIsPaused] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(duration)
  const startTimeRef = useRef<number | null>(null)
  const pausedTimeRef = useRef<number | null>(null)
  const colorClass = clockColor?.split(' ')?.[1] || 'bg-gray-500'
  const textColorClass = clockColor?.split(' ')?.[0] || 'text-gray-500'

  useEffect(() => {
    setTimeLeft(duration)
    startTimeRef.current = null
    pausedTimeRef.current = null
    setIsPaused(false)
  }, [duration])

  useEffect(() => {
    if (!duration || isPaused) {
      if (isPaused) {
        pausedTimeRef.current = timeLeft
      }
      return
    }

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now()
      if (pausedTimeRef.current) {
        // Adjust start time to account for paused duration
        startTimeRef.current = Date.now() - (duration - pausedTimeRef.current)
      }
    }

    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = now - startTimeRef.current!
      const remaining = duration - elapsed

      if (remaining <= 0) {
        clearInterval(interval)
        setTimeLeft(0)
        onComplete?.()
        return
      }

      setTimeLeft(remaining)
    }, 100)

    return () => clearInterval(interval)
  }, [duration, isPaused, onComplete])

  const formatTime = (ms: number | null) => {
    if (ms === null) return '∞'
    const totalSeconds = Math.max(0, Math.floor(ms / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const handlePlayPause = () => {
    if (!isPaused) {
      // Pausing
      pausedTimeRef.current = timeLeft
    } else {
      // Resuming
      startTimeRef.current = Date.now() - (duration! - (pausedTimeRef.current || 0))
    }
    setIsPaused(!isPaused)
  }

  return (
    <div className="fixed bottom-8 left-8 flex items-center gap-4">
      <motion.button
        onClick={handlePlayPause}
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