'use client'

/**
 * Multi View 2 footer chrome: draggable heading + colour toggle.
 *
 * Positions persist in localStorage under STORAGE_KEY while you tune layout.
 * When placement looks right, tell the assistant to bake `{ heading, toggle }`
 * pixel offsets into code (and optionally clear localStorage for that key).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { GripVertical } from 'lucide-react'
import { MultiColourToggle, type ColourMode } from '@/components/MultiColourToggle'
import {
  VIEWPORT_INSET_LEFT_NAV_OUTER,
  VIEWPORT_INSET_RIGHT_NAV_OUTER,
} from '@/lib/layoutGutters'
import { cn } from '@/lib/utils'

export const MULTIVIEW2_OVERLAY_OFFSETS_STORAGE_KEY =
  'mindmechanism.multiview2.overlayOffsets.v1' as const

type Offset = { x: number; y: number }

type Stored = { heading: Offset; toggle: Offset }

const DEFAULT_OFFSETS: Stored = {
  heading: { x: 0, y: 0 },
  toggle: { x: 0, y: 0 },
}

function parseStored(raw: string | null): Stored {
  if (!raw) return DEFAULT_OFFSETS
  try {
    const p = JSON.parse(raw) as Partial<Stored>
    return {
      heading: {
        x: Number(p.heading?.x) || 0,
        y: Number(p.heading?.y) || 0,
      },
      toggle: {
        x: Number(p.toggle?.x) || 0,
        y: Number(p.toggle?.y) || 0,
      },
    }
  } catch {
    return DEFAULT_OFFSETS
  }
}

export function MultiView2Overlay({
  colourMode,
  onColourChange,
  isDarkMode,
}: {
  colourMode: ColourMode
  onColourChange: (m: ColourMode) => void
  isDarkMode: boolean
}) {
  const [offsets, setOffsets] = useState<Stored>(DEFAULT_OFFSETS)
  const dragRef = useRef<{
    target: keyof Stored
    pointerId: number
    startClientX: number
    startClientY: number
    origin: Offset
  } | null>(null)

  useEffect(() => {
    setOffsets(parseStored(localStorage.getItem(MULTIVIEW2_OVERLAY_OFFSETS_STORAGE_KEY)))
  }, [])

  const endDrag = useCallback(() => {
    dragRef.current = null
  }, [])

  const onPointerDown =
    (target: keyof Stored) => (e: React.PointerEvent) => {
      if (e.button !== 0) return
      e.preventDefault()
      const origin = offsets[target]
      dragRef.current = {
        target,
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        origin,
      }
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current
      if (!d || e.pointerId !== d.pointerId) return
      const dx = e.clientX - d.startClientX
      const dy = e.clientY - d.startClientY
      const nextOff = { x: d.origin.x + dx, y: d.origin.y + dy }
      setOffsets((prev) => ({ ...prev, [d.target]: nextOff }))
    },
    []
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current
      if (!d || e.pointerId !== d.pointerId) return
      try {
        ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      const dx = e.clientX - d.startClientX
      const dy = e.clientY - d.startClientY
      const nextOff = { x: d.origin.x + dx, y: d.origin.y + dy }
      setOffsets((prev) => {
        const next = { ...prev, [d.target]: nextOff }
        try {
          localStorage.setItem(MULTIVIEW2_OVERLAY_OFFSETS_STORAGE_KEY, JSON.stringify(next))
        } catch {
          /* ignore quota */
        }
        return next
      })
      endDrag()
    },
    [endDrag]
  )

  const headingStyle = {
    position: 'absolute' as const,
    bottom: 16,
    left: VIEWPORT_INSET_LEFT_NAV_OUTER,
    zIndex: 9999,
    transform: `translate(${offsets.heading.x}px, ${offsets.heading.y}px)`,
    cursor: 'grab' as const,
    touchAction: 'none' as const,
  }

  const toggleShellStyle = {
    position: 'absolute' as const,
    bottom: 16,
    right: VIEWPORT_INSET_RIGHT_NAV_OUTER,
    zIndex: 9999,
    display: 'flex' as const,
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
    gap: 6,
    transform: `translate(${offsets.toggle.x}px, ${offsets.toggle.y}px)`,
    touchAction: 'none' as const,
  }

  return (
    <>
      <div
        role="group"
        aria-label="Multiview title — drag to reposition"
        title="Drag to reposition"
        className={cn('pointer-events-auto select-none active:cursor-grabbing')}
        style={headingStyle}
        onPointerDown={onPointerDown('heading')}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div style={{ pointerEvents: 'none', textAlign: 'left' }}>
          <div
            style={{
              fontSize: 10,
              color: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              marginBottom: 4,
              fontWeight: 700,
            }}
          >
            The Mind Mechanism
          </div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 900,
              color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)',
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}
          >
            Multiview
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 9,
              color: isDarkMode ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            © 2026 Sean Fortune · All Rights Reserved
          </div>
        </div>
      </div>

      <div style={toggleShellStyle}>
        <button
          type="button"
          aria-label="Drag to reposition colour toggle"
          title="Drag to reposition"
          className={cn(
            'pointer-events-auto flex shrink-0 cursor-grab items-center justify-center rounded-md border border-transparent active:cursor-grabbing',
            'text-neutral-500 hover:border-white/15 hover:bg-white/5 hover:text-neutral-300',
            'dark:text-neutral-400 dark:hover:border-white/10 dark:hover:bg-white/5 dark:hover:text-neutral-200'
          )}
          style={{ padding: '4px 2px' }}
          onPointerDown={onPointerDown('toggle')}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
        <div className="pointer-events-auto">
          <MultiColourToggle
            mode={colourMode}
            onChange={onColourChange}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    </>
  )
}
