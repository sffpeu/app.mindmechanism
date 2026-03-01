import { useState, useEffect, useRef } from 'react'
import Timer from './Timer'
import { useSoundEffects } from '@/lib/sounds'

interface SessionTimerProps {
  duration: number | null
  sessionId: string | null
  onSessionComplete?: () => void
}

export function SessionTimer({ duration, sessionId, onSessionComplete }: SessionTimerProps) {
  const [remainingTime, setRemainingTime] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
  const initialDurationRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { playClick } = useSoundEffects()

  // Initialize timer from duration or saved session
  useEffect(() => {
    if (duration) {
      const now = Date.now()
      setRemainingTime(duration)
      setSessionStartTime(now)
      initialDurationRef.current = duration
      setIsPaused(false)
      playClick()

      // Save initial session state
      if (sessionId) {
        localStorage.setItem('pendingSession', JSON.stringify({
          sessionId,
          remaining: duration,
          timestamp: now
        }))
      }
    } else if (sessionId) {
      // Check for saved session
      const savedSession = localStorage.getItem('pendingSession')
      if (savedSession) {
        try {
          const { sessionId: savedId, remaining, timestamp } = JSON.parse(savedSession)
          if (savedId === sessionId && Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            setRemainingTime(remaining)
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

  // Handle pause/resume
  const handlePauseResume = () => {
    setIsPaused(!isPaused)
    playClick()
  }

  // Timer countdown effect — start counting down as soon as session begins
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

    tick() // Run immediately when session begins so countdown starts right away
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

  // Auto-save session state periodically
  useEffect(() => {
    if (!sessionId || !remainingTime || isPaused) return

    const autoSaveInterval = setInterval(() => {
      localStorage.setItem('pendingSession', JSON.stringify({
        sessionId,
        remaining: remainingTime,
        timestamp: Date.now()
      }))
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [sessionId, remainingTime, isPaused])

  if (!remainingTime) return null

  return (
    <Timer
      remainingTime={remainingTime}
      isPaused={isPaused}
      onPauseResume={handlePauseResume}
    />
  )
} 