'use client'

import { useState, useEffect, useRef } from 'react'
import { useSoundEffects } from '@/lib/sounds'
import { updateSessionProgress } from '@/lib/sessions'

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
  const remainingTimeRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { playClick } = useSoundEffects()

  remainingTimeRef.current = remainingTime

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
    // Tick every 250ms so progress ring moves in real time with timer
    timerRef.current = setInterval(tick, 250)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [remainingTime, isPaused, sessionStartTime, onSessionComplete])

  // Save session state when leaving (localStorage + Firestore so Continue uses correct time)
  useEffect(() => {
    if (!sessionId) return

    const handleVisibilityChange = () => {
      const current = remainingTimeRef.current
      if (document.hidden && current != null && current > 0) {
        localStorage.setItem('pendingSession', JSON.stringify({
          sessionId,
          remaining: current,
          timestamp: Date.now()
        }))
        updateSessionProgress(sessionId, {
          remaining_time_ms: current,
          last_active_time: new Date().toISOString()
        }).catch((err) => console.error('Error saving session progress:', err))
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [sessionId])

  // Save on page close / navigate away
  useEffect(() => {
    if (!sessionId) return

    const handlePageHide = () => {
      const current = remainingTimeRef.current
      if (current != null && current > 0) {
        localStorage.setItem('pendingSession', JSON.stringify({
          sessionId,
          remaining: current,
          timestamp: Date.now()
        }))
        updateSessionProgress(sessionId, {
          remaining_time_ms: current,
          last_active_time: new Date().toISOString()
        }).catch((err) => console.error('Error saving session progress:', err))
      }
    }

    window.addEventListener('pagehide', handlePageHide)
    return () => window.removeEventListener('pagehide', handlePageHide)
  }, [sessionId])

  // Auto-save periodically (localStorage + Firestore); use ref so we save current value
  useEffect(() => {
    if (!sessionId || isPaused) return

    const autoSaveInterval = setInterval(() => {
      const current = remainingTimeRef.current
      if (current == null || current <= 0) return
      localStorage.setItem('pendingSession', JSON.stringify({
        sessionId,
        remaining: current,
        timestamp: Date.now()
      }))
      updateSessionProgress(sessionId, {
        remaining_time_ms: current,
        last_active_time: new Date().toISOString()
      }).catch((err) => console.error('Error auto-saving session progress:', err))
    }, 30000)

    return () => clearInterval(autoSaveInterval)
  }, [sessionId, isPaused])

  return {
    remainingTime,
    isPaused,
    initialDuration,
    onPauseResume
  }
}
