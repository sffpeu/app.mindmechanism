'use client'

import { useEffect } from 'react'
import { useSettings } from '@/lib/hooks/useSettings'
import { useSettingsHydrated } from '@/lib/hooks/useSettingsHydrated'

const PATTERN_COUNT = 8

function clampPatternId(id: number): number {
  return Math.max(0, Math.min(PATTERN_COUNT - 1, Math.round(id)))
}

function patternSvg(
  patternId: number,
  lineColor: string,
  fillColor: string
): string {
  const id = clampPatternId(patternId)

  const body = (() => {
    switch (id) {
      case 0:
        return `<rect width="64" height="64" fill="${fillColor}"/><path d="M0 32H64M32 0V64" stroke="${lineColor}" stroke-width="2"/>`
      case 1:
        return `<rect width="64" height="64" fill="${fillColor}"/><path d="M0 0L64 64M64 0L0 64" stroke="${lineColor}" stroke-width="2"/>`
      case 2:
        return `<rect width="64" height="64" fill="${fillColor}"/><circle cx="16" cy="16" r="4" fill="${lineColor}"/><circle cx="48" cy="16" r="4" fill="${lineColor}"/><circle cx="16" cy="48" r="4" fill="${lineColor}"/><circle cx="48" cy="48" r="4" fill="${lineColor}"/>`
      case 3:
        return `<rect width="64" height="64" fill="${fillColor}"/><path d="M0 16H64M0 48H64" stroke="${lineColor}" stroke-width="2"/>`
      case 4:
        return `<rect width="64" height="64" fill="${fillColor}"/><path d="M16 0V64M48 0V64" stroke="${lineColor}" stroke-width="2"/>`
      case 5:
        return `<rect width="64" height="64" fill="${fillColor}"/><path d="M0 0H32V32H0Z M32 32H64V64H32Z" fill="${lineColor}" fill-opacity="0.45"/>`
      case 6:
        return `<rect width="64" height="64" fill="${fillColor}"/><path d="M0 32C16 0 48 64 64 32" stroke="${lineColor}" stroke-width="2" fill="none"/>`
      case 7:
      default:
        return `<rect width="64" height="64" fill="${fillColor}"/><path d="M0 32L32 0L64 32L32 64Z" fill="none" stroke="${lineColor}" stroke-width="2"/>`
    }
  })()

  return `url("data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'>${body}</svg>`
  )}")`
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useSettingsHydrated()
  const {
    accessibilityEnabled,
    accessibilityMode,
    universalBgColor,
    universalPatternId,
    universalPatternSize,
    universalPatternLineColor,
    universalPatternFillColor,
    universalTextScaleEnabled,
    universalTextScale,
  } = useSettings()

  useEffect(() => {
    if (!hydrated) return

    const root = document.documentElement
    const body = document.body

    const shouldApply = accessibilityEnabled
    const bgImage = patternSvg(
      universalPatternId,
      universalPatternLineColor,
      universalPatternFillColor
    )

    root.style.setProperty('--mm-universal-bg-color', universalBgColor)
    root.style.setProperty('--mm-universal-bg-image', bgImage)
    root.style.setProperty('--mm-universal-bg-size', `${Math.max(12, Math.min(96, universalPatternSize))}px`)
    root.style.setProperty(
      '--mm-universal-text-scale',
      shouldApply && universalTextScaleEnabled ? String(universalTextScale) : '1'
    )
    root.style.setProperty(
      '--mm-cue-emphasis',
      shouldApply ? (accessibilityMode === 'hearing' ? '1.35' : '1.15') : '1'
    )
    body.setAttribute('data-mm-accessibility', shouldApply ? 'on' : 'off')
    body.setAttribute('data-mm-accessibility-mode', shouldApply ? accessibilityMode : 'off')
  }, [
    hydrated,
    accessibilityEnabled,
    accessibilityMode,
    universalBgColor,
    universalPatternId,
    universalPatternSize,
    universalPatternLineColor,
    universalPatternFillColor,
    universalTextScaleEnabled,
    universalTextScale,
  ])

  return <>{children}</>
}
