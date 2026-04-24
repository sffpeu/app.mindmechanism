'use client'

import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Volume2, VolumeX, Music2, ShoppingBag, Lock } from 'lucide-react'
import { useSettings } from '@/lib/hooks/useSettings'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { clockTitles } from '@/lib/clockTitles'
import { cn } from '@/lib/utils'

const CLOCK_COUNT = 9

// Placeholder pack data — will come from a Firestore products collection
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

export function SoundSettings() {
  const {
    soundEnabled, setSoundEnabled,
    tonesEnabled, setTonesEnabled,
    toneVolume, setToneVolume,
    clockToneMuted, setClockToneMuted,
  } = useSettings()

  const { profile } = useAuth()
  const tier = profile?.tier ?? 'open'
  const hasStreamingAccess = tier === 'standard' || tier === 'sovereign'

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
              Sine tones derived from each wheel's symbolic Hz value —
              breathing with the clock glow on single-node pages
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
                Bring your own playlist. Connect Apple Music or Spotify and your
                library plays through sessions — your taste, the MM's structure.
              </p>
            </div>
          </div>
          {!hasStreamingAccess && <Lock className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />}
        </div>

        {hasStreamingAccess ? (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {[
              { label: 'Apple Music', icon: (
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden><path d="M23.994 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 0 0-1.877-.726 10.496 10.496 0 0 0-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208c-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.802.42.127.856.187 1.293.228.497.044.995.06 1.494.065h11.22c.54-.005 1.075-.047 1.61-.1.386-.04.772-.1 1.148-.213 1.357-.384 2.366-1.17 3.005-2.417.38-.754.487-1.566.535-2.39.01-.14.014-.28.018-.42V6.124zm-6.954 1.976l-5.8 3.35a.776.776 0 0 1-1.172-.668V4.6a.776.776 0 0 1 1.173-.668l5.8 3.348a.776.776 0 0 1 0 1.82z"/></svg>
              )},
              { label: 'Spotify', icon: (
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-[#1DB954]" aria-hidden><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
              )},
            ].map(({ label, icon }) => (
              <button key={label} type="button" disabled
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 py-2.5 px-3 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60">
                {icon}
                {label}
                <span className="text-[10px] text-gray-400 ml-auto">Soon</span>
              </button>
            ))}
          </div>
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
