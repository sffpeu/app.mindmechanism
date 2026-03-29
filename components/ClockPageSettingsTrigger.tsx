'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ClockPageSettingsTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  clockHex: string
}

/**
 * Compact settings control for clock node pages: half-size icon, clock-colored border/background on hover.
 */
export const ClockPageSettingsTrigger = forwardRef<HTMLButtonElement, ClockPageSettingsTriggerProps>(
  function ClockPageSettingsTrigger({ clockHex, className, onMouseEnter, onMouseLeave, ...rest }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'p-1 rounded-md bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-black/5 dark:border-white/10 transition-[border-color,background-color,color] duration-200',
          className
        )}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = clockHex
          e.currentTarget.style.backgroundColor = `${clockHex}22`
          const svg = e.currentTarget.querySelector('svg')
          if (svg) (svg as SVGSVGElement).style.color = clockHex
          onMouseEnter?.(e)
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = ''
          e.currentTarget.style.backgroundColor = ''
          const svg = e.currentTarget.querySelector('svg')
          if (svg) (svg as SVGSVGElement).style.color = ''
          onMouseLeave?.(e)
        }}
        {...rest}
      >
        <Settings className="h-2.5 w-2.5 text-gray-700 dark:text-gray-300 transition-colors duration-200" aria-hidden />
      </button>
    )
  }
)
