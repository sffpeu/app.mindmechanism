'use client'

import { useState, useEffect, useRef } from 'react'
import { Globe, Lock } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'
import { getLanguageAccess } from '@/lib/passportSilo'
import { useAuth } from '@/lib/FirebaseAuthContext'
import type { SupportedLocale } from '@/lib/i18n/types'
import { cn } from '@/lib/utils'

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'EN',
  de: 'DE',
  fi: 'FI',
  fr: 'FR',
  es: 'ES',
  it: 'IT',
}

const LOCALE_NAMES: Record<SupportedLocale, string> = {
  en: 'English',
  de: 'Deutsch',
  fi: 'Suomi',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
}

const ALL_LOCALES: SupportedLocale[] = ['en', 'de', 'fi', 'fr', 'es', 'it']

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage()
  const { user } = useAuth()
  const [available, setAvailable] = useState<SupportedLocale[]>(['en'])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    getLanguageAccess(user.uid).then(setAvailable)
  }, [user])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded transition-colors',
          'text-gray-400 hover:text-gray-100',
          open && 'text-gray-100',
        )}
        aria-label="Switch language"
        title="Switch language"
      >
        <Globe size={18} strokeWidth={1.5} />
        <span className="text-[9px] font-semibold tracking-wide uppercase">
          {LOCALE_LABELS[locale]}
        </span>
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-36 bg-gray-900 border border-gray-700 rounded shadow-xl z-50 overflow-hidden">
          {ALL_LOCALES.map((loc) => {
            const isUnlocked = available.includes(loc)
            const isActive = locale === loc
            return (
              <button
                key={loc}
                type="button"
                disabled={!isUnlocked}
                onClick={() => {
                  if (isUnlocked) {
                    setLocale(loc)
                    setOpen(false)
                  }
                }}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-xs transition-colors',
                  isActive
                    ? 'bg-gray-700 text-white'
                    : isUnlocked
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-600 cursor-not-allowed',
                )}
              >
                <span>{LOCALE_NAMES[loc]}</span>
                {!isUnlocked && <Lock size={10} className="text-gray-600" />}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
