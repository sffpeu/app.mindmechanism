'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Radio } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  setPresence,
  clearPresence,
  subscribePresence,
  COMPANION_DELAY_MS,
  type PresenceDoc,
} from '@/lib/lobbyPresence'
import { ClockPageIconButton } from '@/components/ClockPageSettingsTrigger'

type Props = {
  uid: string
  clockIndex: number
  clockHex: string
  /** null = free-run, number = timed session in minutes */
  durationMins: number | null
}

export function SessionPresenceBroadcast({ uid, clockIndex, clockHex, durationMins }: Props) {
  const [broadcasting, setBroadcasting] = useState(false)
  const [joinCount, setJoinCount] = useState(0)
  const [companionVisible, setCompanionVisible] = useState(false)
  const companionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unsubRef = useRef<(() => void) | null>(null)

  const startBroadcast = useCallback(async () => {
    await setPresence(uid, clockIndex, durationMins)
    setBroadcasting(true)
    setJoinCount(0)
    setCompanionVisible(false)

    // Watch our own presence doc for joins
    unsubRef.current = subscribePresence((docs) => {
      const mine = docs.find((d) => d.uid === uid)
      if (!mine) return
      const realJoins = mine.joined_uids.filter((u) => u !== uid).length
      setJoinCount(realJoins)
      if (realJoins > 0) {
        setCompanionVisible(false)
        if (companionTimerRef.current) clearTimeout(companionTimerRef.current)
      }
    })

    // Companion appears after delay if no real join
    companionTimerRef.current = setTimeout(() => {
      setJoinCount((current) => {
        if (current === 0) setCompanionVisible(true)
        return current
      })
    }, COMPANION_DELAY_MS)
  }, [uid, clockIndex, durationMins])

  const stopBroadcast = useCallback(async () => {
    await clearPresence(uid)
    setBroadcasting(false)
    setCompanionVisible(false)
    setJoinCount(0)
    if (companionTimerRef.current) clearTimeout(companionTimerRef.current)
    unsubRef.current?.()
    unsubRef.current = null
  }, [uid])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (broadcasting) {
        clearPresence(uid).catch(() => null)
      }
      if (companionTimerRef.current) clearTimeout(companionTimerRef.current)
      unsubRef.current?.()
    }
  }, [broadcasting, uid])

  const toggle = () => {
    if (broadcasting) stopBroadcast()
    else startBroadcast()
  }

  return (
    <>
      {/* Broadcast toggle — compact icon when off, pill with "Live" label when on */}
      <div className="relative flex items-center">
        {broadcasting ? (
          <button
            type="button"
            onClick={toggle}
            aria-label="Stop broadcasting"
            className="flex items-center gap-1.5 h-7 rounded-full px-2.5 text-[11px] font-medium tracking-wide transition-all duration-200"
            style={{
              backgroundColor: `${clockHex}22`,
              border: `1px solid ${clockHex}55`,
              color: clockHex,
              boxShadow: `0 0 10px ${clockHex}44`,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse shrink-0"
              style={{ backgroundColor: clockHex }}
            />
            Live
            {joinCount > 0 && (
              <span
                className="ml-0.5 h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                style={{ backgroundColor: clockHex, color: '#fff' }}
              >
                {joinCount}
              </span>
            )}
          </button>
        ) : (
          <ClockPageIconButton
            clockHex={clockHex}
            onClick={toggle}
            aria-label="Broadcast your presence"
          >
            <Radio className="h-2.5 w-2.5" style={{ color: 'currentColor' }} />
          </ClockPageIconButton>
        )}
      </div>

      {/* Companion message — transparent, dignified */}
      <AnimatePresence>
        {companionVisible && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[998] pointer-events-none text-center"
          >
            <p
              className="text-xs font-light tracking-widest uppercase"
              style={{ color: `${clockHex}bb` }}
            >
              You are being held.
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">
              A presence companion is with you.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
