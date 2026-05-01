'use client'

/**
 * /pair — Paired Session
 *
 * Three phases: select two wheels → set duration → session runs.
 * No focus nodes. Both tones play together. Both mandalas rotate
 * independently at their own Cousto-derived speeds.
 */

import { useState, useCallback, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Volume2, VolumeX, ArrowLeft } from 'lucide-react'
import { useTheme } from '@/app/ThemeContext'
import { useSessionTimer } from '@/lib/useSessionTimer'
import { clockSettings } from '@/lib/clockSettings'
import { clockTitles } from '@/lib/clockTitles'
import { useClockRotation } from '@/lib/hooks/useClockRotation'
import { usePairedBreathingTone } from '@/lib/hooks/usePairedBreathingTone'
import { MandalaCeremony } from '@/components/MandalaCeremony'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { cn } from '@/lib/utils'
import Timer from '@/components/Timer'

const CLOCK_HEX = [
  '#fd290a', '#fba63b', '#f7da5f', '#6dc037',
  '#156fde', '#941952', '#541b96', '#ee5fa7', '#56c1ff',
]

const DURATION_OPTIONS = [
  { label: '5 min',  ms: 5  * 60_000 },
  { label: '10 min', ms: 10 * 60_000 },
  { label: '15 min', ms: 15 * 60_000 },
  { label: '20 min', ms: 20 * 60_000 },
  { label: '30 min', ms: 30 * 60_000 },
  { label: '45 min', ms: 45 * 60_000 },
  { label: '60 min', ms: 60 * 60_000 },
]

function thumbPath(id: number) {
  return id < 8 ? `/small/${id + 1}_small.svg` : `/clock_9.svg`
}

type Phase = 'select' | 'duration' | 'session'

// ─────────────────────────────────────────────────────────────────────────────
// Paired clock face — two SVGs overlaid, each on its own rotation
// ─────────────────────────────────────────────────────────────────────────────
function PairedFace({
  idA, idB, showCeremony, onCeremonyEnd,
}: {
  idA: number
  idB: number
  showCeremony: boolean
  onCeremonyEnd: () => void
}) {
  const rotA = useClockRotation(idA)
  const rotB = useClockRotation(idB)
  const cA = clockSettings[idA]
  const cB = clockSettings[idB]
  const hexA = CLOCK_HEX[idA]
  const hexB = CLOCK_HEX[idB]

  // Dismiss both ceremonies after 30 s
  useEffect(() => {
    if (!showCeremony) return
    const t = setTimeout(onCeremonyEnd, 31_000)
    return () => clearTimeout(t)
  }, [showCeremony, onCeremonyEnd])

  return (
    <div
      className="relative rounded-full overflow-hidden select-none"
      style={{
        width:  'min(70vw, 70vh)',
        height: 'min(70vw, 70vh)',
        boxShadow: `0 0 80px 20px ${hexA}18, 0 0 80px 20px ${hexB}18`,
      }}
    >
      {/* Wheel A */}
      <motion.div
        className="absolute inset-0"
        style={{ transformOrigin: 'center' }}
        animate={{ rotate: rotA }}
        transition={{ type: 'tween', duration: 0.016, ease: 'linear' }}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${cA.imageX}%, ${cA.imageY}%) rotate(${cA.imageOrientation}deg) scale(${cA.imageScale})`,
            transformOrigin: 'center',
            opacity: 0.75,
            mixBlendMode: 'screen',
          }}
        >
          <Image src={cA.imageUrl} alt="" fill className="object-cover rounded-full dark:invert" priority />
        </div>
      </motion.div>

      {/* Wheel B */}
      <motion.div
        className="absolute inset-0"
        style={{ transformOrigin: 'center' }}
        animate={{ rotate: rotB }}
        transition={{ type: 'tween', duration: 0.016, ease: 'linear' }}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${cB.imageX}%, ${cB.imageY}%) rotate(${cB.imageOrientation}deg) scale(${cB.imageScale})`,
            transformOrigin: 'center',
            opacity: 0.75,
            mixBlendMode: 'screen',
          }}
        >
          <Image src={cB.imageUrl} alt="" fill className="object-cover rounded-full dark:invert" priority />
        </div>
      </motion.div>

      {/* Dual completion ceremony */}
      {showCeremony && (
        <>
          <MandalaCeremony clockHex={hexA} onComplete={() => {}} />
          <MandalaCeremony clockHex={hexB} onComplete={() => {}} />
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Session phase — tones active, face rotating, timer running
// ─────────────────────────────────────────────────────────────────────────────
function SessionPhase({
  idA, idB, duration, onEnd,
}: {
  idA: number
  idB: number
  duration: number
  onEnd: () => void
}) {
  const [muted, setMuted] = useState(false)
  const [showCeremony, setShowCeremony] = useState(false)
  const hexA = CLOCK_HEX[idA]
  const hexB = CLOCK_HEX[idB]

  const handleComplete = useCallback(() => {
    setShowCeremony(true)
  }, [])

  const { remainingTime, isPaused, onPauseResume } = useSessionTimer(
    duration,
    null,
    handleComplete,
  )

  usePairedBreathingTone(idA, idB, muted)

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-8"
         style={{ background: '#09090b' }}>

      {/* Paired face */}
      <PairedFace
        idA={idA}
        idB={idB}
        showCeremony={showCeremony}
        onCeremonyEnd={onEnd}
      />

      {/* Wheel names */}
      <div className="flex items-center gap-3 text-xs tracking-widest uppercase">
        <span style={{ color: hexA }}>{clockTitles[idA]}</span>
        <span className="text-white/20">×</span>
        <span style={{ color: hexB }}>{clockTitles[idB]}</span>
      </div>

      {/* Timer */}
      {remainingTime != null && (
        <Timer
          remainingTime={remainingTime}
          isPaused={isPaused}
          onPauseResume={onPauseResume}
        />
      )}

      {/* Mute button */}
      <button
        type="button"
        onClick={() => setMuted(m => !m)}
        className={cn(
          'fixed bottom-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full',
          'border border-white/15 bg-black/80 text-gray-100 shadow-md backdrop-blur-sm',
          'transition-colors hover:bg-black/90 pointer-events-auto'
        )}
        aria-label={muted ? 'Unmute tones' : 'Mute tones'}
      >
        {muted
          ? <VolumeX className="h-5 w-5" aria-hidden />
          : <Volume2 className="h-5 w-5" aria-hidden />}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Wheel thumbnail — used in the selection grid
// ─────────────────────────────────────────────────────────────────────────────
function WheelThumb({
  id, selectedAs, dragSource, dragOver,
  onSelect, onDragStart, onDragOver, onDragLeave, onDrop,
}: {
  id: number
  selectedAs: 'A' | 'B' | null
  dragSource: number | null
  dragOver: number | null
  onSelect: (id: number) => void
  onDragStart: (id: number) => void
  onDragOver: (id: number) => void
  onDragLeave: () => void
  onDrop: (id: number) => void
}) {
  const hex = CLOCK_HEX[id]
  const isDropTarget = dragSource !== null && dragSource !== id && dragOver === id
  const isSelected = selectedAs !== null
  const label = selectedAs ?? null

  return (
    <div
      className="flex flex-col items-center gap-2 cursor-pointer select-none"
      draggable
      onDragStart={() => onDragStart(id)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(id) }}
      onDragLeave={onDragLeave}
      onDrop={(e) => { e.preventDefault(); onDrop(id) }}
      onClick={() => onSelect(id)}
    >
      <div
        className="relative rounded-full overflow-hidden transition-all duration-200"
        style={{
          width: 64,
          height: 64,
          border: `2px solid ${isSelected ? hex : isDropTarget ? hex + 'aa' : hex + '28'}`,
          boxShadow: isSelected
            ? `0 0 16px 4px ${hex}45`
            : isDropTarget
              ? `0 0 20px 6px ${hex}60`
              : 'none',
          opacity: dragSource !== null && dragSource !== id && !isDropTarget ? 0.5 : 1,
        }}
      >
        <Image
          src={thumbPath(id)}
          alt={clockTitles[id]}
          fill
          className="object-cover rounded-full dark:invert"
        />
        {/* A / B badge */}
        {label && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full"
            style={{ background: `${hex}55` }}
          >
            <span className="text-white text-base font-bold" style={{ textShadow: `0 0 8px ${hex}` }}>
              {label}
            </span>
          </div>
        )}
      </div>
      <span className="text-[9px] tracking-widest uppercase text-center"
            style={{ color: isSelected ? hex : 'rgba(255,255,255,0.3)' }}>
        {clockTitles[id]}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Pair preview — shows the two chosen mandalas overlapping
// ─────────────────────────────────────────────────────────────────────────────
function PairPreview({ idA, idB }: { idA: number | null; idB: number | null }) {
  const hexA = idA !== null ? CLOCK_HEX[idA] : null
  const hexB = idB !== null ? CLOCK_HEX[idB] : null
  const cA = idA !== null ? clockSettings[idA] : null
  const cB = idB !== null ? clockSettings[idB] : null

  const Circle = ({
    id, hex, clock, style,
  }: {
    id: number | null
    hex: string | null
    clock: typeof clockSettings[0] | null
    style?: React.CSSProperties
  }) => (
    <div
      className="absolute rounded-full overflow-hidden transition-all duration-300"
      style={{
        width: 96,
        height: 96,
        border: `1.5px solid ${hex ?? 'rgba(255,255,255,0.1)'}`,
        boxShadow: hex ? `0 0 20px 4px ${hex}30` : 'none',
        background: '#1a1a1f',
        ...style,
      }}
    >
      {id !== null && clock && (
        <Image
          src={thumbPath(id)}
          alt=""
          fill
          className="object-cover rounded-full dark:invert"
          style={{
            transform: `rotate(${clock.imageOrientation}deg)`,
            mixBlendMode: 'screen',
          }}
        />
      )}
      {id === null && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border border-dashed border-white/15" />
        </div>
      )}
    </div>
  )

  return (
    <div className="relative flex items-center justify-center" style={{ width: 160, height: 100 }}>
      <Circle id={idA} hex={hexA} clock={cA} style={{ left: 0 }} />
      <Circle id={idB} hex={hexB} clock={cB} style={{ right: 0 }} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
function PairPageContent() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('select')
  const [wheelA, setWheelA] = useState<number | null>(null)
  const [wheelB, setWheelB] = useState<number | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [dragSource, setDragSource] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const handleSelect = (id: number) => {
    if (wheelA === id) { setWheelA(null); return }
    if (wheelB === id) { setWheelB(null); return }
    if (wheelA === null) { setWheelA(id); return }
    if (wheelB === null && id !== wheelA) { setWheelB(id); return }
    // Both set — replace A, keep B
    setWheelA(id)
  }

  const handleDrop = (target: number) => {
    if (dragSource !== null && dragSource !== target) {
      setWheelA(dragSource)
      setWheelB(target)
    }
    setDragSource(null)
    setDragOver(null)
  }

  const handleSessionEnd = useCallback(() => {
    router.push('/sessions')
  }, [router])

  const bothSelected = wheelA !== null && wheelB !== null
  const hexA = wheelA !== null ? CLOCK_HEX[wheelA] : null
  const hexB = wheelB !== null ? CLOCK_HEX[wheelB] : null

  // ── Session phase ─────────────────────────────────────────────────────────
  if (phase === 'session' && wheelA !== null && wheelB !== null && duration !== null) {
    return (
      <SessionPhase
        idA={wheelA}
        idB={wheelB}
        duration={duration}
        onEnd={handleSessionEnd}
      />
    )
  }

  // ── Select + Duration phases (shared dark container) ──────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#09090b', color: '#e4e4e7' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-4">
        <Link
          href="/sessions"
          className="flex items-center justify-center w-8 h-8 rounded-full border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <p className="text-[9px] tracking-widest uppercase text-white/25">Mind Mechanism</p>
          <h1 className="text-sm font-semibold tracking-wide text-white/80">Paired Session</h1>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── SELECT phase ──────────────────────────────────────────────── */}
        {phase === 'select' && (
          <motion.div
            key="select"
            className="flex flex-col items-center gap-8 px-6 py-6 flex-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            {/* Pair preview */}
            <div className="flex flex-col items-center gap-3">
              <PairPreview idA={wheelA} idB={wheelB} />
              <p className="text-[10px] tracking-widest uppercase text-white/25">
                {!wheelA && !wheelB
                  ? 'drag or tap two wheels'
                  : !wheelA || !wheelB
                    ? 'select one more'
                    : `${clockTitles[wheelA]} × ${clockTitles[wheelB]}`}
              </p>
            </div>

            {/* 3×3 wheel grid */}
            <div className="grid grid-cols-3 gap-6">
              {Array.from({ length: 9 }, (_, i) => (
                <WheelThumb
                  key={i}
                  id={i}
                  selectedAs={wheelA === i ? 'A' : wheelB === i ? 'B' : null}
                  dragSource={dragSource}
                  dragOver={dragOver}
                  onSelect={handleSelect}
                  onDragStart={(id) => setDragSource(id)}
                  onDragOver={(id) => setDragOver(id)}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={handleDrop}
                />
              ))}
            </div>

            {/* Continue */}
            <button
              onClick={() => bothSelected && setPhase('duration')}
              disabled={!bothSelected}
              className="px-8 py-3 rounded-full text-sm font-medium tracking-wide transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              style={{
                background: bothSelected
                  ? `linear-gradient(135deg, ${hexA}33 0%, ${hexB}33 100%)`
                  : 'rgba(255,255,255,0.05)',
                border: `1px solid ${bothSelected ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)'}`,
                color: bothSelected ? '#fff' : 'rgba(255,255,255,0.3)',
              }}
            >
              Continue
            </button>
          </motion.div>
        )}

        {/* ── DURATION phase ────────────────────────────────────────────── */}
        {phase === 'duration' && wheelA !== null && wheelB !== null && (
          <motion.div
            key="duration"
            className="flex flex-col items-center gap-8 px-6 py-6 flex-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            {/* Pair preview (smaller) */}
            <div className="flex flex-col items-center gap-2">
              <PairPreview idA={wheelA} idB={wheelB} />
              <p className="text-[10px] tracking-widest uppercase"
                 style={{ color: 'rgba(255,255,255,0.3)' }}>
                {clockTitles[wheelA]}
                <span className="mx-2 text-white/15">×</span>
                {clockTitles[wheelB]}
              </p>
            </div>

            {/* Duration options */}
            <div className="w-full max-w-xs">
              <p className="text-[9px] tracking-widest uppercase text-white/25 mb-4 text-center">
                Set Duration
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DURATION_OPTIONS.map(({ label, ms }) => (
                  <button
                    key={ms}
                    onClick={() => setDuration(ms)}
                    className="py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: duration === ms
                        ? `linear-gradient(135deg, ${CLOCK_HEX[wheelA]}22 0%, ${CLOCK_HEX[wheelB]}22 100%)`
                        : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${duration === ms ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}`,
                      color: duration === ms ? '#fff' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Back + Begin */}
            <div className="flex gap-3">
              <button
                onClick={() => setPhase('select')}
                className="px-5 py-2.5 rounded-full text-xs font-medium text-white/40 border border-white/10 hover:border-white/20 hover:text-white/60 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => duration && setPhase('session')}
                disabled={!duration}
                className="px-8 py-2.5 rounded-full text-sm font-medium transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                style={{
                  background: duration
                    ? `linear-gradient(135deg, ${CLOCK_HEX[wheelA]}44 0%, ${CLOCK_HEX[wheelB]}44 100%)`
                    : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${duration ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
                  color: duration ? '#fff' : 'rgba(255,255,255,0.3)',
                }}
              >
                Begin
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}

export default function PairPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
        <PairPageContent />
      </Suspense>
    </ProtectedRoute>
  )
}
