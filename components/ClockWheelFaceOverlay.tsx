'use client'

import { useAuth } from '@/lib/FirebaseAuthContext'

/** Layered on the built-in wheel SVG on single-clock pages only (not multiview). */
export function ClockWheelFaceOverlay({ clockId }: { clockId: number }) {
  const { profile } = useAuth()
  const url = profile?.wheelFaceOverlays?.[clockId]?.trim()
  if (!url) return null
  return (
    <img
      src={url}
      alt=""
      className="absolute inset-0 h-full w-full rounded-full object-cover dark:invert pointer-events-none z-[1]"
    />
  )
}
