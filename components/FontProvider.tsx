'use client'

import { useEffect } from 'react'

export const FONT_KEY = 'mm-app-font'

export type AppFontId = 'inter' | 'montserrat' | 'lora' | 'ibm-plex'

export interface AppFont {
  id: AppFontId
  label: string
  register: string
  description: string
  cssVar: string
  sampleText: string
}

export const APP_FONTS: AppFont[] = [
  {
    id: 'inter',
    label: 'Inter',
    register: 'Default',
    description: 'Clean, geometric sans-serif — the current application default.',
    cssVar: 'var(--font-inter)',
    sampleText: 'The Mind Mechanism',
  },
  {
    id: 'montserrat',
    label: 'Montserrat',
    register: 'Creative · Publishing',
    description: 'Geometric humanist — official font of The One Legged Poet publishing imprint.',
    cssVar: 'var(--font-montserrat)',
    sampleText: 'The Mind Mechanism',
  },
  {
    id: 'lora',
    label: 'Lora',
    register: 'Academic · Education',
    description: 'Balanced serif with roots in calligraphy — optimised for extended reading and study.',
    cssVar: 'var(--font-lora)',
    sampleText: 'The Mind Mechanism',
  },
  {
    id: 'ibm-plex',
    label: 'IBM Plex Sans',
    register: 'Corporate · Enterprise',
    description: 'Rational, structured grotesque — calibrated for professional and boardroom contexts.',
    cssVar: 'var(--font-ibm-plex)',
    sampleText: 'The Mind Mechanism',
  },
]

function applyFont(id: AppFontId) {
  const font = APP_FONTS.find(f => f.id === id) ?? APP_FONTS[0]
  document.documentElement.style.setProperty('--font-app', font.cssVar)
}

export function getStoredFont(): AppFontId {
  try { return (localStorage.getItem(FONT_KEY) as AppFontId) ?? 'inter' } catch { return 'inter' }
}

export function setAppFont(id: AppFontId) {
  try { localStorage.setItem(FONT_KEY, id) } catch {}
  applyFont(id)
  window.dispatchEvent(new CustomEvent('mm-font-change', { detail: id }))
}

export function FontProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyFont(getStoredFont())
    const handler = (e: Event) => applyFont((e as CustomEvent<AppFontId>).detail)
    window.addEventListener('mm-font-change', handler)
    return () => window.removeEventListener('mm-font-change', handler)
  }, [])
  return <>{children}</>
}
