'use client'

import { Card } from '@/components/ui/card'
import { Lightbulb, WifiOff } from 'lucide-react'
import { CLOCK_HEX } from '@/lib/hueColors'
import { clockTitles } from '@/lib/clockTitles'

export function SmartHomeSettings() {
  return (
    <div className="space-y-4">

      {/* What this will do */}
      <Card className="p-4 bg-white/50 dark:bg-black/50 space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <p className="text-sm font-medium text-gray-900 dark:text-white">Responsive environment</p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          When you open a wheel page the room lighting transitions to that node's colour.
          Each wheel maps to its frequency hue — grounding the physical space in the same
          colour grammar as the MM.
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {CLOCK_HEX.map((hex, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] font-medium"
              style={{ backgroundColor: `${hex}22`, color: hex }}
            >
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: hex }} />
              {clockTitles[i]}
            </div>
          ))}
        </div>
      </Card>

      {/* Philips Hue — coming */}
      <Card className="p-4 bg-white/50 dark:bg-black/50 opacity-60">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Philips Hue</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                We are applying to Philips directly for developer partnership.
                Integration will ship once that is in place.
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 whitespace-nowrap shrink-0">
            Coming
          </span>
        </div>
      </Card>

      {/* IKEA — coming */}
      <Card className="p-4 bg-white/50 dark:bg-black/50 opacity-60">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">IKEA Dirigera</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Requires IKEA DIRIGERA hub. Integration in development.
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 whitespace-nowrap shrink-0">
            Coming
          </span>
        </div>
      </Card>

    </div>
  )
}
