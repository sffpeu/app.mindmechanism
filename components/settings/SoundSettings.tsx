'use client'

import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Volume2, VolumeX, Music2, ShoppingBag, Lock,
  CheckCircle2, Loader2, AlertCircle, LogOut, Play, Square,
} from 'lucide-react'
import { useSettings } from '@/lib/hooks/useSettings'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { clockTitles } from '@/lib/clockTitles'
import { MM_DRONE_PATH, MM_DRONE_PLANET_LABELS } from '@/lib/mmDroneTones'
import { cn } from '@/lib/utils'
import { startSpotifyAuth, spotifyTokensValid } from '@/lib/spotify'
import { authorizeAppleMusic, unauthorizeAppleMusic } from '@/lib/appleMusicKit'
import { useState, useCallback, useEffect, useRef } from 'react'

const CLOCK_COUNT = 9

const SOUND_PACKS = [
  {
    id: 'mm-foundations',
    name: 'MM Foundations',
    description: 'Nine compositions — one per node — scored to exact symbolic Hz values. The default MM soundscape.',
    price: null,
    free: true,
    available: false,
  },
  {
    id: 'mm-deep-work',
    name: 'Deep Work',
    description: 'Extended binaural sessions built from node frequencies. For sustained focus and study.',
    price: '$4.99',
    free: false,
    available: false,
  },
  {
    id: 'mm-restoration',
    name: 'Restoration',
    description: 'Slower, ambient compositions for wind-down and reflection sessions.',
    price: '$4.99',
    free: false,
    available: false,
  },
  {
    id: 'mm-activation',
    name: 'Activation',
    description: 'Higher-energy sessions — movement, motivation, morning practice.',
    price: '$4.99',
    free: false,
    available: false,
  },
]

// ── Service connect button ────────────────────────────────────────────────────

type ConnectState = 'idle' | 'connecting' | 'connected' | 'error'

function ServiceButton({
  label,
  icon,
  state,
  errorMsg,
  onConnect,
  onDisconnect,
}: {
  label: string
  icon: React.ReactNode
  state: ConnectState
  errorMsg?: string
  onConnect: () => void
  onDisconnect: () => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={state === 'connected' ? onDisconnect : onConnect}
        disabled={state === 'connecting'}
        className={cn(
          'flex items-center justify-between gap-2 rounded-lg border py-2.5 px-3 text-sm transition-colors w-full',
          state === 'connected'
            ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
            : state === 'error'
            ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 text-red-600 dark:text-red-400'
            : 'border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60',
          state === 'connecting' && 'opacity-60 cursor-not-allowed'
        )}
      >
        <span className="flex items-center gap-2">
          {icon}
          {label}
        </span>
        {state === 'connecting' && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />}
        {state === 'connected' && (
          <span className="flex items-center gap-1 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <LogOut className="h-3 w-3 opacity-60" />
          </span>
        )}
        {state === 'error' && <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
        {state === 'idle' && <span className="text-[10px] text-gray-400 shrink-0">Connect</span>}
      </button>
      {state === 'error' && errorMsg && (
        <p className="text-[10px] text-red-500 dark:text-red-400 px-0.5">{errorMsg}</p>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function SoundSettings() {
  const {
    soundEnabled, setSoundEnabled,
    tonesEnabled, setTonesEnabled,
    toneVolume, setToneVolume,
    clockToneMuted, setClockToneMuted,
    toneMode, setToneMode,
    droneClockGain, setDroneClockGain,
    spotifyTokens, setSpotifyTokens,
    appleMusicUserToken, setAppleMusicUserToken,
    sessionStreamingDuringSessions, setSessionStreamingDuringSessions,
    sessionMusicProvider, setSessionMusicProvider,
    spotifySessionPlaylistUri, setSpotifySessionPlaylistUri,
    appleMusicSessionPlaylistUrl, setAppleMusicSessionPlaylistUrl,
  } = useSettings()

  const { profile } = useAuth()
  const tier = profile?.tier ?? 'open'
  const hasStreamingAccess = tier === 'standard' || tier === 'sovereign'

  // Spotify
  const [spotifyState, setSpotifyState] = useState<ConnectState>(
    spotifyTokensValid(spotifyTokens) ? 'connected' : 'idle'
  )
  const [spotifyError, setSpotifyError] = useState<string | undefined>()

  const connectSpotify = useCallback(() => {
    setSpotifyState('connecting')
    setSpotifyError(undefined)
    try {
      // startSpotifyAuth() redirects — state changes won't matter after this
      startSpotifyAuth().catch((err: unknown) => {
        setSpotifyState('error')
        setSpotifyError(err instanceof Error ? err.message : 'Could not start Spotify auth')
      })
    } catch (err) {
      setSpotifyState('error')
      setSpotifyError(err instanceof Error ? err.message : 'Could not start Spotify auth')
    }
  }, [])

  const disconnectSpotify = useCallback(() => {
    setSpotifyTokens(null)
    setSpotifyState('idle')
  }, [setSpotifyTokens])

  // Apple Music
  const [appleState, setAppleState] = useState<ConnectState>(
    appleMusicUserToken ? 'connected' : 'idle'
  )
  const [appleError, setAppleError] = useState<string | undefined>()

  const connectAppleMusic = useCallback(async () => {
    setAppleState('connecting')
    setAppleError(undefined)
    try {
      const userToken = await authorizeAppleMusic()
      setAppleMusicUserToken(userToken)
      setAppleState('connected')
    } catch (err) {
      setAppleState('error')
      setAppleError(err instanceof Error ? err.message : 'Apple Music authorisation failed')
    }
  }, [setAppleMusicUserToken])

  const disconnectAppleMusic = useCallback(async () => {
    try {
      await unauthorizeAppleMusic()
    } catch {
      // best-effort
    }
    setAppleMusicUserToken(null)
    setAppleState('idle')
  }, [setAppleMusicUserToken])

  useEffect(() => {
    setSpotifyState(spotifyTokensValid(spotifyTokens) ? 'connected' : 'idle')
  }, [spotifyTokens])

  useEffect(() => {
    setAppleState(appleMusicUserToken ? 'connected' : 'idle')
  }, [appleMusicUserToken])

  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

  const stopDronePreview = useCallback(() => {
    const a = previewAudioRef.current
    if (a) {
      a.pause()
      a.currentTime = 0
      previewAudioRef.current = null
    }
    setPreviewIndex(null)
  }, [])

  const toggleDronePreview = useCallback(
    (i: number) => {
      if (previewIndex === i) {
        stopDronePreview()
        return
      }
      stopDronePreview()
      const a = new Audio(MM_DRONE_PATH(i))
      const g = droneClockGain[i] ?? 1
      a.volume = Math.min(1, Math.max(0, toneVolume * g * 0.9))
      a.onended = () => {
        previewAudioRef.current = null
        setPreviewIndex(null)
      }
      previewAudioRef.current = a
      setPreviewIndex(i)
      void a.play().catch(() => {
        previewAudioRef.current = null
        setPreviewIndex(null)
      })
    },
    [previewIndex, toneVolume, droneClockGain, stopDronePreview]
  )

  useEffect(() => {
    const a = previewAudioRef.current
    if (a && previewIndex != null) {
      const g = droneClockGain[previewIndex] ?? 1
      a.volume = Math.min(1, Math.max(0, toneVolume * g * 0.9))
    }
  }, [toneVolume, droneClockGain, previewIndex])

  useEffect(() => {
    return () => {
      stopDronePreview()
    }
  }, [stopDronePreview])

  useEffect(() => {
    if (toneMode !== 'drone') stopDronePreview()
  }, [toneMode, stopDronePreview])

  return (
    <div className="space-y-4">

      {/* ── Interface sounds ──────────────────────────────────────────── */}
      <Card className="p-4 bg-white/50 dark:bg-black/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Interface sounds</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Button clicks, session start, step tones
            </p>
          </div>
          <Switch
            checked={soundEnabled}
            onCheckedChange={setSoundEnabled}
            aria-label="Toggle interface sounds"
          />
        </div>
      </Card>

      {/* ── Node frequencies ──────────────────────────────────────────── */}
      <Card className="p-4 bg-white/50 dark:bg-black/50 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Node frequencies</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Breathing with the clock glow on single-node pages — classic sine
              Hz or planet drone loops; set levels and preview each wheel here
            </p>
          </div>
          <Switch
            checked={tonesEnabled}
            onCheckedChange={setTonesEnabled}
            aria-label="Toggle node frequency tones"
          />
        </div>

        {tonesEnabled && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-600 dark:text-gray-400">Master volume</Label>
                <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                  {Math.round(toneVolume * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <VolumeX className="h-4 w-4 shrink-0 text-gray-400" />
                <Slider
                  value={[toneVolume]}
                  onValueChange={([v]) => setToneVolume(v)}
                  min={0} max={1} step={0.01}
                  className="flex-1"
                  aria-label="Tone master volume"
                />
                <Volume2 className="h-4 w-4 shrink-0 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2 pt-1 border-t border-gray-200 dark:border-gray-800">
              <Label className="text-xs text-gray-600 dark:text-gray-400">Tone source</Label>
              <RadioGroup
                value={toneMode}
                onValueChange={(v) => setToneMode(v as 'synthetic' | 'drone')}
                className="flex flex-col gap-2"
              >
                <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                  <RadioGroupItem value="drone" id="tone-drone" />
                  <span>Planet drones (MM recordings)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                  <RadioGroupItem value="synthetic" id="tone-synth" />
                  <span>Synthetic sine (symbolic Hz)</span>
                </label>
              </RadioGroup>
            </div>

            {toneMode === 'drone' && (
              <div className="space-y-2 pt-1 border-t border-gray-200 dark:border-gray-800">
                <Label className="text-xs text-gray-600 dark:text-gray-400">
                  Per-wheel drone level & preview
                </Label>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  Tap play to hear that wheel’s drone at your current master volume and level.
                  On the clock page the same sample loops with the breathing glow.
                </p>
                <div className="space-y-2 max-h-[min(52vh,22rem)] overflow-y-auto overscroll-contain pr-1">
                  {Array.from({ length: CLOCK_COUNT }).map((_, i) => {
                    const gain = droneClockGain[i] ?? 1
                    const playing = previewIndex === i
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/30 px-2 py-1.5"
                      >
                        <button
                          type="button"
                          onClick={() => toggleDronePreview(i)}
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors',
                            playing
                              ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-black'
                              : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800'
                          )}
                          aria-label={playing ? `Stop preview for wheel ${i + 1}` : `Preview drone for wheel ${i + 1}`}
                        >
                          {playing ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 pl-0.5" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 truncate">
                            {clockTitles[i]}
                          </p>
                          <p className="text-[11px] text-gray-800 dark:text-gray-200 truncate">
                            {MM_DRONE_PLANET_LABELS[i]}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] tabular-nums text-gray-500 w-8 shrink-0">
                              {Math.round(gain * 100)}%
                            </span>
                            <Slider
                              value={[gain]}
                              onValueChange={([v]) => setDroneClockGain(i, v)}
                              min={0}
                              max={2}
                              step={0.02}
                              className="flex-1"
                              aria-label={`Drone level for ${clockTitles[i]}`}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs text-gray-600 dark:text-gray-400">Per-node mute</Label>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: CLOCK_COUNT }).map((_, i) => {
                  const muted = clockToneMuted[i] ?? false
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setClockToneMuted(i, !muted)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-lg border py-2 px-1.5 text-center transition-colors',
                        muted
                          ? 'border-gray-200 dark:border-gray-700 bg-gray-100/60 dark:bg-gray-800/40 opacity-50'
                          : 'border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/40 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                      )}
                      aria-label={`${muted ? 'Unmute' : 'Mute'} ${clockTitles[i]}`}
                      aria-pressed={muted}
                    >
                      <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 leading-tight">
                        {clockTitles[i]}
                      </span>
                      {muted
                        ? <VolumeX className="h-3 w-3 text-gray-400" />
                        : <Volume2 className="h-3 w-3 text-gray-500 dark:text-gray-300" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </Card>

      {/* ── Your music ────────────────────────────────────────────────── */}
      <Card className={cn('p-4 bg-white/50 dark:bg-black/50 space-y-3', !hasStreamingAccess && 'opacity-70')}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <Music2 className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Your music</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                Connect your streaming service — your playlists play through
                sessions. Your taste, the MM's structure.
              </p>
            </div>
          </div>
          {!hasStreamingAccess && <Lock className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />}
        </div>

        {hasStreamingAccess ? (
          <>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <ServiceButton
                label="Apple Music"
                icon={
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current shrink-0" aria-hidden>
                    <path d="M23.994 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 0 0-1.877-.726 10.496 10.496 0 0 0-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208c-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.802.42.127.856.187 1.293.228.497.044.995.06 1.494.065h11.22c.54-.005 1.075-.047 1.61-.1.386-.04.772-.1 1.148-.213 1.357-.384 2.366-1.17 3.005-2.417.38-.754.487-1.566.535-2.39.01-.14.014-.28.018-.42V6.124zm-6.954 1.976l-5.8 3.35a.776.776 0 0 1-1.172-.668V4.6a.776.776 0 0 1 1.173-.668l5.8 3.348a.776.776 0 0 1 0 1.82z"/>
                  </svg>
                }
                state={appleState}
                errorMsg={appleError}
                onConnect={connectAppleMusic}
                onDisconnect={disconnectAppleMusic}
              />
              <ServiceButton
                label="Spotify"
                icon={
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-[#1DB954] shrink-0" aria-hidden>
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                }
                state={spotifyState}
                errorMsg={spotifyError}
                onConnect={connectSpotify}
                onDisconnect={disconnectSpotify}
              />
            </div>

            <div className="pt-3 mt-1 border-t border-gray-200 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white">During timed sessions</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    Shuffle-play from a playlist when the session timer runs. Pausing the timer pauses playback.
                  </p>
                </div>
                <Switch
                  checked={sessionStreamingDuringSessions}
                  onCheckedChange={setSessionStreamingDuringSessions}
                  aria-label="Play streaming music during timed sessions"
                />
              </div>

              {sessionStreamingDuringSessions && (
                <div className="space-y-3 pl-0.5">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Preferred service
                    </Label>
                    <RadioGroup
                      value={sessionMusicProvider}
                      onValueChange={(v) =>
                        setSessionMusicProvider(v as 'auto' | 'spotify' | 'apple')
                      }
                      className="flex flex-col gap-2"
                    >
                      {(
                        [
                          ['auto', 'Automatic (Spotify if connected, otherwise Apple Music)'],
                          ['spotify', 'Spotify'],
                          ['apple', 'Apple Music'],
                        ] as const
                      ).map(([value, label]) => (
                        <label
                          key={value}
                          className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer"
                        >
                          <RadioGroupItem value={value} id={`mm-music-${value}`} />
                          <span>{label}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="spotify-pl" className="text-[10px] text-gray-500 dark:text-gray-400">
                      Spotify playlist (optional)
                    </Label>
                    <Input
                      id="spotify-pl"
                      placeholder="Open in Spotify URL, spotify:playlist:…, or ID"
                      value={spotifySessionPlaylistUri ?? ''}
                      onChange={(e) =>
                        setSpotifySessionPlaylistUri(e.target.value.trim() || null)
                      }
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="apple-pl" className="text-[10px] text-gray-500 dark:text-gray-400">
                      Apple Music playlist (optional)
                    </Label>
                    <Input
                      id="apple-pl"
                      placeholder="Share link or pl.… / p.… id — else a library playlist"
                      value={appleMusicSessionPlaylistUrl ?? ''}
                      onChange={(e) =>
                        setAppleMusicSessionPlaylistUrl(e.target.value.trim() || null)
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Available on Standard and Sovereign membership.
          </p>
        )}
      </Card>

      {/* ── MM Sound Packs ────────────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-0.5">
          MM Sound Packs
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 px-0.5 leading-relaxed">
          Original music composed from the nine node frequencies.
          Available to all members — no subscription required.
        </p>
        <div className="space-y-2">
          {SOUND_PACKS.map((pack) => (
            <Card key={pack.id} className="p-3 bg-white/50 dark:bg-black/50 opacity-70">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  <ShoppingBag className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{pack.name}</span>
                      {pack.free && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wide">
                          Included
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                      {pack.description}
                    </p>
                  </div>
                </div>
                <button type="button" disabled
                  className="shrink-0 rounded-md border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs text-gray-500 dark:text-gray-400 cursor-not-allowed whitespace-nowrap">
                  {pack.free ? 'Coming' : pack.price}
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

    </div>
  )
}
