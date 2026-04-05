'use client'

import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  LAYERS_LARGE_BG_CLOCK_OPACITY_DEFAULT_PERCENT,
  useLayersDisplaySettings,
} from '@/lib/LayersDisplaySettingsContext'
import { Layers } from 'lucide-react'

export function LayersPageDisplaySettings() {
  const { largeBackgroundClockOpacityPercent, setLargeBackgroundClockOpacityPercent } =
    useLayersDisplaySettings()

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-1 flex items-center gap-2">
        <Layers className="h-6 w-6 shrink-0" />
        Layers page
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Adjust the large background clock that appears when you hover or focus a clock on the outer
        ring. The stacked clocks in the center are unchanged.
      </p>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="layers-large-bg-opacity" className="text-base font-medium shrink-0">
            Large background clock
          </Label>
          <output
            htmlFor="layers-large-bg-opacity"
            className="tabular-nums text-lg font-semibold text-gray-900 dark:text-gray-100 min-w-[3.5rem] text-right"
            aria-live="polite"
          >
            {largeBackgroundClockOpacityPercent}%
          </output>
        </div>
        <Slider
          id="layers-large-bg-opacity"
          min={0}
          max={100}
          step={1}
          value={[largeBackgroundClockOpacityPercent]}
          onValueChange={(v) =>
            setLargeBackgroundClockOpacityPercent(v[0] ?? LAYERS_LARGE_BG_CLOCK_OPACITY_DEFAULT_PERCENT)
          }
          className="py-1"
        />
      </div>
    </Card>
  )
}
