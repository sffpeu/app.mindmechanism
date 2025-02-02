'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { Play, Pause, RotateCw } from 'lucide-react'
import { motion } from 'framer-motion'

interface TimerProps {
  duration: number // duration in milliseconds
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
  const [timeLeft, setTimeLeft] = useState(duration)
  const router = useRouter()
  const { user } = useAuth()

  // Update timeLeft when duration changes
  useEffect(() => {
    setTimeLeft(duration)
  }, [duration])

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    let interval: NodeJS.Timeout

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1000) {
            clearInterval(interval)
            onComplete?.()
            return 0
          }
          return prev - 1000
        })
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isRunning, timeLeft, onComplete, user, router])

  const formatTime = useCallback((ms: number) => {
    const totalMinutes = Math.floor(ms / (60 * 1000))
    const seconds = Math.floor((ms % (60 * 1000)) / 1000)
    return `${totalMinutes}:${seconds.toString().padStart(2, '0')}`
  }, [])

  const clockColor = clockColors[clockId % clockColors.length]
  const style = {
    '--timer-color': clockColor,
  } as React.CSSProperties

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/50 dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all"
      style={style}
    >
      <div 
        className="font-mono font-medium"
        style={{ color: clockColor }}
      >
        {formatTime(timeLeft)}
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