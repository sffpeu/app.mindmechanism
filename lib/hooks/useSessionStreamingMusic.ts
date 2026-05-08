'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useSettings } from '@/lib/hooks/useSettings'
import { useSpotifyPlayer } from '@/lib/hooks/useSpotifyPlayer'
import { getSpotifyAccessToken, spotifyTokensValid } from '@/lib/spotify'
import {
  normalizeSpotifyPlaylistUri,
  spotifyFetchUserPlaylists,
  spotifyPause,
  spotifyPausePlayback,
  spotifyResume,
  spotifySetShuffle,
  spotifyStartContext,
  spotifyTransferPlayback,
} from '@/lib/spotifyPlayback'

export interface SessionStreamingMusicArgs {
  /** True while the timed session has remaining time &gt; 0 */
  sessionActive: boolean
  isPaused: boolean
}

/**
 * When a timed session is active, starts playback on the user’s chosen
 * service (Spotify Web Playback SDK + Web API) and mirrors pause/resume
 * to the session timer.
 */
export function useSessionStreamingMusic({
  sessionActive,
  isPaused,
}: SessionStreamingMusicArgs) {
  const {
    spotifyTokens,
    setSpotifyTokens,
    sessionStreamingDuringSessions,
    sessionMusicProvider,
    spotifySessionPlaylistUri,
  } = useSettings()

  const hasSpotifyTokens = spotifyTokensValid(spotifyTokens)

  const spotifyWants =
    sessionStreamingDuringSessions &&
    hasSpotifyTokens &&
    (sessionMusicProvider === 'spotify' ||
      sessionMusicProvider === 'auto' ||
      sessionMusicProvider === 'apple')

  const spotifyConnectWhen = sessionActive && spotifyWants

  const { ready, deviceId, error: spotifyPlayerError } = useSpotifyPlayer(
    spotifyConnectWhen
  )

  const spotifyLiveRef = useRef(false)
  const startedSpotifyRef = useRef(false)

  const getSpotifyToken = useCallback(async () => {
    if (!spotifyTokens) return null
    return getSpotifyAccessToken(spotifyTokens, setSpotifyTokens)
  }, [spotifyTokens, setSpotifyTokens])

  // ── Spotify: start once when device ready ───────────────────────────────
  useEffect(() => {
    if (!sessionActive || !spotifyWants || isPaused) return
    if (!ready || !deviceId || !spotifyTokens) return
    if (startedSpotifyRef.current) return

    let cancelled = false

    void (async () => {
      try {
        const token = await getSpotifyToken()
        if (cancelled || !token) return

        await spotifyTransferPlayback(token, deviceId, false)
        const configured = normalizeSpotifyPlaylistUri(spotifySessionPlaylistUri ?? undefined)
        let contextUri: string
        if (configured) {
          contextUri = configured
        } else {
          const lists = await spotifyFetchUserPlaylists(token, 25)
          if (cancelled || lists.length === 0) return
          contextUri = lists[Math.floor(Math.random() * lists.length)]!.uri
        }

        await spotifySetShuffle(token, deviceId, true)
        await spotifyStartContext(token, deviceId, contextUri)
        if (cancelled) return
        startedSpotifyRef.current = true
        spotifyLiveRef.current = true
      } catch (e) {
        console.warn('[session music] Spotify start failed:', e)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    sessionActive,
    spotifyWants,
    isPaused,
    ready,
    deviceId,
    spotifyTokens,
    spotifySessionPlaylistUri,
    getSpotifyToken,
  ])

  // ── Spotify: pause / resume with session ──────────────────────────────
  useEffect(() => {
    if (!sessionActive || !spotifyWants || !spotifyLiveRef.current) return
    if (!deviceId) return

    let cancelled = false
    void (async () => {
      const token = await getSpotifyToken()
      if (cancelled || !token) return
      try {
        if (isPaused) await spotifyPause(token, deviceId)
        else await spotifyResume(token, deviceId)
      } catch (e) {
        console.warn('[session music] Spotify pause/resume:', e)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isPaused, sessionActive, spotifyWants, deviceId, getSpotifyToken])

  // ── Spotify: stop when session ends (global pause — works after Web Player unmount)
  useEffect(() => {
    if (sessionActive || !spotifyLiveRef.current) return
    spotifyLiveRef.current = false
    startedSpotifyRef.current = false

    let cancelled = false
    void (async () => {
      const token = await getSpotifyToken()
      if (cancelled || !token) return
      try {
        await spotifyPausePlayback(token)
      } catch {
        /* ignore — e.g. 404 if nothing was playing */
      }
    })()

    return () => {
      cancelled = true
    }
  }, [sessionActive, getSpotifyToken])

  // Reset Spotify “started” when leaving session so a new session can start again
  useEffect(() => {
    if (!sessionActive) {
      startedSpotifyRef.current = false
    }
  }, [sessionActive])

  // Log SDK-level Spotify errors once for debugging (Premium, etc.)
  useEffect(() => {
    if (spotifyPlayerError) {
      console.warn('[session music]', spotifyPlayerError)
    }
  }, [spotifyPlayerError])
}
