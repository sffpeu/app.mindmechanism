'use client'

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementRef,
  type ReactNode,
} from 'react'
import { Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DropdownMenuContent } from '@/components/ui/dropdown-menu'

export type ClockPageSettingsTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  clockHex: string
}

type ChromeButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  clockHex: string
  children: ReactNode
}

function chromeButtonBaseStyle(clockHex: string): CSSProperties {
  return {
    borderColor: clockHex,
    backgroundColor: `${clockHex}4d`,
    color: clockHex,
  }
}

/**
 * Small clock-colored control (gear). Menu panel is neutral — only this button uses clock color.
 */
export const ClockPageSettingsTrigger = forwardRef<HTMLButtonElement, ClockPageSettingsTriggerProps>(
  function ClockPageSettingsTrigger({ clockHex, className, onMouseEnter, onMouseLeave, style, ...rest }, ref) {
    const base = chromeButtonBaseStyle(clockHex)

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border p-0 backdrop-blur-sm transition-[filter,opacity,transform] duration-150',
          'hover:brightness-110 active:scale-95 dark:hover:brightness-125',
          className
        )}
        style={{ ...base, ...style }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = `${clockHex}85`
          onMouseEnter?.(e)
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = `${clockHex}4d`
          onMouseLeave?.(e)
        }}
        {...rest}
      >
        <Settings className="h-2.5 w-2.5 shrink-0" style={{ color: 'currentColor' }} aria-hidden />
      </button>
    )
  }
)

/**
 * Same compact clock-colored chrome as settings (e.g. Info button).
 */
export const ClockPageIconButton = forwardRef<HTMLButtonElement, ChromeButtonProps>(
  function ClockPageIconButton({ clockHex, className, children, onMouseEnter, onMouseLeave, style, ...rest }, ref) {
    const base = chromeButtonBaseStyle(clockHex)

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border p-0 backdrop-blur-sm transition-[filter,opacity,transform] duration-150',
          'hover:brightness-110 active:scale-95 dark:hover:brightness-125',
          className
        )}
        style={{ ...base, ...style }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = `${clockHex}85`
          onMouseEnter?.(e)
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = `${clockHex}4d`
          onMouseLeave?.(e)
        }}
        {...rest}
      >
        {children}
      </button>
    )
  }
)

type MenuContentProps = ComponentPropsWithoutRef<typeof DropdownMenuContent>

/**
 * Compact settings menu only — no clock tint on the panel (neutral popover).
 */
export const ClockPageMenuContent = forwardRef<ElementRef<typeof DropdownMenuContent>, MenuContentProps>(
  function ClockPageMenuContent({ className, children, ...rest }, ref) {
    return (
      <DropdownMenuContent
        ref={ref}
        align="end"
        sideOffset={6}
        className={cn(
          'z-[400] min-w-[11rem] max-w-[min(calc(100vw-1.5rem),16rem)] overflow-visible py-1 text-[11px] leading-tight',
          className
        )}
        {...rest}
      >
        {children}
      </DropdownMenuContent>
    )
  }
)

ClockPageMenuContent.displayName = 'ClockPageMenuContent'
ClockPageSettingsTrigger.displayName = 'ClockPageSettingsTrigger'
ClockPageIconButton.displayName = 'ClockPageIconButton'
