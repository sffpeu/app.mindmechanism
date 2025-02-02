'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { Play, Pause, RotateCw } from 'lucide-react'
import { motion } from 'framer-motion'

interface TimerProps {
  duration: number // duration in minutes
  onComplete?: () => void
  isRunning: boolean
  onToggle: () => void
  onReset: () => void
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

export function Timer({ duration, onComplete, isRunning, onToggle, onReset, clockId }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number }>({
    minutes: duration,
    seconds: 0
  })
  const router = useRouter()
  const { user } = useAuth()

  // Update time when duration changes
  useEffect(() => {
    setTimeLeft({
      minutes: duration,
      seconds: 0
    })
  }, [duration])

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    let interval: NodeJS.Timeout

    if (isRunning && (timeLeft.minutes > 0 || timeLeft.seconds > 0)) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev.minutes === 0 && prev.seconds === 0) {
            clearInterval(interval)
            onComplete?.()
            return prev
          }
          
          if (prev.seconds === 0) {
            return {
              minutes: prev.minutes - 1,
              seconds: 59
            }
          }
          
          return {
            minutes: prev.minutes,
            seconds: prev.seconds - 1
          }
        })
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isRunning, timeLeft, onComplete, user, router])

  const formatTime = useCallback((minutes: number, seconds: number) => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [])

  const clockColor = clockColors[clockId % clockColors.length]

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
        {formatTime(timeLeft.minutes, timeLeft.seconds)}
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