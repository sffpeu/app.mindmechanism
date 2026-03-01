'use client'

import { useState, useEffect, useRef } from 'react'
import { useSoundEffects } from '@/lib/sounds'

export function useSessionTimer(
  duration: number | null,
  sessionId: string | null,
  onSessionComplete?: () => void
) {
  const [remainingTime, setRemainingTime] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
  const [initialDuration, setInitialDuration] = useState<number | null>(null)
  const initialDurationRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { playClick } = useSoundEffects()

  // Initialize timer from duration or saved session
  useEffect(() => {
    if (duration) {
      const now = Date.now()
      setRemainingTime(duration)
      setSessionStartTime(now)
      setInitialDuration(duration)
      initialDurationRef.current = duration
      setIsPaused(false)
      playClick()

      if (sessionId) {
        localStorage.setItem('pendingSession', JSON.stringify({
          sessionId,
          remaining: duration,
          timestamp: now
        }))
      }
    } else if (sessionId) {
      const savedSession = localStorage.getItem('pendingSession')
      if (savedSession) {
        try {
          const { sessionId: savedId, remaining, timestamp } = JSON.parse(savedSession)
          if (savedId === sessionId && Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            setRemainingTime(remaining)
            setInitialDuration(remaining)
            initialDurationRef.current = remaining
            setSessionStartTime(Date.now())
            setIsPaused(false)
          } else {
            localStorage.removeItem('pendingSession')
          }
        } catch (error) {
          console.error('Error recovering session:', error)
          localStorage.removeItem('pendingSession')
        }
      }
    }
  }, [duration, sessionId, playClick])

  const onPauseResume = () => {
    setIsPaused(prev => !prev)
    playClick()
  }

  // Timer countdown effect
  useEffect(() => {
    if (remainingTime == null || isPaused || !sessionStartTime || initialDurationRef.current == null) return

    const tick = () => {
      const elapsed = Date.now() - sessionStartTime
      const remaining = Math.max(0, initialDurationRef.current! - elapsed)
      setRemainingTime(remaining)
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = null
        onSessionComplete?.()
      }
    }

    tick()
    timerRef.current = setInterval(tick, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [remainingTime, isPaused, sessionStartTime, onSessionComplete])

  // Save session state when leaving
  useEffect(() => {
    if (!sessionId || !remainingTime) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        localStorage.setItem('pendingSession', JSON.stringify({
          sessionId,
          remaining: remainingTime,
          timestamp: Date.now()
        }))
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [sessionId, remainingTime])

  // Auto-save periodically
  useEffect(() => {
    if (!sessionId || !remainingTime || isPaused) return

    const autoSaveInterval = setInterval(() => {
      localStorage.setItem('pendingSession', JSON.stringify({
        sessionId,
        remaining: remainingTime,
        timestamp: Date.now()
      }))
    }, 30000)

    return () => clearInterval(autoSaveInterval)
  }, [sessionId, remainingTime, isPaused])

  return {
    remainingTime,
    isPaused,
    initialDuration,
    onPauseResume
  }
}
