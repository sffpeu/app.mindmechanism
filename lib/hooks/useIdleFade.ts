'use client'

import { useEffect, useSyncExternalStore } from 'react'
import {
  getMandalaIdleSuppress,
  subscribeMandalaIdleSuppress,
} from '@/lib/mandalaIdleSuppress'
import {
  attachImmersiveIdleController,
  detachImmersiveIdleController,
  getImmersiveIdleSnapshot,
  subscribeImmersiveIdle,
  immersiveIdleOnSuppressChange,
} from '@/lib/immersiveIdleController'

const DEFAULT_IDLE_MS = 60_000

export type UseIdleFadeOptions = {
  idleMs?: number
}

/**
 * Shared across AppDock + mandala pages: after one minute without pointer/keyboard
 * activity, `isIdle` is true so chrome can fade. Pointer activity wakes everyone.
 * `setMandalaIdleSuppress(true)` keeps chrome visible (selected node / glossary / MV2 focus).
 */
export function useIdleFade(options?: UseIdleFadeOptions) {
  const idleMs = options?.idleMs ?? DEFAULT_IDLE_MS
  const mandalaSuppress = useSyncExternalStore(
    subscribeMandalaIdleSuppress,
    getMandalaIdleSuppress,
    () => false,
  )
  const sharedIdle = useSyncExternalStore(
    subscribeImmersiveIdle,
    getImmersiveIdleSnapshot,
    () => false,
  )

  useEffect(() => {
    attachImmersiveIdleController(idleMs)
    return () => detachImmersiveIdleController()
  }, [idleMs])

  useEffect(() => {
    immersiveIdleOnSuppressChange()
  }, [mandalaSuppress])

  return { isIdle: sharedIdle && !mandalaSuppress }
}
