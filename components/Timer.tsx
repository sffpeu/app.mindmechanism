'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { Play, Pause, RotateCw } from 'lucide-react'

interface TimerProps {
  duration: number
  onComplete?: () => void
  isRunning: boolean
  onToggle: () => void
  onReset: () => void
}

export function Timer({ duration, onComplete, isRunning, onToggle, onReset }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    let timer: NodeJS.Timeout
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1000) {
            clearInterval(timer)
            onComplete?.()
            return 0
          }
          return prev - 1000
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isRunning, timeLeft, onComplete, user, router])

  const formatTime = useCallback((ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [])

  return (
    <div className="flex items-center gap-4">
      <div className="text-4xl font-mono font-medium text-black dark:text-white">
        {formatTime(timeLeft)}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all"
        >
          {isRunning ? (
            <Pause className="h-5 w-5 text-black dark:text-white" />
          ) : (
            <Play className="h-5 w-5 text-black dark:text-white" />
          )}
        </button>
        <button
          onClick={onReset}
          className="p-2 rounded-lg bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all"
        >
          <RotateCw className="h-5 w-5 text-black dark:text-white" />
        </button>
      </div>
    </div>
  )
} 