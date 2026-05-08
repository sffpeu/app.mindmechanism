'use client'

import { useEffect, useRef } from 'react'
import { WHEEL_AMBIENT_PATHS, SOUNDSCAPE_PATHS, GRAND_CLOCK_PATH } from '@/lib/sounds'

type AmbientType = 'ambient' | 'soundscape' | 'grandClock'

function resolveSlot(type: AmbientType, clockIndex?: number): string | null {
  if (type === 'grandClock') return GRAND_CLOCK_PATH
  if (clockIndex == null || clockIndex < 0 || clockIndex > 8) return null
  return type === 'ambient'
    ? WHEEL_AMBIENT_PATHS[clockIndex] ?? null
    : SOUNDSCAPE_PATHS[clockIndex] ?? null
}

type Options = {
  clockIndex?: number
  type?: AmbientType
  loop?: boolean
  volume?: number
  enabled?: boolean
}

/**
 * Plays the named wheel audio slot while the component is mounted.
 * Silently no-ops if the file has not been deployed yet.
 * Drop the commissioned .mp3 into /public/sounds/ to activate a slot.
 */
export function useWheelAmbient({
  clockIndex,
  type = 'ambient',
  loop = true,
  volume = 0.35,
  enabled = true,
}: Options = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!enabled) return

    const path = resolveSlot(type, clockIndex)
    if (!path) return

    const audio = new Audio(path)
    audio.loop = loop
    audio.volume = volume
    audioRef.current = audio

    const play = () => {
      audio.play().catch(() => {
        // File not yet deployed — silently ignore
      })
    }

    // Allow the page to load first
    const t = setTimeout(play, 400)

    return () => {
      clearTimeout(t)
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [clockIndex, type, loop, volume, enabled])

  const stop = () => {
    audioRef.current?.pause()
  }

  const setVolume = (v: number) => {
    if (audioRef.current) audioRef.current.volume = Math.min(1, Math.max(0, v))
  }

  return { stop, setVolume }
}
