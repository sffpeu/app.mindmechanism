'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  word: string
  language?: string
  audioUrl?: string
  hex?: string
  className?: string
}

export function SpeakButton({ word, language = 'en', audioUrl, hex, className }: Props) {
  const [speaking, setSpeaking] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (typeof window !== 'undefined') {
        window.speechSynthesis?.cancel()
      }
    }
  }, [])

  const speak = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()

      if (speaking) {
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
          audioRef.current = null
        }
        window.speechSynthesis?.cancel()
        setSpeaking(false)
        return
      }

      setSpeaking(true)

      if (audioUrl) {
        const audio = new Audio(audioUrl)
        audioRef.current = audio
        audio.onended = () => setSpeaking(false)
        audio.onerror = () => setSpeaking(false)
        audio.play().catch(() => setSpeaking(false))
        return
      }

      if (!('speechSynthesis' in window)) {
        setSpeaking(false)
        return
      }

      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(word)
      utter.lang = language === 'other' ? 'en' : language
      utter.rate = 0.9
      utter.onend = () => setSpeaking(false)
      utter.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(utter)
    },
    [speaking, word, language, audioUrl]
  )

  return (
    <button
      type="button"
      onClick={speak}
      aria-label={speaking ? 'Stop pronunciation' : `Hear pronunciation of "${word}"`}
      className={cn(
        'inline-flex items-center justify-center rounded p-1 transition-colors shrink-0',
        speaking
          ? 'text-white'
          : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
        className
      )}
      style={
        speaking && hex
          ? { backgroundColor: hex, color: '#fff' }
          : speaking
            ? { backgroundColor: '#6b7280' }
            : undefined
      }
    >
      <Volume2
        className={cn('h-3.5 w-3.5', speaking && 'animate-pulse')}
        aria-hidden
      />
    </button>
  )
}
