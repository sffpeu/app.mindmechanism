'use client'

/**
 * Multi View 2 footer: heading left edge aligns with AppDock icon column;
 * colour toggle right edge aligns with DotNavigation dot column (see layoutGutters).
 */

import { MultiColourToggle, type ColourMode } from '@/components/MultiColourToggle'
import {
  VIEWPORT_INSET_LEFT_APP_DOCK_ICONS,
  VIEWPORT_INSET_RIGHT_CLOCK_DOT_ICONS,
} from '@/lib/layoutGutters'

export function MultiView2Overlay({
  colourMode,
  onColourChange,
  isDarkMode,
}: {
  colourMode: ColourMode
  onColourChange: (m: ColourMode) => void
  isDarkMode: boolean
}) {
  return (
    <>
      <div
        role="group"
        aria-label="Multiview title"
        style={{
          position: 'absolute',
          bottom: 16,
          left: VIEWPORT_INSET_LEFT_APP_DOCK_ICONS,
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
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

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: VIEWPORT_INSET_RIGHT_CLOCK_DOT_ICONS,
          zIndex: 9999,
          pointerEvents: 'auto',
        }}
      >
        <MultiColourToggle
          mode={colourMode}
          onChange={onColourChange}
          isDarkMode={isDarkMode}
        />
      </div>
    </>
  )
}
