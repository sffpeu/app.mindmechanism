'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { SupportedLocale, LocaleNamespace, TranslationDict } from './types'
import { DEFAULT_LOCALE } from './types'

interface LanguageContextValue {
  locale: SupportedLocale
  setLocale: (locale: SupportedLocale) => void
  t: (namespace: LocaleNamespace, key: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

/** Locale bundles are fetched from the gated API route, keyed by locale. */
const _bundleCache: Partial<Record<SupportedLocale, Record<string, TranslationDict>>> = {}

async function fetchLocaleBundle(
  locale: SupportedLocale,
): Promise<Record<string, TranslationDict>> {
  if (_bundleCache[locale]) return _bundleCache[locale]!
  try {
    const res = await fetch(`/api/locales/${locale}`, { credentials: 'include' })
    if (!res.ok) throw new Error(`${res.status}`)
    const data: Record<string, TranslationDict> = await res.json()
    _bundleCache[locale] = data
    return data
  } catch {
    if (locale !== DEFAULT_LOCALE) return fetchLocaleBundle(DEFAULT_LOCALE)
    return {}
  }
}

function resolveDotPath(obj: TranslationDict, path: string): string {
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return path
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : path
}

export function LanguageProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode
  initialLocale?: SupportedLocale
}) {
  const [locale, setLocaleState] = useState<SupportedLocale>(initialLocale)
  const [namespaces, setNamespaces] = useState<
    Partial<Record<string, TranslationDict>>
  >({})

  const loadAll = useCallback(async (loc: SupportedLocale) => {
    const bundle = await fetchLocaleBundle(loc)
    setNamespaces({
      common: (bundle.common ?? {}) as TranslationDict,
      portal: (bundle.portal ?? {}) as TranslationDict,
      'grammar-transit': (bundle['grammar-transit'] ?? {}) as TranslationDict,
    })
  }, [])

  useEffect(() => {
    loadAll(locale)
  }, [locale, loadAll])

  const setLocale = useCallback(
    (next: SupportedLocale) => {
      setLocaleState(next)
      if (typeof window !== 'undefined') {
        localStorage.setItem('mm_locale', next)
      }
    },
    [],
  )

  const t = useCallback(
    (namespace: LocaleNamespace, key: string): string => {
      const ns = namespaces[namespace]
      if (!ns) return key
      return resolveDotPath(ns, key)
    },
    [namespaces],
  )

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
