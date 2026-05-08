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
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-1.5">
        <Button type="button" size="icon" variant={isPlaying ? 'default' : 'outline'} onClick={isPlaying ? onPause : onPlay}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button type="button" size="icon" variant="outline" onClick={onStop}>
          <Square className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={loop ? 'default' : 'outline'}
          onClick={() => onLoopChange(!loop)}
          className="gap-1"
        >
          <Repeat className="h-3.5 w-3.5" />
          Loop
        </Button>
      </div>

      <div className="h-6 w-px bg-black/15 dark:bg-white/15" />

      <div className="flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onBpmChange(bpm - 5)}>
          -5
        </Button>
        <div className="flex min-w-[80px] items-center gap-1.5">
          <Slider
            value={[bpm]}
            min={40}
            max={180}
            step={1}
            onValueChange={([v]) => onBpmChange(v)}
            className="w-20"
          />
          <span className="text-xs tabular-nums text-gray-500">{bpm} bpm</span>
        </div>
        <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onBpmChange(bpm + 5)}>
          +5
        </Button>
      </div>

      <div className="h-6 w-px bg-black/15 dark:bg-white/15" />

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-500">Steps</span>
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

      <div className="h-6 w-px bg-black/15 dark:bg-white/15" />

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-500">Source</span>
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
