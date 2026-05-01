'use client'

import { useAuth } from '@/lib/FirebaseAuthContext'

/**
 * Renders video overlays on single-clock faces.
 *
 * Must be placed OUTSIDE the rotating motion.div but inside the
 * rounded-full overflow-hidden container so the video:
 *   1. Does not spin with the mandala
 *   2. Is clipped to the circular face
 *   3. Fills the circle edge-to-edge (object-cover)
 *
 * The mandala continues rotating beneath it at z-index 100.
 * This overlay sits at z-index 150, below focus nodes at z-index 400+.
 */
export function ClockVideoOverlay({ clockId }: { clockId: number }) {
  const { profile } = useAuth()
  const media = profile?.wheelFaceOverlays?.[clockId]
  if (!media?.url?.trim() || media.type !== 'video') return null
  return (
    <video
      src={media.url}
      autoPlay
      muted
      loop
      playsInline
      className="absolute inset-0 h-full w-full object-cover pointer-events-none"
      style={{ zIndex: 150 }}
    />
  )
}
