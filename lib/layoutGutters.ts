/**
 * Fixed overlays that sit beside vertical docks — match AppDock / DotNavigation geometry.
 */

/** Past AppDock rail: outer pl-3 + Dock mx-2 + default vertical panel (64px). */
export const VIEWPORT_INSET_LEFT_APP_DOCK_RAIL = 'calc(0.75rem + 0.5rem + 4rem)' as const

/** Past clock DotNavigation: outer pr-2 + Dock mx-2 + vertical panelHeight (32px). */
export const VIEWPORT_INSET_RIGHT_CLOCK_DOT_RAIL = 'calc(0.5rem + 0.5rem + 2rem)' as const
