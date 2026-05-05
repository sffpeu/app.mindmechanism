/**
 * Default Multi View 2 footer offsets (px). Positive x → right, positive y → down.
 * Applied from anchored corners: heading bottom-left, toggle bottom-right (layout gutters).
 *
 * After tuning in the browser, paste final numbers here (see MULTIVIEW2_OVERLAY_OFFSETS_STORAGE_KEY
 * in MultiView2Overlay) so everyone gets the same placement without localStorage.
 */

export type MultiView2OverlayOffsets = {
  heading: { x: number; y: number }
  toggle: { x: number; y: number }
}

export const MULTIVIEW2_OVERLAY_OFFSETS_BASE: MultiView2OverlayOffsets = {
  heading: { x: 0, y: 0 },
  toggle: { x: 0, y: 0 },
}
