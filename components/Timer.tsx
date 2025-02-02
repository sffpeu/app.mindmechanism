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
}

export function Timer({ duration, onComplete, isRunning, onToggle, onReset }: TimerProps) {
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

    let startTime: number
    let animationFrameId: number

    const updateTimer = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      
      setTimeLeft((prevTime) => {
        const newTime = Math.max(0, prevTime - elapsed)
        if (newTime <= 0) {
          onComplete?.()
          return 0
        }
        return newTime
      })

      startTime = timestamp
      if (isRunning && timeLeft > 0) {
        animationFrameId = requestAnimationFrame(updateTimer)
      }
    }

    if (isRunning && timeLeft > 0) {
      animationFrameId = requestAnimationFrame(updateTimer)
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [isRunning, timeLeft, onComplete, user, router])

  const formatTime = useCallback((ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/50 dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all"
    >
      <div className="font-mono font-medium text-black dark:text-white">
        {formatTime(timeLeft)}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggle}
          className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          {isRunning ? (
            <Pause className="h-4 w-4 text-black dark:text-white" />
          ) : (
            <Play className="h-4 w-4 text-black dark:text-white" />
          )}
        </button>
        <button
          onClick={onReset}
          className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <RotateCw className="h-4 w-4 text-black dark:text-white" />
        </button>
      </div>
    </motion.div>
  )
} 