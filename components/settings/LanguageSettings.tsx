'use client'

import { useEffect, useState } from 'react'
import { Lock, Check } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'
import { getLanguageAccess } from '@/lib/passportSilo'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { SUPPORTED_LOCALES } from '@/lib/i18n/types'
import type { SupportedLocale } from '@/lib/i18n/types'
import { cn } from '@/lib/utils'

const LOCALE_META: Record<SupportedLocale, { name: string; native: string }> = {
  en: { name: 'English',   native: 'English'    },
  de: { name: 'German',    native: 'Deutsch'    },
  fi: { name: 'Finnish',   native: 'Suomi'      },
  fr: { name: 'French',    native: 'Français'   },
  es: { name: 'Spanish',   native: 'Español'    },
  it: { name: 'Italian',   native: 'Italiano'   },
}

export function LanguageSettings() {
  const { locale, setLocale } = useLanguage()
  const { user } = useAuth()
  const [available, setAvailable] = useState<SupportedLocale[]>(['en'])

  useEffect(() => {
    if (!user) return
    getLanguageAccess(user.uid).then(setAvailable)
  }, [user])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Interface language</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Select the language for all interface text and portal content. Additional languages are unlocked via your Learner's Passport.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {SUPPORTED_LOCALES.map((loc) => {
          const isUnlocked = available.includes(loc)
          const isActive = locale === loc
          const meta = LOCALE_META[loc]
          return (
            <button
              key={loc}
              type="button"
              disabled={!isUnlocked}
              onClick={() => { if (isUnlocked) setLocale(loc) }}
              className={cn(
                'flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors',
                isActive
                  ? 'border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-950/30'
                  : isUnlocked
                    ? 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600 dark:hover:bg-neutral-800'
                    : 'cursor-not-allowed border-neutral-200 bg-neutral-50 opacity-50 dark:border-neutral-800 dark:bg-neutral-900/50',
              )}
            >
              <div>
                <p className={cn(
                  'text-sm font-medium',
                  isActive ? 'text-violet-700 dark:text-violet-300' : 'text-neutral-800 dark:text-neutral-200'
                )}>
                  {meta.native}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{meta.name}</p>
              </div>
              {isActive && <Check size={16} className="text-violet-500 dark:text-violet-400" />}
              {!isUnlocked && <Lock size={14} className="text-neutral-400 dark:text-neutral-600" />}
            </button>
          )
        })}
      </div>

      {available.length < SUPPORTED_LOCALES.length && (
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          Locked languages are available as Passport attributes. Contact your administrator or upgrade your membership to unlock additional languages.
        </p>
      )}
    </div>
  )
}
