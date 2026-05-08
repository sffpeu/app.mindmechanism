'use client'

import { useAuth } from '@/lib/FirebaseAuthContext'

/**
 * Renders image overlays on single-clock faces (inside the rotating mandala layer).
 * For video overlays, renders nothing — use ClockVideoOverlay placed outside the rotation.
 */
export function ClockWheelFaceOverlay({ clockId }: { clockId: number }) {
  const { profile } = useAuth()
  const media = profile?.wheelFaceOverlays?.[clockId]
  if (!media?.url?.trim() || media.type !== 'image') return null
  return (
    <img
      src={media.url}
      alt=""
      className="absolute inset-0 h-full w-full rounded-full object-cover dark:invert pointer-events-none z-[1]"
    />
  )
}
