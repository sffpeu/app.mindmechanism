'use client'

import { getMandalaIdleSuppress } from '@/lib/mandalaIdleSuppress'

const DEFAULT_IDLE_MS = 60_000

let idle = false
const idleListeners = new Set<() => void>()
let timer: ReturnType<typeof setTimeout> | null = null
let refCount = 0
let boundIdleMs = DEFAULT_IDLE_MS
let onActivity: (() => void) | null = null

function emitIdle() {
  idleListeners.forEach((l) => l())
}

function setIdle(next: boolean) {
  if (idle === next) return
  idle = next
  emitIdle()
}

function clearTimer() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

function armTimer() {
  clearTimer()
  timer = setTimeout(() => {
    timer = null
    if (!getMandalaIdleSuppress()) setIdle(true)
  }, boundIdleMs)
}

function bump() {
  setIdle(false)
  if (!getMandalaIdleSuppress()) armTimer()
}

function applySuppress() {
  if (getMandalaIdleSuppress()) {
    clearTimer()
    setIdle(false)
  } else {
    bump()
  }
}

function bindWindowListeners() {
  if (onActivity) return
  onActivity = () => bump()
  window.addEventListener('pointermove', onActivity, { passive: true })
  window.addEventListener('pointerdown', onActivity, { passive: true })
  window.addEventListener('mousemove', onActivity, { passive: true })
  window.addEventListener('mousedown', onActivity)
  window.addEventListener('touchstart', onActivity, { passive: true })
  window.addEventListener('keydown', onActivity)
  window.addEventListener('wheel', onActivity, { passive: true })
}

function unbindWindowListeners() {
  if (!onActivity) return
  window.removeEventListener('pointermove', onActivity)
  window.removeEventListener('pointerdown', onActivity)
  window.removeEventListener('mousemove', onActivity)
  window.removeEventListener('mousedown', onActivity)
  window.removeEventListener('touchstart', onActivity)
  window.removeEventListener('keydown', onActivity)
  window.removeEventListener('wheel', onActivity)
  onActivity = null
}

export function subscribeImmersiveIdle(listener: () => void) {
  idleListeners.add(listener)
  return () => {
    idleListeners.delete(listener)
  }
}

export function getImmersiveIdleSnapshot() {
  return idle
}

/** First consumer mounts shared listeners; last consumer unmounts clears them. */
export function attachImmersiveIdleController(idleMs: number) {
  boundIdleMs = idleMs
  refCount += 1
  if (refCount === 1) {
    bindWindowListeners()
  }
  bump()
}

export function detachImmersiveIdleController() {
  refCount = Math.max(0, refCount - 1)
  if (refCount === 0) {
    clearTimer()
    setIdle(false)
    unbindWindowListeners()
  }
}

/** Call when mandala suppress flag flips (via mandalaIdleSuppress store subscription). */
export function immersiveIdleOnSuppressChange() {
  applySuppress()
}
