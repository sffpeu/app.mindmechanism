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
import { initMusicKit, getMusicKit } from '@/lib/appleMusicKit'
import {
  fetchAppleLibraryPlaylistIds,
  normalizeAppleMusicPlaylistId,
} from '@/lib/appleMusicSession'

export interface SessionStreamingMusicArgs {
  /** True while the timed session has remaining time &gt; 0 */
  sessionActive: boolean
  isPaused: boolean
}

/**
 * When a timed session is active, starts playback on the user’s chosen
 * service (Spotify Web Playback SDK + Web API, or Apple MusicKit) and
 * mirrors pause/resume to the session timer.
 */
export function useSessionStreamingMusic({
  sessionActive,
  isPaused,
}: SessionStreamingMusicArgs) {
  const {
    spotifyTokens,
    setSpotifyTokens,
    appleMusicUserToken,
    sessionStreamingDuringSessions,
    sessionMusicProvider,
    spotifySessionPlaylistUri,
    appleMusicSessionPlaylistUrl,
  } = useSettings()

  const hasAppleToken = Boolean(appleMusicUserToken)
  const hasSpotifyTokens = spotifyTokensValid(spotifyTokens)

  const spotifyWants =
    sessionStreamingDuringSessions &&
    hasSpotifyTokens &&
    (sessionMusicProvider === 'spotify' || sessionMusicProvider === 'auto')

  const appleWants =
    sessionStreamingDuringSessions &&
    hasAppleToken &&
    (sessionMusicProvider === 'apple' ||
      (sessionMusicProvider === 'auto' && !hasSpotifyTokens) ||
      (sessionMusicProvider === 'spotify' && !hasSpotifyTokens))

  const spotifyConnectWhen = sessionActive && spotifyWants

  const { ready, deviceId, error: spotifyPlayerError } = useSpotifyPlayer(
    spotifyConnectWhen
  )

  const spotifyLiveRef = useRef(false)
  const appleLiveRef = useRef(false)
  const startedSpotifyRef = useRef(false)
  const startedAppleRef = useRef(false)

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

  // ── Apple Music ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionActive || !appleWants || isPaused) return
    if (startedAppleRef.current) return

    let cancelled = false

    void (async () => {
      try {
        await initMusicKit()
        const mk = getMusicKit()
        if (cancelled || !mk?.isAuthorized) return

        const configured = normalizeAppleMusicPlaylistId(
          appleMusicSessionPlaylistUrl ?? undefined
        )
        let playlistId: string | null = configured
        if (!playlistId && appleMusicUserToken) {
          const ids = await fetchAppleLibraryPlaylistIds(appleMusicUserToken)
          if (ids.length > 0) {
            playlistId = ids[Math.floor(Math.random() * ids.length)]!
          }
        }
        if (!playlistId) return

        await mk.setQueue({ playlist: playlistId })
        await mk.player.play()
        if (cancelled) return
        startedAppleRef.current = true
        appleLiveRef.current = true
      } catch (e) {
        console.warn('[session music] Apple Music start failed:', e)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    sessionActive,
    appleWants,
    isPaused,
    appleMusicUserToken,
    appleMusicSessionPlaylistUrl,
  ])

  useEffect(() => {
    if (!sessionActive || !appleWants || !appleLiveRef.current) return

    const mk = getMusicKit()
    if (!mk) return

    try {
      if (isPaused) mk.player.pause()
      else void mk.player.play()
    } catch (e) {
      console.warn('[session music] Apple pause/resume:', e)
    }
  }, [isPaused, sessionActive, appleWants])

  useEffect(() => {
    if (sessionActive || !appleLiveRef.current) return
    appleLiveRef.current = false
    startedAppleRef.current = false

    const mk = getMusicKit()
    if (mk) {
      try {
        mk.player.pause()
      } catch {
        /* ignore */
      }
    }
  }, [sessionActive])

  useEffect(() => {
    if (!sessionActive) {
      startedAppleRef.current = false
    }
  }, [sessionActive])

  // Log SDK-level Spotify errors once for debugging (Premium, etc.)
  useEffect(() => {
    if (spotifyPlayerError) {
      console.warn('[session music]', spotifyPlayerError)
    }
  }, [spotifyPlayerError])
}
