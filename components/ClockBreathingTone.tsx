'use client'

import { useCallback, useEffect, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { useClockBreathingTone } from '@/lib/hooks/useClockBreathingTone'
import { cn } from '@/lib/utils'

const MUTE_STORAGE_KEY = 'mindmechanism.clockSoundMuted'

function readMuted(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

/** Per-clock breathing tone plus bottom-right mute control on routes `/0`–`/8`. */
export function ClockBreathingTone({ clockIndex }: { clockIndex: number }) {
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    setMuted(readMuted())
  }, [])

  useClockBreathingTone(clockIndex, muted)

  const toggle = useCallback(() => {
    setMuted((m) => {
      const next = !m
      try {
        localStorage.setItem(MUTE_STORAGE_KEY, String(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'fixed bottom-4 right-4 z-[1001] flex h-11 w-11 items-center justify-center rounded-full',
        'border border-black/10 bg-white/90 text-gray-800 shadow-md backdrop-blur-sm',
        'transition-colors hover:bg-white dark:border-white/15 dark:bg-black/80 dark:text-gray-100 dark:hover:bg-black/90',
        'pointer-events-auto'
      )}
      aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
      title={muted ? 'Sound off — click to enable' : 'Sound on — click to mute'}
    >
      {muted ? <VolumeX className="h-5 w-5" aria-hidden /> : <Volume2 className="h-5 w-5" aria-hidden />}
    </button>
  )
}
