'use client'

/**
 * When true, `useIdleFade` keeps chrome visible (mandala node / glossary focus active).
 * Wheel pages and Multiview 2 set this; AppDock reads it via the same hook.
 */

let suppress = false
const listeners = new Set<() => void>()

export function subscribeMandalaIdleSuppress(onStoreChange: () => void) {
  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
  }
}

export function getMandalaIdleSuppress(): boolean {
  return suppress
}

export function setMandalaIdleSuppress(value: boolean) {
  if (suppress === value) return
  suppress = value
  listeners.forEach((l) => l())
}
