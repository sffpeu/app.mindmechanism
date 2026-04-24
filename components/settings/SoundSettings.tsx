'use client'

import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Volume2, VolumeX } from 'lucide-react'
import { useSettings } from '@/lib/hooks/useSettings'
import { clockTitles } from '@/lib/clockTitles'
import { cn } from '@/lib/utils'

const CLOCK_COUNT = 9

export function SoundSettings() {
  const {
    soundEnabled, setSoundEnabled,
    tonesEnabled, setTonesEnabled,
    toneVolume, setToneVolume,
    clockToneMuted, setClockToneMuted,
  } = useSettings()

  return (
    <div className="space-y-4">
      {/* ── UI Sound Effects ───────────────────────────────────────────── */}
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

      {/* ── Clock Breathing Tones ─────────────────────────────────────── */}
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
            {/* Master volume */}
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
                  min={0}
                  max={1}
                  step={0.01}
                  className="flex-1"
                  aria-label="Tone master volume"
                />
                <Volume2 className="h-4 w-4 shrink-0 text-gray-400" />
              </div>
            </div>

            {/* Per-clock mute */}
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
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                Tap a node to silence its tone without disabling all tones
              </p>
            </div>
          </>
        )}
      </Card>

      <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 px-2">
        Sound packs — curated audio environments composed from the node frequencies — are in development.
      </p>
    </div>
  )
}
