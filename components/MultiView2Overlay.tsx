'use client'

/**
 * Multi View 2 footer: heading + colour toggle, anchored to outer dock gutters + translate.
 *
 * Hydrates one-shot from localStorage if present (tuning from draggable builds); falls back to
 * MULTIVIEW2_OVERLAY_OFFSETS_BASE. To bake permanently, paste saved JSON into
 * lib/multiView2OverlayOffsets.ts as MULTIVIEW2_OVERLAY_OFFSETS_BASE.
 */

import { useEffect, useState } from 'react'
import { MultiColourToggle, type ColourMode } from '@/components/MultiColourToggle'
import {
  VIEWPORT_INSET_LEFT_NAV_OUTER,
  VIEWPORT_INSET_RIGHT_NAV_OUTER,
} from '@/lib/layoutGutters'
import {
  MULTIVIEW2_OVERLAY_OFFSETS_BASE,
  type MultiView2OverlayOffsets,
} from '@/lib/multiView2OverlayOffsets'

export const MULTIVIEW2_OVERLAY_OFFSETS_STORAGE_KEY =
  'mindmechanism.multiview2.overlayOffsets.v1' as const

function parseStored(raw: string | null): MultiView2OverlayOffsets | null {
  if (!raw) return null
  try {
    const p = JSON.parse(raw) as Partial<MultiView2OverlayOffsets>
    const heading = p.heading
    const toggle = p.toggle
    if (
      typeof heading?.x !== 'number' ||
      typeof heading?.y !== 'number' ||
      typeof toggle?.x !== 'number' ||
      typeof toggle?.y !== 'number'
    ) {
      return null
    }
    return { heading: { x: heading.x, y: heading.y }, toggle: { x: toggle.x, y: toggle.y } }
  } catch {
    return null
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
  const [offsets, setOffsets] = useState<MultiView2OverlayOffsets>(MULTIVIEW2_OVERLAY_OFFSETS_BASE)

  useEffect(() => {
    const parsed = parseStored(localStorage.getItem(MULTIVIEW2_OVERLAY_OFFSETS_STORAGE_KEY))
    if (parsed) setOffsets(parsed)
  }, [])

  const headingStyle = {
    position: 'absolute' as const,
    bottom: 16,
    left: VIEWPORT_INSET_LEFT_NAV_OUTER,
    zIndex: 9999,
    transform: `translate(${offsets.heading.x}px, ${offsets.heading.y}px)`,
    pointerEvents: 'none' as const,
  }

  const toggleStyle = {
    position: 'absolute' as const,
    bottom: 16,
    right: VIEWPORT_INSET_RIGHT_NAV_OUTER,
    zIndex: 9999,
    transform: `translate(${offsets.toggle.x}px, ${offsets.toggle.y}px)`,
    pointerEvents: 'auto' as const,
  }

  return (
    <>
      <div role="group" aria-label="Multiview title" style={headingStyle}>
        <div style={{ textAlign: 'left' }}>
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

      <div style={toggleStyle}>
        <MultiColourToggle
          mode={colourMode}
          onChange={onColourChange}
          isDarkMode={isDarkMode}
        />
      </div>
    </>
  )
}
