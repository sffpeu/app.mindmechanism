import React, { useState, useEffect, useRef } from 'react'
import { Play, Pause } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { createSession, updateSession } from '@/lib/sessions'

interface TimerProps {
  duration: number | null // Duration in milliseconds, null for endless
  clockColor: string // Color class from the clock
  onComplete?: () => void
  clockId: number
  words: string[]
  weatherData?: any
  moonData?: any
  locationData?: any
}

export function Timer({ 
  duration, 
  clockColor = 'text-gray-500 bg-gray-500', 
  onComplete,
  clockId,
  words,
  weatherData,
  moonData,
  locationData
}: TimerProps) {
  const [isPaused, setIsPaused] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(duration)
  const startTimeRef = useRef<number | null>(null)
  const pausedTimeRef = useRef<number | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const { data: session } = useSession()
  const colorClass = clockColor?.split(' ')?.[1] || 'bg-gray-500'
  const textColorClass = clockColor?.split(' ')?.[0] || 'text-gray-500'

  useEffect(() => {
    setTimeLeft(duration)
    startTimeRef.current = null
    pausedTimeRef.current = null
    setIsPaused(false)
    sessionIdRef.current = null
  }, [duration])

  useEffect(() => {
    const initializeSession = async () => {
      if (!session?.user?.id || !duration || sessionIdRef.current) return

      try {
        const sessionData = await createSession({
          user_id: session.user.id,
          clock_id: clockId,
          duration: duration,
          words: words,
          moon_phase: moonData?.phase || '',
          moon_illumination: moonData?.illumination || 0,
          moon_rise: moonData?.rise || '',
          moon_set: moonData?.set || '',
          weather_condition: weatherData?.condition || '',
          temperature: weatherData?.temp || 0,
          humidity: weatherData?.humidity || 0,
          uv_index: weatherData?.uv || 0,
          pressure: weatherData?.pressure || 0,
          wind_speed: weatherData?.wind || 0,
          city: locationData?.city || '',
          country: locationData?.country || '',
          elevation: locationData?.elevation || 0,
          sea_level: locationData?.seaLevel || 0,
          latitude: locationData?.lat || 0,
          longitude: locationData?.lon || 0
        })
        sessionIdRef.current = sessionData.id
      } catch (error) {
        console.error('Error creating session:', error)
      }
    }

    initializeSession()
  }, [session?.user?.id, duration, clockId, words, weatherData, moonData, locationData])

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
        handleSessionComplete()
        onComplete?.()
        return
      }

      setTimeLeft(remaining)
    }, 100)

    return () => clearInterval(interval)
  }, [duration, isPaused, onComplete])

  useEffect(() => {
    // Handle page unload/close
    const handleUnload = async () => {
      if (sessionIdRef.current) {
        await handleSessionAbort()
      }
    }

    window.addEventListener('beforeunload', handleUnload)
    return () => {
      window.removeEventListener('beforeunload', handleUnload)
      handleUnload()
    }
  }, [])

  const handleSessionComplete = async () => {
    if (!sessionIdRef.current) return

    try {
      await updateSession(sessionIdRef.current, {
        status: 'completed',
        end_time: new Date().toISOString(),
        actual_duration: duration!
      })
    } catch (error) {
      console.error('Error completing session:', error)
    }
  }

  const handleSessionAbort = async () => {
    if (!sessionIdRef.current || !startTimeRef.current) return

    try {
      const actualDuration = Date.now() - startTimeRef.current
      await updateSession(sessionIdRef.current, {
        status: 'aborted',
        end_time: new Date().toISOString(),
        actual_duration: actualDuration
      })
    } catch (error) {
      console.error('Error aborting session:', error)
    }
  }

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