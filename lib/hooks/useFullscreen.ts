'use client'

import { useCallback, useEffect, useState } from 'react'

type HTMLElementWithWebkit = HTMLElement & {
  webkitRequestFullscreen?: () => void
}

type DocumentWithWebkit = Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void> | void
}

function fullscreenElement(): Element | null {
  const d = document as DocumentWithWebkit
  return document.fullscreenElement ?? d.webkitFullscreenElement ?? null
}

export function isFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false
  const el = document.documentElement as HTMLElementWithWebkit
  return typeof el.requestFullscreen === 'function' || typeof el.webkitRequestFullscreen === 'function'
}

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    setSupported(isFullscreenSupported())
  }, [])

  useEffect(() => {
    const sync = () => setIsFullscreen(!!fullscreenElement())
    sync()
    document.addEventListener('fullscreenchange', sync)
    document.addEventListener('webkitfullscreenchange', sync)
    return () => {
      document.removeEventListener('fullscreenchange', sync)
      document.removeEventListener('webkitfullscreenchange', sync)
    }
  }, [])

  const toggle = useCallback(async () => {
    const doc = document as DocumentWithWebkit
    try {
      if (fullscreenElement()) {
        if (typeof document.exitFullscreen === 'function') {
          await document.exitFullscreen()
        } else if (typeof doc.webkitExitFullscreen === 'function') {
          await Promise.resolve(doc.webkitExitFullscreen())
        }
      } else {
        const el = document.documentElement as HTMLElementWithWebkit
        if (typeof el.requestFullscreen === 'function') {
          await el.requestFullscreen()
        } else if (typeof el.webkitRequestFullscreen === 'function') {
          el.webkitRequestFullscreen()
        }
      }
    } catch {
      // User denied, unsupported nested fullscreen, etc.
    }
  }, [])

  return { isFullscreen, toggle, supported }
}
