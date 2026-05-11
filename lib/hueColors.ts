/**
 * Philips Hue color utilities for Mind Mechanism wheel integration.
 *
 * Hue lights accept CIE xy colour coordinates or hue/sat/bri.
 * We use the CIE xy path (more accurate) via the sRGB → CIE XYZ → xy conversion.
 *
 * Mapping: each clock's hex colour (from CLOCK_HEX) is converted to a Hue
 * light state. When a user enters a clock page the lights transition to that
 * node's colour, grounding the physical space in the wheel context.
 */

import { WHEEL_HEX } from '@/lib/wheelColors'

/** One colour per clock (index 0 = ROOT … 8 = ETHERIC HEART). Same as {@link WHEEL_HEX}. */
export const CLOCK_HEX = WHEEL_HEX

export interface HueLightState {
  on: true
  xy: [number, number]
  bri: number
  transitiontime: number // Hue units: 1 = 100 ms → 10 = 1 s
}

/** Convert a hex colour string to a Philips Hue CIE xy light state. */
export function hexToHueLightState(
  hex: string,
  brightness = 200,
  transitionSeconds = 1.2
): HueLightState {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255

  // Gamma correction (sRGB → linear)
  const linearise = (c: number) =>
    c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92

  const rl = linearise(r)
  const gl = linearise(g)
  const bl = linearise(b)

  // sRGB D65 → CIE XYZ (wide gamut)
  const X = rl * 0.664511 + gl * 0.154324 + bl * 0.162028
  const Y = rl * 0.283881 + gl * 0.668433 + bl * 0.047685
  const Z = rl * 0.000088 + gl * 0.072310 + bl * 0.986039

  const denom = X + Y + Z
  const x = denom > 0 ? X / denom : 0.3127
  const y = denom > 0 ? Y / denom : 0.3290

  return {
    on: true,
    xy: [Math.round(x * 10000) / 10000, Math.round(y * 10000) / 10000],
    bri: Math.max(1, Math.min(254, brightness)),
    transitiontime: Math.round(transitionSeconds * 10),
  }
}

/** Return the Hue light state for a given clock index (0–8). */
export function clockIndexToHueState(
  index: number,
  brightness?: number,
  transitionSeconds?: number
): HueLightState {
  const hex = CLOCK_HEX[index] ?? CLOCK_HEX[0]
  return hexToHueLightState(hex, brightness, transitionSeconds)
}
