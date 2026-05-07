'use client'

import { useEffect, useState } from 'react'
import { useSettings } from '@/lib/hooks/useSettings'

/** True after Zustand persist has loaded from localStorage (Sound settings, etc.). */
export function useSettingsHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => {
    const hasHydrated = useSettings.persist?.hasHydrated
    return typeof hasHydrated === 'function' ? hasHydrated() : true
  })

  useEffect(() => {
    const hasHydrated = useSettings.persist?.hasHydrated
    const onFinishHydration = useSettings.persist?.onFinishHydration

    if (typeof hasHydrated !== 'function' || typeof onFinishHydration !== 'function') {
      setHydrated(true)
      return
    }

    setHydrated(hasHydrated())
    return onFinishHydration(() => setHydrated(true))
  }, [])

  return hydrated
}
