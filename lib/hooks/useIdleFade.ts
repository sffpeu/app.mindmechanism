'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const IDLE_MS = 5000

export function useIdleFade() {
  const [isIdle, setIsIdle] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reset = useCallback(() => {
    setIsIdle(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setIsIdle(true), IDLE_MS)
  }, [])

  useEffect(() => {
    reset()
    window.addEventListener('mousemove', reset)
    window.addEventListener('mousedown', reset)
    window.addEventListener('touchstart', reset)
    window.addEventListener('keydown', reset)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      window.removeEventListener('mousemove', reset)
      window.removeEventListener('mousedown', reset)
      window.removeEventListener('touchstart', reset)
      window.removeEventListener('keydown', reset)
    }
  }, [reset])

  return { isIdle }
}
