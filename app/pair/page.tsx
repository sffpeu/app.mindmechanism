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
import { useSessionTimer } from '@/lib/useSessionTimer'
import { clockSettings } from '@/lib/clockSettings'
import { clockTitles } from '@/lib/clockTitles'
import { useClockRotation } from '@/lib/hooks/useClockRotation'
import { usePairedBreathingTone } from '@/lib/hooks/usePairedBreathingTone'
import { MandalaCeremony } from '@/components/MandalaCeremony'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { cn } from '@/lib/utils'
import Timer from '@/components/Timer'
import { useIdleFade } from '@/lib/hooks/useIdleFade'

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

type Phase = 'select' | 'duration' | 'session'
type ColourMode = 'colour' | 'mono'

function imgSrc(id: number, mode: ColourMode) {
  return mode === 'colour'
    ? `/clock_${id + 1}_colour.svg`
    : clockSettings[id].imageUrl
}

/** Mono SVGs are black-on-white — invert to white-on-black on the dark background */
function imgStyle(mode: ColourMode): React.CSSProperties {
  return mode === 'mono' ? { filter: 'invert(1)' } : {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Colour / Mono toggle pill
// ─────────────────────────────────────────────────────────────────────────────
function ColourToggle({
  mode, onChange,
}: {
  mode: ColourMode
  onChange: (m: ColourMode) => void
}) {
  return (
    <div className="flex rounded-full border border-white/10 overflow-hidden"
         style={{ fontSize: 9 }}>
      {(['colour', 'mono'] as ColourMode[]).map(m => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className="px-3 py-1 tracking-widest uppercase transition-colors"
          style={{
            background: mode === m ? 'rgba(255,255,255,0.12)' : 'transparent',
            color:      mode === m ? 'rgba(255,255,255,0.8)'  : 'rgba(255,255,255,0.3)',
          }}
        >
          {m}
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Circular progress ring — sits outside the clipped face container
// ─────────────────────────────────────────────────────────────────────────────
function CircularProgressRing({
  remainingTime, initialDuration, isPaused, hexA, hexB,
}: {
  remainingTime: number | null
  initialDuration: number | null
  isPaused: boolean
  hexA: string
  hexB: string
}) {
  const progress =
    remainingTime != null && initialDuration != null && initialDuration > 0
      ? Math.min(1, (initialDuration - remainingTime) / initialDuration)
      : 0

  const r = 47
  const circ = 2 * Math.PI * r

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      aria-hidden
    >
      <defs>
        <linearGradient id="pairRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={hexA} />
          <stop offset="100%" stopColor={hexB} />
        </linearGradient>
      </defs>
      {/* Track */}
      <circle cx="50" cy="50" r={r} fill="none"
              stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      {/* Progress arc */}
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke="url(#pairRingGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - progress)}
        transform="rotate(-90 50 50)"
        style={{
          opacity: isPaused ? 0.5 : 0.85,
          transition: 'stroke-dashoffset 0.25s linear',
        }}
      />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Paired clock face — two SVGs overlaid, each on its own rotation
// ─────────────────────────────────────────────────────────────────────────────
function PairedFace({
  idA, idB, showCeremony, onCeremonyEnd,
  remainingTime, initialDuration, isPaused, colourMode, continuous,
}: {
  idA: number
  idB: number
  showCeremony: boolean
  onCeremonyEnd: () => void
  remainingTime: number | null
  initialDuration: number | null
  isPaused: boolean
  colourMode: ColourMode
  /** No countdown ring — open-ended practice */
  continuous?: boolean
}) {
  const rotA = useClockRotation(idA)
  const rotB = useClockRotation(idB)
  const cA = clockSettings[idA]
  const cB = clockSettings[idB]
  const hexA = CLOCK_HEX[idA]
  const hexB = CLOCK_HEX[idB]
  const size = 'min(70vw, 70vh)'

  // Dismiss both ceremonies after 30 s
  useEffect(() => {
    if (!showCeremony) return
    const t = setTimeout(onCeremonyEnd, 31_000)
    return () => clearTimeout(t)
  }, [showCeremony, onCeremonyEnd])

  return (
    <div
      className="relative select-none"
      style={{ width: size, height: size }}
    >
      {/* Progress ring — outside the clip so it's not cut off (hidden for continuous play) */}
      {!continuous && (
        <div className="absolute pointer-events-none" style={{ inset: '-3px' }}>
          <CircularProgressRing
            remainingTime={remainingTime}
            initialDuration={initialDuration}
            isPaused={isPaused}
            hexA={hexA}
            hexB={hexB}
          />
        </div>
      )}

      {/* Face — clipped to circle */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
        style={{ boxShadow: `0 0 80px 20px ${hexA}15, 0 0 80px 20px ${hexB}15` }}
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
              mixBlendMode: 'screen',
            }}
          >
            <Image
              src={imgSrc(idA, colourMode)}
              alt="" fill
              className="object-cover rounded-full"
              style={imgStyle(colourMode)}
              priority
            />
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
              mixBlendMode: 'screen',
            }}
          >
            <Image
              src={imgSrc(idB, colourMode)}
              alt="" fill
              className="object-cover rounded-full"
              style={imgStyle(colourMode)}
              priority
            />
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
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Session phase — tones active, face rotating, timer running
// ─────────────────────────────────────────────────────────────────────────────
function SessionPhase({
  idA, idB, duration, continuous, colourMode, onColourModeChange, onEnd,
}: {
  idA: number
  idB: number
  /** Countdown length in ms; ignored when `continuous` */
  duration: number | null
  /** Open-ended session — no auto-complete; use End session */
  continuous: boolean
  colourMode: ColourMode
  onColourModeChange: (m: ColourMode) => void
  onEnd: () => void
}) {
  const [muted, setMuted] = useState(false)
  const [showCeremony, setShowCeremony] = useState(false)
  const hexA = CLOCK_HEX[idA]
  const hexB = CLOCK_HEX[idB]

  const handleComplete = useCallback(() => {
    setShowCeremony(true)
  }, [])

  const { remainingTime, isPaused, initialDuration, onPauseResume } = useSessionTimer(
    continuous ? null : duration,
    null,
    continuous ? undefined : handleComplete,
  )

  usePairedBreathingTone(idA, idB, muted)

  const { isIdle } = useIdleFade()

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-8"
         style={{ background: '#09090b' }}>

      {/* Paired face */}
      <PairedFace
        idA={idA}
        idB={idB}
        showCeremony={showCeremony}
        onCeremonyEnd={onEnd}
        remainingTime={remainingTime}
        initialDuration={initialDuration}
        isPaused={isPaused}
        colourMode={colourMode}
        continuous={continuous}
      />

      <div
        className={cn(
          'flex flex-col items-center gap-2 transition-opacity duration-700',
          isIdle && 'pointer-events-none opacity-0',
        )}
      >
        {/* Wheel names */}
        <div className="flex items-center gap-3 text-xs tracking-widest uppercase">
          <span style={{ color: hexA }}>{clockTitles[idA]}</span>
          <span className="text-white/20">×</span>
          <span style={{ color: hexB }}>{clockTitles[idB]}</span>
        </div>

        {continuous ? (
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/35">Continuous play</p>
        ) : (
          remainingTime != null && (
            <Timer
              remainingTime={remainingTime}
              isPaused={isPaused}
              onPauseResume={onPauseResume}
            />
          )
        )}
        {continuous && (
          <button
            type="button"
            onClick={onEnd}
            className="mt-1 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[10px] font-medium uppercase tracking-widest text-white/60 transition-colors hover:border-white/25 hover:bg-white/10 hover:text-white/85"
          >
            End session
          </button>
        )}
      </div>

      {/* Colour toggle — bottom left */}
      <div
        className={cn(
          'fixed bottom-4 left-4 z-50 transition-opacity duration-700',
          isIdle && 'pointer-events-none opacity-0',
        )}
      >
        <ColourToggle mode={colourMode} onChange={onColourModeChange} />
      </div>

      {/* Mute button — bottom right */}
      <button
        type="button"
        onClick={() => setMuted(m => !m)}
        className={cn(
          'fixed bottom-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full',
          'border border-white/15 bg-black/80 text-gray-100 shadow-md backdrop-blur-sm',
          'pointer-events-auto transition-opacity duration-700',
          'transition-colors hover:bg-black/90',
          isIdle && 'pointer-events-none opacity-0',
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
  id, selectedAs, dragSource, dragOver, colourMode,
  onSelect, onDragStart, onDragOver, onDragLeave, onDrop,
}: {
  id: number
  selectedAs: 'A' | 'B' | null
  dragSource: number | null
  dragOver: number | null
  colourMode: ColourMode
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
          src={imgSrc(id, colourMode)}
          alt={clockTitles[id]}
          fill
          className="object-cover rounded-full"
          style={imgStyle(colourMode)}
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
function PairPreview({ idA, idB, colourMode }: { idA: number | null; idB: number | null; colourMode: ColourMode }) {
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
          src={imgSrc(id, colourMode)}
          alt=""
          fill
          className="object-cover rounded-full"
          style={{
            transform: `rotate(${clock.imageOrientation}deg)`,
            mixBlendMode: 'screen',
            ...imgStyle(colourMode),
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
  const [continuousPlay, setContinuousPlay] = useState(false)
  const [customMinutes, setCustomMinutes] = useState('')
  const [dragSource, setDragSource] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const [colourMode, setColourMode] = useState<ColourMode>('colour')

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

  const handleCustomMinutes = (val: string) => {
    setCustomMinutes(val)
    const mins = parseInt(val)
    if (!isNaN(mins) && mins >= 1 && mins <= 180) {
      setContinuousPlay(false)
      setDuration(mins * 60_000)
    }
  }

  const bothSelected = wheelA !== null && wheelB !== null
  const hexA = wheelA !== null ? CLOCK_HEX[wheelA] : null
  const hexB = wheelB !== null ? CLOCK_HEX[wheelB] : null

  // ── Session phase ─────────────────────────────────────────────────────────
  if (phase === 'session' && wheelA !== null && wheelB !== null && (duration !== null || continuousPlay)) {
    return (
      <SessionPhase
        idA={wheelA}
        idB={wheelB}
        duration={duration}
        continuous={continuousPlay}
        colourMode={colourMode}
        onColourModeChange={setColourMode}
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
        <div className="flex-1">
          <p className="text-[9px] tracking-widest uppercase text-white/25">Mind Mechanism</p>
          <h1 className="text-sm font-semibold tracking-wide text-white/80">Paired Session</h1>
        </div>
        <ColourToggle mode={colourMode} onChange={setColourMode} />
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
              <PairPreview idA={wheelA} idB={wheelB} colourMode={colourMode} />
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
                  colourMode={colourMode}
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
              <PairPreview idA={wheelA} idB={wheelB} colourMode={colourMode} />
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
                    type="button"
                    onClick={() => {
                      setContinuousPlay(false)
                      setDuration(ms)
                      setCustomMinutes('')
                    }}
                    className="py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: !continuousPlay && duration === ms
                        ? `linear-gradient(135deg, ${CLOCK_HEX[wheelA]}22 0%, ${CLOCK_HEX[wheelB]}22 100%)`
                        : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${!continuousPlay && duration === ms ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}`,
                      color: !continuousPlay && duration === ms ? '#fff' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setContinuousPlay(true)
                    setDuration(null)
                    setCustomMinutes('')
                  }}
                  className="col-span-2 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: continuousPlay
                      ? `linear-gradient(135deg, ${CLOCK_HEX[wheelA]}28 0%, ${CLOCK_HEX[wheelB]}28 100%)`
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${continuousPlay ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)'}`,
                    color: continuousPlay ? '#fff' : 'rgba(255,255,255,0.45)',
                  }}
                >
                  Continuous play
                </button>
              </div>

              {/* Custom duration */}
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={customMinutes}
                  onChange={e => handleCustomMinutes(e.target.value)}
                  placeholder="—"
                  className="w-20 text-center bg-white/5 border border-white/10 rounded-lg py-2 text-sm text-white/70 focus:outline-none focus:border-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{
                    borderColor: customMinutes && !DURATION_OPTIONS.some(o => o.ms === duration)
                      ? 'rgba(255,255,255,0.3)'
                      : undefined,
                    color: customMinutes && !DURATION_OPTIONS.some(o => o.ms === duration)
                      ? '#fff'
                      : undefined,
                  }}
                />
                <span className="text-xs text-white/30 tracking-widest uppercase">min</span>
              </div>
            </div>

            {/* Back + Begin */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setPhase('select')
                  setDuration(null)
                  setContinuousPlay(false)
                  setCustomMinutes('')
                }}
                className="px-5 py-2.5 rounded-full text-xs font-medium text-white/40 border border-white/10 hover:border-white/20 hover:text-white/60 transition-all"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => (duration !== null || continuousPlay) && setPhase('session')}
                disabled={duration === null && !continuousPlay}
                className="px-8 py-2.5 rounded-full text-sm font-medium transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                style={{
                  background: duration !== null || continuousPlay
                    ? `linear-gradient(135deg, ${CLOCK_HEX[wheelA]}44 0%, ${CLOCK_HEX[wheelB]}44 100%)`
                    : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${duration !== null || continuousPlay ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
                  color: duration !== null || continuousPlay ? '#fff' : 'rgba(255,255,255,0.3)',
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
