/**
 * Fixed overlays beside vertical docks — geometry matches AppDock / DotNavigation shells.
 */

/** Outer chrome only (before dock pill): pl-3 + Dock mx-2. */
export const VIEWPORT_INSET_LEFT_NAV_OUTER = 'calc(0.75rem + 0.5rem)' as const

/** Outer chrome only: pr-2 + Dock mx-2. */
export const VIEWPORT_INSET_RIGHT_NAV_OUTER = 'calc(0.5rem + 0.5rem)' as const

/**
 * Left tangent of AppDock circular icons (matches default Dock inner `px-4` + `panelHeight` 64).
 * `pl-3` + Dock `mx-2` + inner horizontal padding.
 */
export const VIEWPORT_INSET_LEFT_APP_DOCK_ICONS = 'calc(0.75rem + 0.5rem + 1rem)' as const

/**
 * Right tangent of clock DotNavigation colour dots (`dockEdge="right"`, inner `px-2`, `panelHeight` 32).
 * `pr-2` + Dock `mx-2` + inner horizontal padding toward dots.
 */
export const VIEWPORT_INSET_RIGHT_CLOCK_DOT_ICONS = 'calc(0.5rem + 0.5rem + 0.5rem)' as const
