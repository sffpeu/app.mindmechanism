'use client'

import { Pause, Play, Repeat, Square } from 'lucide-react'
import type { StepCount } from '@/lib/sequencer'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

type Props = {
  isPlaying: boolean
  bpm: number
  stepCount: StepCount
  loop: boolean
  toneMode: 'drone' | 'synthetic'
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onBpmChange: (bpm: number) => void
  onStepCountChange: (count: StepCount) => void
  onLoopChange: (loop: boolean) => void
  onToneModeChange: (mode: 'drone' | 'synthetic') => void
}

const SEP = <div className="h-5 w-px shrink-0 bg-black/12 dark:bg-white/12" />

export function SequencerControls({
  isPlaying,
  bpm,
  stepCount,
  loop,
  toneMode,
  onPlay,
  onPause,
  onStop,
  onBpmChange,
  onStepCountChange,
  onLoopChange,
  onToneModeChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">

      {/* Transport */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant={isPlaying ? 'default' : 'outline'}
          className="h-8 w-8"
          onClick={isPlaying ? onPause : onPlay}
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </Button>
        <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={onStop}>
          <Square className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={loop ? 'default' : 'outline'}
          className="h-8 gap-1 px-2.5"
          onClick={() => onLoopChange(!loop)}
        >
          <Repeat className="h-3.5 w-3.5" />
          <span className="text-xs">Loop</span>
        </Button>
      </div>

      {SEP}

      {/* BPM */}
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          className="h-7 px-2 text-xs"
          onClick={() => onBpmChange(bpm - 5)}
        >
          −5
        </Button>
        <Slider
          value={[bpm]}
          min={40}
          max={180}
          step={1}
          onValueChange={([v]) => onBpmChange(v)}
          className="w-24"
        />
        <Button
          type="button"
          variant="outline"
          className="h-7 px-2 text-xs"
          onClick={() => onBpmChange(bpm + 5)}
        >
          +5
        </Button>
        <span className="w-14 text-xs tabular-nums text-gray-500 dark:text-gray-400">
          {bpm} bpm
        </span>
      </div>

      {SEP}

      {/* Steps */}
      <div className="flex items-center gap-1">
        <span className="mr-1 text-xs text-gray-500 dark:text-gray-400">Steps</span>
        {([8, 16, 32] as StepCount[]).map((count) => (
          <Button
            key={count}
            type="button"
            size="sm"
            variant={stepCount === count ? 'default' : 'outline'}
            className="h-7 px-2.5 text-xs"
            onClick={() => onStepCountChange(count)}
          >
            {count}
          </Button>
        ))}
      </div>

      {SEP}

      {/* Source */}
      <div className="flex items-center gap-1">
        <span className="mr-1 text-xs text-gray-500 dark:text-gray-400">Source</span>
        <Button
          type="button"
          size="sm"
          variant={toneMode === 'drone' ? 'default' : 'outline'}
          className="h-7 px-2.5 text-xs"
          onClick={() => onToneModeChange('drone')}
        >
          Drone
        </Button>
        <Button
          type="button"
          size="sm"
          variant={toneMode === 'synthetic' ? 'default' : 'outline'}
          className="h-7 px-2.5 text-xs"
          onClick={() => onToneModeChange('synthetic')}
        >
          Sine
        </Button>
      </div>

    </div>
  )
}
