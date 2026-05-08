'use client'

import { Pause, Play, Repeat, Square } from 'lucide-react'
import type { StepCount } from '@/lib/sequencer'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="icon" onClick={isPlaying ? onPause : onPlay}>
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
          className="gap-1.5"
        >
          <Repeat className="h-4 w-4" />
          Loop
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>BPM</Label>
          <span className="text-sm tabular-nums">{bpm}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => onBpmChange(bpm - 5)}>
            -5
          </Button>
          <Slider
            value={[bpm]}
            min={40}
            max={180}
            step={1}
            onValueChange={([v]) => onBpmChange(v)}
          />
          <Button type="button" size="sm" variant="outline" onClick={() => onBpmChange(bpm + 5)}>
            +5
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Steps</Label>
        <div className="flex items-center gap-2">
          {[8, 16, 32].map((count) => (
            <Button
              key={count}
              type="button"
              size="sm"
              variant={stepCount === count ? 'default' : 'outline'}
              onClick={() => onStepCountChange(count as StepCount)}
            >
              {count}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Label>Source</Label>
        <Button
          type="button"
          size="sm"
          variant={toneMode === 'drone' ? 'default' : 'outline'}
          onClick={() => onToneModeChange('drone')}
        >
          Drone
        </Button>
        <Button
          type="button"
          size="sm"
          variant={toneMode === 'synthetic' ? 'default' : 'outline'}
          onClick={() => onToneModeChange('synthetic')}
        >
          Sine
        </Button>
        <div className="ml-auto inline-flex items-center gap-2">
          <Label htmlFor="loop-toggle" className="text-xs">
            Loop
          </Label>
          <Switch id="loop-toggle" checked={loop} onCheckedChange={onLoopChange} />
        </div>
      </div>
    </div>
  )
}
