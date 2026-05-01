'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/lib/FirebaseAuthContext'

/**
 * Renders the video on the clock face (static, non-rotating) and portals
 * a minimal control strip to the bottom of the viewport.
 *
 * Position in DOM: must sit OUTSIDE the rotating motion.div but inside
 * the rounded-full overflow-hidden container so the video is clipped to
 * the circle. Controls are portaled to document.body so they appear
 * outside the clock geometry without any page-level changes.
 *
 * Controls only mount when a video overlay is actually set for this clockId.
 */
export function ClockVideoOverlay({ clockId }: { clockId: number }) {
  const { profile } = useAuth()
  const media = profile?.wheelFaceOverlays?.[clockId]
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isLooping, setIsLooping] = useState(true)
  const [isMuted, setIsMuted] = useState(true)   // starts muted so autoplay works
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handlePlay = useCallback(() => {
    videoRef.current?.play()
  }, [])

  const handlePause = useCallback(() => {
    videoRef.current?.pause()
  }, [])

  const handleStop = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.pause()
    v.currentTime = 0
  }, [])

  const handleRestart = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = 0
    v.play()
  }, [])

  const handleBack = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = Math.max(0, v.currentTime - 10)
  }, [])

  const handleForward = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = Math.min(v.duration || 0, v.currentTime + 10)
  }, [])

  const handleLoopToggle = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.loop = !v.loop
    setIsLooping(v.loop)
  }, [])

  const handleMuteToggle = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setIsMuted(v.muted)
  }, [])

  if (!media?.url?.trim() || media.type !== 'video') return null

  const btnBase: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    padding: '5px 8px',
    borderRadius: 8,
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.15s',
  }

  const divider = (
    <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)', margin: '0 3px', flexShrink: 0 }} />
  )

  const controls = mounted ? createPortal(
    <div style={{
      position: 'fixed',
      bottom: 72,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9990,
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      background: 'rgba(10,10,12,0.88)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 32,
      padding: '3px 8px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    }}>
      {/* Restart */}
      <button style={btnBase} onClick={handleRestart} title="Restart">
        ⏮
      </button>
      {/* Back 10s */}
      <button style={btnBase} onClick={handleBack} title="Back 10s">
        ⏪
      </button>
      {divider}
      {/* Play / Pause */}
      {isPlaying ? (
        <button style={{ ...btnBase, color: 'rgba(255,255,255,0.9)', fontSize: 16 }} onClick={handlePause} title="Pause">
          ⏸
        </button>
      ) : (
        <button style={{ ...btnBase, color: 'rgba(255,255,255,0.9)', fontSize: 16 }} onClick={handlePlay} title="Play">
          ▶
        </button>
      )}
      {divider}
      {/* Forward 10s */}
      <button style={btnBase} onClick={handleForward} title="Forward 10s">
        ⏩
      </button>
      {/* Stop */}
      <button style={btnBase} onClick={handleStop} title="Stop">
        ⏹
      </button>
      {divider}
      {/* Loop */}
      <button
        style={{ ...btnBase, color: isLooping ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)' }}
        onClick={handleLoopToggle}
        title={isLooping ? 'Loop on' : 'Loop off'}
      >
        🔁
      </button>
      {divider}
      {/* Mute / Unmute — video starts muted for autoplay; tap to hear */}
      <button
        style={{ ...btnBase, color: isMuted ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.9)' }}
        onClick={handleMuteToggle}
        title={isMuted ? 'Unmute video' : 'Mute video'}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
    </div>,
    document.body
  ) : null

  return (
    <>
      {/* muted starts true so autoPlay works; user unmutes via control strip */}
      <video
        ref={videoRef}
        src={media.url}
        autoPlay
        muted={isMuted}
        loop={isLooping}
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        style={{ zIndex: 150 }}
      />
      {controls}
    </>
  )
}
