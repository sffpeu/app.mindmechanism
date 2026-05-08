/**
 * useSpotifyPlayer — Spotify Web Playback SDK hook.
 *
 * Loads the Spotify SDK script dynamically, initialises a player instance
 * using the stored access token, and exposes play/pause/skip controls.
 *
 * Requires Spotify Premium on the user's account.
 * Token auto-refresh is handled via refreshSpotifyToken from lib/spotify.ts.
 */

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSettings } from '@/lib/hooks/useSettings'
import { getSpotifyAccessToken } from '@/lib/spotify'

// ── Spotify SDK types (minimal) ───────────────────────────────────────────────
declare global {
  interface Window {
    Spotify?: {
      Player: new (config: SpotifyPlayerConfig) => SpotifyPlayer
    }
    onSpotifyWebPlaybackSDKReady?: () => void
  }
}

interface SpotifyPlayerConfig {
  name: string
  getOAuthToken: (cb: (token: string) => void) => void
  volume?: number
}

interface SpotifyPlayer {
  connect: () => Promise<boolean>
  disconnect: () => void
  addListener: (event: string, cb: (data: unknown) => void) => void
  removeListener: (event: string, cb?: (data: unknown) => void) => void
  togglePlay: () => Promise<void>
  nextTrack: () => Promise<void>
  previousTrack: () => Promise<void>
  seek: (position_ms: number) => Promise<void>
  setVolume: (volume: number) => Promise<void>
}

export interface SpotifyPlaybackState {
  paused: boolean
  position: number
  duration: number
  trackName: string | null
  artistName: string | null
  albumArt: string | null
}

const INITIAL_STATE: SpotifyPlaybackState = {
  paused: true,
  position: 0,
  duration: 0,
  trackName: null,
  artistName: null,
  albumArt: null,
}

// ── Script loader ─────────────────────────────────────────────────────────────

let sdkPromise: Promise<void> | null = null

function loadSpotifySDK(): Promise<void> {
  if (sdkPromise) return sdkPromise
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'))
  if (window.Spotify) return Promise.resolve()

  sdkPromise = new Promise((resolve) => {
    // SDK fires this callback when ready
    window.onSpotifyWebPlaybackSDKReady = resolve
    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true
    document.head.appendChild(script)
  })

  return sdkPromise
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSpotifyPlayer(connectWhen = true) {
  const { spotifyTokens, setSpotifyTokens } = useSettings()
  const playerRef = useRef<SpotifyPlayer | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [playback, setPlayback] = useState<SpotifyPlaybackState>(INITIAL_STATE)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!spotifyTokens) return null
    return getSpotifyAccessToken(spotifyTokens, setSpotifyTokens)
  }, [spotifyTokens, setSpotifyTokens])

  useEffect(() => {
    if (!spotifyTokens || !connectWhen) {
      playerRef.current?.disconnect()
      playerRef.current = null
      setReady(false)
      setDeviceId(null)
      setPlayback(INITIAL_STATE)
      return
    }

    let player: SpotifyPlayer

    loadSpotifySDK().then(() => {
      if (!window.Spotify) return

      player = new window.Spotify.Player({
        name: 'Mind Mechanism',
        getOAuthToken: (cb) => {
          getToken().then((t) => { if (t) cb(t) })
        },
        volume: 0.8,
      })

      player.addListener('ready', (data) => {
        const { device_id } = data as { device_id: string }
        setDeviceId(device_id)
        setReady(true)
        setError(null)
      })

      player.addListener('not_ready', () => {
        setReady(false)
      })

      player.addListener('player_state_changed', (state) => {
        if (!state) return
        const s = state as {
          paused: boolean
          position: number
          duration: number
          track_window: {
            current_track: {
              name: string
              artists: { name: string }[]
              album: { images: { url: string }[] }
            }
          }
        }
        const track = s.track_window?.current_track
        setPlayback({
          paused: s.paused,
          position: s.position,
          duration: s.duration,
          trackName: track?.name ?? null,
          artistName: track?.artists?.[0]?.name ?? null,
          albumArt: track?.album?.images?.[0]?.url ?? null,
        })
      })

      player.addListener('initialization_error', (data) => {
        const { message } = data as { message: string }
        setError(`Initialisation error: ${message}`)
      })

      player.addListener('authentication_error', (data) => {
        const { message } = data as { message: string }
        setError(`Auth error: ${message}`)
      })

      player.addListener('account_error', (data) => {
        const { message } = data as { message: string }
        setError(`Account error: ${message} (Spotify Premium required)`)
      })

      player.connect()
      playerRef.current = player
    })

    return () => {
      playerRef.current?.disconnect()
      playerRef.current = null
      setReady(false)
      setDeviceId(null)
    }
  }, [!!spotifyTokens, connectWhen, getToken]) // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlay = useCallback(() => playerRef.current?.togglePlay(), [])
  const nextTrack   = useCallback(() => playerRef.current?.nextTrack(), [])
  const prevTrack   = useCallback(() => playerRef.current?.previousTrack(), [])
  const seek        = useCallback((ms: number) => playerRef.current?.seek(ms), [])
  const setVolume   = useCallback((v: number) => playerRef.current?.setVolume(v), [])

  return { ready, deviceId, playback, error, togglePlay, nextTrack, prevTrack, seek, setVolume }
}
