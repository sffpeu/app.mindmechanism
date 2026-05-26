'use client'

import { useLanguage } from '@/lib/i18n'
import { clockTitles } from '@/lib/clockTitles'

/** Returns the translated title for a single clock id. Falls back to the English static array. */
export function useClockTitle(id: number): string {
  const { t } = useLanguage()
  const key = `clockTitles.${id}`
  const translated = t('common', key)
  return translated !== key ? translated : (clockTitles[id] ?? '')
}

/** Returns all 9 translated clock titles as a readonly array. Falls back to English. */
export function useClockTitles(): readonly string[] {
  const { t } = useLanguage()
  return clockTitles.map((fallback, id) => {
    const key = `clockTitles.${id}`
    const translated = t('common', key)
    return translated !== key ? translated : fallback
  })
}
