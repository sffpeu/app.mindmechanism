'use client'

import { useEffect, useState } from 'react'
import { useSettings } from '@/lib/hooks/useSettings'

/** True after Zustand persist has loaded from localStorage (Sound settings, etc.). */
export function useSettingsHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useSettings.persist.hasHydrated())

  useEffect(() => {
    setHydrated(useSettings.persist.hasHydrated())
    return useSettings.persist.onFinishHydration(() => setHydrated(true))
  }, [])

  return hydrated
}
