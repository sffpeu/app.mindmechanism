'use client'

import { useState, useRef, type ReactNode } from 'react'

export type SatelliteNameLabelProps = {
  name?: string | null
  children: ReactNode
  /** Smaller type for tiny dots (e.g. multiview) */
  compact?: boolean
  className?: string
}

/**
 * Shows satellite name on mouse/pen hover. On touch, shows while the finger is down;
 * pointer capture keeps the tooltip stable if the finger moves slightly off the dot.
 */
export function SatelliteNameLabel({ name, children, compact, className }: SatelliteNameLabelProps) {
  const [visible, setVisible] = useState(false)
  const touchActiveRef = useRef(false)

  const trimmed = name?.trim()
  if (!trimmed) {
    return <>{children}</>
  }

  const textClass = compact
    ? 'max-w-[min(180px,65vw)] truncate text-center text-[10px] font-medium text-black dark:text-white'
    : 'max-w-[min(220px,75vw)] truncate text-center text-xs font-medium text-black dark:text-white'

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center touch-manipulation ${className ?? ''}`}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
          setVisible(true)
        }
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
          setVisible(false)
        }
        if (e.pointerType === 'touch' && !touchActiveRef.current) {
          setVisible(false)
        }
      }}
      onPointerDown={(e) => {
        if (e.pointerType === 'touch') {
          touchActiveRef.current = true
          setVisible(true)
          try {
            e.currentTarget.setPointerCapture(e.pointerId)
          } catch {
            /* capture unsupported */
          }
        }
      }}
      onPointerUp={(e) => {
        if (e.pointerType === 'touch' && touchActiveRef.current) {
          touchActiveRef.current = false
          setVisible(false)
          try {
            e.currentTarget.releasePointerCapture(e.pointerId)
          } catch {
            /* */
          }
        }
      }}
      onPointerCancel={(e) => {
        if (e.pointerType === 'touch') {
          touchActiveRef.current = false
          setVisible(false)
        }
      }}
    >
      {visible ? (
        <div
          className={`pointer-events-auto absolute bottom-full left-1/2 z-[80] mb-0.5 -translate-x-1/2 whitespace-nowrap ${textClass}`}
          role="tooltip"
        >
          {trimmed}
        </div>
      ) : null}
      {children}
    </div>
  )
}
