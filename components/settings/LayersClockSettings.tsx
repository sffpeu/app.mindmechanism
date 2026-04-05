'use client'

import { useLayersClockIntensity } from '@/app/LayersClockIntensityContext'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Layers } from 'lucide-react'

export function LayersClockSettings() {
  const { layersClockIntensity, setLayersClockIntensity } = useLayersClockIntensity()
  const percent = Math.round(layersClockIntensity * 100)

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-1 flex items-center gap-2">
        <Layers className="h-6 w-6 shrink-0" />
        Layers view
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Adjust how strong the stacked clock background and the large hover clock appear on the Layers page.
      </p>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="layers-clock-intensity" className="text-sm font-medium">
            Clock intensity
          </Label>
          <span className="text-sm tabular-nums text-gray-600 dark:text-gray-400">{percent}%</span>
        </div>
        <Slider
          id="layers-clock-intensity"
          value={[percent]}
          min={0}
          max={100}
          step={1}
          onValueChange={(v) => setLayersClockIntensity((v[0] ?? 0) / 100)}
          className="w-full"
        />
      </div>
    </Card>
  )
}
