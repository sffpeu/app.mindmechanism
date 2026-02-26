'use client'

import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FocusNodesDevToolProps {
  /** Current offset in degrees (e.g. +33 or -5). */
  value: number
  /** Called with new value when + or - is clicked (step is 1 degree). */
  onChange: (value: number) => void
}

/**
 * Dev tool: fixed bottom-right panel to adjust focus nodes position by degrees.
 * Plus/minus buttons change the offset by 1°; counter shows e.g. "+33 degrees".
 */
export function FocusNodesDevTool({ value, onChange }: FocusNodesDevToolProps) {
  const label = value >= 0 ? `+${value}` : `${value}`
  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-black/15 bg-white/95 px-3 py-2 shadow-lg backdrop-blur dark:border-white/15 dark:bg-black/80"
      aria-label="Focus nodes position (degrees)"
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-full"
        onClick={() => onChange(value - 1)}
        aria-label="Rotate focus nodes -1°"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="min-w-[7rem] text-center text-sm font-medium tabular-nums text-black/90 dark:text-white/90">
        {label} degrees
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-full"
        onClick={() => onChange(value + 1)}
        aria-label="Rotate focus nodes +1°"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
