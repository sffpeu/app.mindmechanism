/**
 * Fixed overlays beside vertical docks — edge geometry matches AppDock / DotNavigation shells.
 */

/** Left edge of AppDock chrome nearest the viewport (pl-3 + Dock mx-2). */
export const VIEWPORT_INSET_LEFT_NAV_OUTER = 'calc(0.75rem + 0.5rem)' as const

/** Right edge of clock DotNavigation chrome nearest the viewport (pr-2 + Dock mx-2). */
export const VIEWPORT_INSET_RIGHT_NAV_OUTER = 'calc(0.5rem + 0.5rem)' as const
