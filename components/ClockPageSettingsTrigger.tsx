'use client'

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementRef,
} from 'react'
import { Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu'

export type ClockPageSettingsTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  clockHex: string
}

type DropdownContentProps = ComponentPropsWithoutRef<typeof DropdownMenuContent> & {
  clockHex: string
}

/**
 * Compact settings control: small icon, clock-tinted border/background and icon always visible; stronger on hover.
 */
export const ClockPageSettingsTrigger = forwardRef<HTMLButtonElement, ClockPageSettingsTriggerProps>(
  function ClockPageSettingsTrigger({ clockHex, className, onMouseEnter, onMouseLeave, style, ...rest }, ref) {
    const base: CSSProperties = {
      borderColor: `${clockHex}cc`,
      backgroundColor: `${clockHex}1f`,
    }

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'rounded-md border-2 p-0.5 backdrop-blur-sm transition-[border-color,background-color,box-shadow] duration-200',
          'shadow-sm dark:shadow-black/30',
          className
        )}
        style={{ ...base, ...style }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = clockHex
          e.currentTarget.style.backgroundColor = `${clockHex}38`
          e.currentTarget.style.boxShadow = `0 0 0 1px ${clockHex}55, 0 4px 14px -2px ${clockHex}44`
          const svg = e.currentTarget.querySelector('svg')
          if (svg) (svg as SVGSVGElement).style.color = clockHex
          onMouseEnter?.(e)
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = `${clockHex}cc`
          e.currentTarget.style.backgroundColor = `${clockHex}1f`
          e.currentTarget.style.boxShadow = ''
          const svg = e.currentTarget.querySelector('svg')
          if (svg) (svg as SVGSVGElement).style.color = clockHex
          onMouseLeave?.(e)
        }}
        {...rest}
      >
        <Settings
          className="h-2 w-2 shrink-0 transition-colors duration-200"
          style={{ color: clockHex }}
          aria-hidden
        />
      </button>
    )
  }
)

/**
 * Small clock-colored dropdown panel for Satellites / Focus Words (overflow visible so labels are not clipped).
 */
export const ClockPageDropdownMenuContent = forwardRef<
  ElementRef<typeof DropdownMenuContent>,
  DropdownContentProps
>(function ClockPageDropdownMenuContent({ clockHex, className, style, children, ...rest }, ref) {
  return (
    <DropdownMenuContent
      ref={ref}
      align="end"
      sideOffset={6}
      className={cn(
        'z-[400] min-w-[11rem] max-w-[min(calc(100vw-1.5rem),16rem)] overflow-visible py-1',
        'border-2 bg-white/96 text-[11px] leading-tight shadow-xl backdrop-blur-md',
        'dark:bg-black/92 dark:text-white',
        className
      )}
      style={{
        borderColor: clockHex,
        boxShadow: `0 10px 28px -6px ${clockHex}40, 0 4px 12px -4px rgba(0,0,0,0.12)`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </DropdownMenuContent>
  )
})

ClockPageDropdownMenuContent.displayName = 'ClockPageDropdownMenuContent'
