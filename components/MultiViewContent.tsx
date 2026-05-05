'use client'

import { useState, useEffect, useRef, useCallback, Fragment } from 'react'
import { useTheme } from '@/app/ThemeContext'
import DotNavigation from '@/components/DotNavigation'
import { clockSettings } from '@/lib/clockSettings'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { clockSatellites, defaultSatelliteConfigs } from '@/lib/satelliteDefaults'
import { SatelliteNameLabel } from '@/components/SatelliteNameLabel'
import { MandalaCeremony } from '@/components/MandalaCeremony'
import { Volume2, VolumeX } from 'lucide-react'
import { useNineWheelTones } from '@/lib/hooks/useNineWheelTones'
import { cn } from '@/lib/utils'

const MUTE_KEY = 'mindmechanism.clockSoundMuted'

function readMuted(): boolean {
  if (typeof window === 'undefined') return false
  try { return localStorage.getItem(MUTE_KEY) === 'true' } catch { return false }
}

function MultiView1SoundLayer({ isDarkMode }: { isDarkMode: boolean }) {
  const [muted, setMuted] = useState(false)

  useEffect(() => { setMuted(readMuted()) }, [])

  useNineWheelTones(muted)

  const toggle = useCallback(() => {
    setMuted((m) => {
      const next = !m
      try { localStorage.setItem(MUTE_KEY, String(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'absolute bottom-4 right-4 z-[1001] flex h-11 w-11 items-center justify-center rounded-full',
        'border shadow-md backdrop-blur-sm transition-colors pointer-events-auto',
        isDarkMode
          ? 'border-white/15 bg-black/80 text-gray-100 hover:bg-black/90'
          : 'border-black/10 bg-white/90 text-gray-800 hover:bg-white'
      )}
      aria-label={muted ? 'Unmute all wheels' : 'Mute all wheels'}
      title={muted ? 'Sound muted — click to enable' : 'All nine wheels sounding — click to mute'}
    >
      {muted
        ? <VolumeX className="h-5 w-5" aria-hidden />
        : <Volume2 className="h-5 w-5" aria-hidden />}
    </button>
  )
}

type ColourMode = 'colour' | 'mono'

function multiImgSrc(clockIndex: number, mode: ColourMode) {
  return mode === 'colour'
    ? `/clock_${clockIndex + 1}_colour.svg`
    : `/${clockIndex + 1}.svg`
}

function MultiColourToggle({ mode, onChange, isDarkMode }: { mode: ColourMode; onChange: (m: ColourMode) => void; isDarkMode: boolean }) {
  return (
    <div
      className="flex rounded-full overflow-hidden"
      style={{
        fontSize: 9,
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
      }}
    >
      {(['colour', 'mono'] as ColourMode[]).map(m => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className="px-3 py-1 tracking-widest uppercase transition-colors pointer-events-auto"
          style={{
            background: mode === m
              ? (isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)')
              : 'transparent',
            color: mode === m
              ? (isDarkMode ? 'rgba(255,255,255,0.78)' : 'rgba(0,0,0,0.65)')
              : (isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'),
          }}
        >
          {m}
        </button>
      ))}
    </div>
  )
}

export interface MultiViewContentProps {
  type: number
}

/** Large hover/focus background clock on /layers (outer ring only). */
const LAYERS_LARGE_BG_CLOCK_OPACITY_LIGHT = 0.03
const LAYERS_LARGE_BG_CLOCK_OPACITY_DARK = 0.09

const CLOCK_HEX = ['#fd290a','#fba63b','#f7da5f','#6dc037','#156fde','#941952','#541b96','#ee5fa7','#56c1ff']

export function MultiViewContent({ type }: MultiViewContentProps) {
  const [showElements, setShowElements] = useState(true)
  const [colourMode, setColourMode] = useState<ColourMode>('mono')
  const { isDarkMode } = useTheme()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const isMultiView2 = type === 2
  const [hoveredOuterClockIndex, setHoveredOuterClockIndex] = useState<number | null>(null)
  const [focusedOuterClockIndex, setFocusedOuterClockIndex] = useState<number | null>(null)
  const [rotationValues, setRotationValues] = useState<Record<number, number[]>>({})
  const animationRef = useRef<number>()
  const [visibleNumbers, setVisibleNumbers] = useState<Record<number, boolean>>({})
  const numberTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

  const showNumberForClock = useCallback((index: number) => {
    if (numberTimersRef.current[index]) clearTimeout(numberTimersRef.current[index])
    setVisibleNumbers((prev) => ({ ...prev, [index]: true }))
    numberTimersRef.current[index] = setTimeout(() => {
      setVisibleNumbers((prev) => ({ ...prev, [index]: false }))
    }, 3000)
  }, [])

  useEffect(() => {
    const timers = numberTimersRef.current
    return () => { Object.values(timers).forEach(clearTimeout) }
  }, [])

  // Initialize and update current time with optimized animation frame
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date())
      animationRef.current = requestAnimationFrame(updateTime)
    }
    updateTime()
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Memoize satellite positions for better performance
  const getSatellitePosition = useCallback((index: number, satelliteIndex: number, totalSatellites: number) => {
    const baseAngle = (satelliteIndex * 360) / totalSatellites;
    const radius = 58.5;
    const rotation = rotationValues[index]?.[satelliteIndex] || 0;
    const rotatedRadians = ((baseAngle + rotation) % 360) * (Math.PI / 180);
    const x = 49 + radius * Math.cos(rotatedRadians - Math.PI / 2);
    const y = 48 + radius * Math.sin(rotatedRadians - Math.PI / 2);
    return { x, y };
  }, [rotationValues]);

  // Satellite orbit angles (single RAF loop; was duplicated and shared one ref, which broke updates)
  useEffect(() => {
    if (type !== 1) return

    const tick = () => {
      const now = Date.now()
      const newRotations: Record<number, number[]> = {}

      clockSettings.forEach((clock, clockIndex) => {
        if (!clockSatellites[clockIndex]) return

        const elapsedMilliseconds = now - clock.startDateTime.getTime()
        const configs = defaultSatelliteConfigs[clockIndex] || []

        newRotations[clockIndex] = configs.map((config) => {
          const satelliteRotation = (elapsedMilliseconds / config.rotationTime) * 360
          return config.rotationDirection === 'clockwise'
            ? satelliteRotation % 360
            : (-satelliteRotation + 360) % 360
        })
      })

      setRotationValues(newRotations)
      animationRef.current = requestAnimationFrame(tick)
    }

    tick()
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [type, clockSettings])

  // Calculate rotation for each clock
  const getClockRotation = (clock: typeof clockSettings[0]) => {
    if (!currentTime) return 0
    const elapsedMilliseconds = currentTime.getTime() - clock.startDateTime.getTime()
    const calculatedRotation = (elapsedMilliseconds / clock.rotationTime) * 360
    return clock.rotationDirection === 'clockwise'
      ? (clock.startingDegree + calculatedRotation) % 360
      : (clock.startingDegree - calculatedRotation + 360) % 360
  }

  // Focus node colors from individual clocks (match Clock.tsx dotColors)
  const focusNodeColors = [
    'bg-[#fd290a]', // 1. Red
    'bg-[#fba63b]', // 2. Orange
    'bg-[#f7da5f]', // 3. Yellow
    'bg-[#6dc037]', // 4. Green
    'bg-[#156fde]', // 5. Blue
    'bg-[#941952]', // 6. Dark Pink
    'bg-[#541b96]', // 7. Purple
    'bg-[#ee5fa7]', // 8. Pink
    'bg-[#56c1ff]', // 9. Light Blue
  ]

  // Match clock pages 0–8: focus nodes at 12 o'clock (270°) then evenly spaced; radius 55; focus node layer rotated by imageOrientation

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-black/90 overflow-hidden">
      {/* Navigation Layer */}
      <div className="fixed inset-0 pointer-events-none z-[999]">
        {showElements && (
          <DotNavigation
            activeDot={9}
            isSmallMultiView={type === 2}
          />
        )}
        {!isMultiView2 && (
          <>
            {/* Colour / Mono toggle — bottom left */}
            <div className="absolute bottom-4 left-4">
              <MultiColourToggle mode={colourMode} onChange={setColourMode} isDarkMode={isDarkMode} />
            </div>
            {/* Nine-wheel sound + mute toggle — bottom right */}
            <MultiView1SoundLayer isDarkMode={isDarkMode} />
          </>
        )}
        {isMultiView2 && (
            /* Heading bottom-left, colour toggle bottom-right — tight right inset still clears dot dock */
            <div
              style={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                right: 32,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div style={{ pointerEvents: 'none', textAlign: 'left' }}>
                <div style={{ fontSize: 10, color: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 4, fontWeight: 700 }}>
                  The Mind Mechanism
                </div>
                <div style={{ fontSize: 34, fontWeight: 900, color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)', letterSpacing: '0.03em', textTransform: 'uppercase', lineHeight: 1 }}>
                  Multiview
                </div>
                <div style={{ marginTop: 8, fontSize: 9, color: isDarkMode ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  © 2026 Sean Fortune · All Rights Reserved
                </div>
              </div>
              <div style={{ pointerEvents: 'auto', flexShrink: 0 }}>
                <MultiColourToggle mode={colourMode} onChange={setColourMode} isDarkMode={isDarkMode} />
              </div>
            </div>
        )}
      </div>

      {/* Content Layer */}
      <div className="relative flex-grow flex items-center justify-center z-0">
        {type === 1 && (
          <div className="relative w-[600px] h-[600px]">
            {clockSettings.map((clock, index) => {
              const rotation = getClockRotation(clock)
              return (
                <div
                  key={index}
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  style={{
                    mixBlendMode: isDarkMode ? 'screen' : 'multiply',
                  }}
                >
                  <div className="pointer-events-none relative h-full w-full">
                    {/* Clock face with shorter initial animation */}
                    <div className="pointer-events-none absolute inset-0">
                      <motion.div
                        className="pointer-events-none absolute inset-0"
                        animate={{ rotate: rotation }}
                        transition={{
                          duration: 0.3, // Shortened from 1 to 0.3
                          ease: "easeOut",
                        }}
                        style={{
                          transformOrigin: 'center',
                        }}
                      >
                        <div
                          className="pointer-events-none absolute inset-0"
                          style={{
                            transform: `translate(${clock.imageX || 0}%, ${clock.imageY || 0}%) rotate(${clock.imageOrientation}deg) scale(${clock.imageScale})`,
                            transformOrigin: 'center',
                          }}
                        >
                          <Image
                            src={multiImgSrc(index, colourMode)}
                            alt={`Clock ${index + 1}`}
                            fill
                            className={`pointer-events-none object-cover rounded-full ${colourMode === 'mono' ? 'dark:invert dark:brightness-100 [&_*]:fill-current [&_*]:stroke-none' : ''}`}
                            priority
                            loading="eager"
                          />
                        </div>
                      </motion.div>
                    </div>

                    {/* Focus nodes moved slightly inward */}
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                      }}
                    >
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="relative h-full w-full rounded-full">
                          {Array.from({ length: clock.focusNodes }).map((_, nodeIndex) => {
                            const angle = (nodeIndex * 360) / clock.focusNodes
                            const radius = 53 // Reduced from 55 to move focus nodes inward
                            const x = 50 + radius * Math.cos((angle - 90) * (Math.PI / 180))
                            const y = 50 + radius * Math.sin((angle - 90) * (Math.PI / 180))
                            return (
                              <motion.div
                                key={nodeIndex}
                                className="pointer-events-none absolute w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: CLOCK_HEX[index],
                                  left: `${x}%`,
                                  top: `${y}%`,
                                  transform: 'translate(-50%, -50%)',
                                  mixBlendMode: isDarkMode ? 'screen' : 'multiply',
                                  boxShadow: isDarkMode
                                    ? '0 0 4px rgba(255, 255, 255, 0.3)'
                                    : '0 0 4px rgba(0, 0, 0, 0.2)'
                                }}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                  duration: 0.3,
                                  delay: nodeIndex * 0.05,
                                  ease: "easeOut"
                                }}
                              />
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Satellites with reduced shadow and smoother animation */}
                    {clockSatellites[index] > 0 && (
                      <div className="pointer-events-none absolute inset-0">
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <div className="relative h-full w-full rounded-full">
                            {Array.from({ length: clockSatellites[index] }).map((_, satelliteIndex) => {
                              const { x, y } = getSatellitePosition(index, satelliteIndex, clockSatellites[index])
                              const cfg = defaultSatelliteConfigs[index]?.[satelliteIndex]
                              const accent = cfg?.pulseColor
                              const bg = accent ?? (isDarkMode ? '#fff' : '#000')
                              const shadow = accent
                                ? `0 0 8px ${accent}aa`
                                : isDarkMode
                                  ? '0 0 6px rgba(255, 255, 255, 0.3)'
                                  : '0 0 6px rgba(0, 0, 0, 0.3)'
                              return (
                                <motion.div
                                  key={satelliteIndex}
                                  className="pointer-events-auto absolute z-[5] cursor-pointer p-2"
                                  style={{
                                    left: `${x}%`,
                                    top: `${y}%`,
                                    transform: 'translate(-50%, -50%)',
                                    willChange: 'transform',
                                  }}
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={
                                    cfg?.pulsing
                                      ? { opacity: [0.15, 1, 0.35, 1, 0.15], scale: [0.88, 1.08, 0.94, 1.04, 0.88] }
                                      : { opacity: 1, scale: 1 }
                                  }
                                  transition={{
                                    duration: cfg?.pulsing ? 1.25 : 0.3,
                                    delay: cfg?.pulsing ? 0 : 0.3 + satelliteIndex * 0.05,
                                    ease: 'easeInOut',
                                    repeat: cfg?.pulsing ? Infinity : 0,
                                    times: cfg?.pulsing ? [0, 0.18, 0.38, 0.62, 1] : undefined,
                                  }}
                                  whileHover={{ scale: 1.8 }}
                                >
                                  <SatelliteNameLabel name={cfg?.name} compact>
                                    <div
                                      className="h-3 w-3 rounded-full"
                                      style={{
                                        backgroundColor: bg,
                                        boxShadow: shadow,
                                      }}
                                    />
                                  </SatelliteNameLabel>
                                </motion.div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {type === 2 && (
          <>
          <div className="relative w-[450px] h-[450px]">
            {/* Satellite grid pattern - 30% less visible */}
            <motion.div 
              className="absolute inset-[-25%] rounded-full overflow-hidden"
              style={{ zIndex: 20 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src="/satellite-grid.jpg"
                  alt="Satellite Grid Pattern"
                  fill
                  className="object-cover dark:invert opacity-70"
                  priority
                />
              </div>
            </motion.div>

            {/* Large hover/focus background clock */}
            {(hoveredOuterClockIndex !== null || focusedOuterClockIndex !== null) && (() => {
              const index = hoveredOuterClockIndex ?? focusedOuterClockIndex ?? 0
              const clock = clockSettings[index]
              if (!clock) return null
              const clockRotation = focusedOuterClockIndex === index ? 0 : getClockRotation(clock)
              const hex = CLOCK_HEX[index] ?? '#ffffff'
              const imgTransform = `translate(${clock.imageX ?? 0}%, ${clock.imageY ?? 0}%) rotate(${clock.imageOrientation ?? 0}deg) scale(${clock.imageScale ?? 1})`
              return (
                <motion.div
                  key={`large-hover-clock-${index}`}
                  className="fixed inset-0 pointer-events-none"
                  style={{ zIndex: 25 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className="fixed top-1/2 right-8 w-[2500px] aspect-square"
                    style={{ transform: 'translate(50%, -50%)', transformOrigin: 'center' }}
                  >
                    {/* Dark mode: static colored fog/glow behind the rotating mandala */}
                    {isDarkMode && (
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `radial-gradient(circle, ${hex}18 0%, ${hex}08 40%, transparent 68%)`,
                        }}
                      />
                    )}

                    <motion.div
                      className="absolute inset-0 rounded-full overflow-visible"
                      style={{ transformOrigin: 'center', willChange: 'transform' }}
                      animate={{ rotate: clockRotation }}
                      transition={{ type: 'tween', duration: focusedOuterClockIndex === index ? 0.3 : 0.016, ease: 'linear' }}
                    >
                      {/* Mandala structure */}
                      <div
                        className="absolute inset-0"
                        style={{
                          opacity: isDarkMode ? LAYERS_LARGE_BG_CLOCK_OPACITY_DARK : LAYERS_LARGE_BG_CLOCK_OPACITY_LIGHT,
                          transform: imgTransform,
                          willChange: 'transform',
                          transformOrigin: 'center',
                          mixBlendMode: isDarkMode ? 'screen' : 'multiply',
                        }}
                      >
                        <Image
                          src={multiImgSrc(index, colourMode)}
                          alt=""
                          fill
                          className={`object-cover rounded-full ${colourMode === 'mono' ? 'dark:invert dark:brightness-100 [&_*]:fill-current [&_*]:stroke-none' : ''}`}
                          priority
                          loading="eager"
                        />
                      </div>

                      {/* Dark mode: color-tint overlay — multiply turns white mandala lines → clock color */}
                      {isDarkMode && (
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{
                            transform: imgTransform,
                            transformOrigin: 'center',
                            backgroundColor: hex,
                            opacity: 0.06,
                            mixBlendMode: 'multiply',
                          }}
                        />
                      )}
                    </motion.div>

                    {/* Hover animation overlay — ceremony pulse, clipped to circle */}
                    <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                      <MandalaCeremony clockHex={hex} onComplete={() => {}} loop={true} />
                    </div>
                  </div>
                </motion.div>
              )
            })()}

            {/* Center layered clocks with optimized rendering */}
            <motion.div 
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] aspect-square" 
              style={{ zIndex: 40 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {clockSettings.slice(0, 9).map((clock, index) => {
                const clockRotation = getClockRotation(clock)
                return (
                <div
                  key={index}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    mixBlendMode: isDarkMode ? 'screen' : 'multiply',
                  }}
                >
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0">
                      <motion.div
                        className="absolute inset-0"
                        style={{ transformOrigin: 'center', willChange: 'transform' }}
                        animate={{ rotate: clockRotation }}
                        transition={{ type: 'tween', duration: 0.016, ease: 'linear' }}
                      >
                        <div
                          className="absolute inset-0"
                          style={{
                            transform: `translate(${clock.imageX || 0}%, ${clock.imageY || 0}%) rotate(${clock.imageOrientation}deg) scale(${clock.imageScale})`,
                            transformOrigin: 'center',
                          }}
                        >
                          <Image
                            src={multiImgSrc(index, colourMode)}
                            alt={`Clock ${index + 1}`}
                            fill
                            className={`object-cover rounded-full ${colourMode === 'mono' ? 'dark:invert dark:brightness-100 [&_*]:fill-current [&_*]:stroke-none' : ''}`}
                            priority
                            loading="eager"
                          />
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              )})}
            </motion.div>

            {/* Outer ring clocks - z-50 above center; pointer-events-none on container so only clock divs receive hover */}
            <motion.div 
              className="absolute inset-0 pointer-events-none"
              style={{ zIndex: 50 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              {clockSettings.slice(0, 9).map((clock, index) => {
                const liveRotation = getClockRotation(clock)
                const clockRotation = focusedOuterClockIndex === index ? 0 : liveRotation
                
                // Map indices: Clock 1/6 swapped; Clock 7 in position of 1, Clock 1 in position of 7
                const positionIndex = index === 0 ? 5 : // Clock 1 in position of 7
                                    index === 5 ? 0 : // Clock 6 to position 1
                                    index === 3 ? 1 : // Clock 4 to position 2
                                    index === 8 ? 2 : // Clock 9 to position 3
                                    index === 2 ? 3 : // Clock 3 to position 4
                                    index === 6 ? 4 : // Clock 7 in position of 1
                                    index === 4 ? 6 : // Clock 5 to position 7
                                    index === 1 ? 7 : // Clock 2 to position 8
                                    index === 7 ? 8 : // Clock 8 to position 9
                                    index;
                
                // Calculate position for outer clock
                const angle = 270 + 20 + (360 / 9) * positionIndex;
                const radius = 72;
                const radians = angle * (Math.PI / 180);
                const x = 50 + radius * Math.cos(radians);
                const y = 50 + radius * Math.sin(radians);

                const isHighlighted = hoveredOuterClockIndex === index || focusedOuterClockIndex === index
                const labelRadius = 82
                const labelX = 50 + labelRadius * Math.cos(radians)
                const labelY = 50 + labelRadius * Math.sin(radians)
                return (
                  <Fragment key={index}>
                    {/* Clock number — fades in on hover, fades out 3s after pointer leaves */}
                    <AnimatePresence>
                      {visibleNumbers[index] && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.4 }}
                          className="absolute flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400 pointer-events-none"
                          style={{
                            left: `${labelX}%`,
                            top: `${labelY}%`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: 55,
                          }}
                        >
                          {index + 1}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div
                      className="absolute aspect-square transition-transform duration-200 pointer-events-auto cursor-pointer"
                      style={{
                        width: '28%',
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 30,
                      }}
                      onMouseEnter={() => { setHoveredOuterClockIndex(index); showNumberForClock(index) }}
                      onMouseLeave={() => setHoveredOuterClockIndex(null)}
                      onClick={() => setFocusedOuterClockIndex((prev) => (prev === index ? null : index))}
                    >
                      <div className="relative w-full h-full">
                        <motion.div
                        className="absolute inset-0 rounded-full overflow-visible"
                        style={{ transformOrigin: 'center', willChange: 'transform' }}
                        animate={{ rotate: clockRotation }}
                        transition={{ type: 'tween', duration: focusedOuterClockIndex === index ? 0.3 : 0.016, ease: 'linear' }}
                      >
                        <div
                          className="absolute inset-0 transition-[filter,opacity] duration-200"
                          style={{
                            transform: `translate(${clock.imageX ?? 0}%, ${clock.imageY ?? 0}%) rotate(${clock.imageOrientation ?? 0}deg) scale(${clock.imageScale ?? 1})`,
                            willChange: 'transform',
                            transformOrigin: 'center',
                            mixBlendMode: isHighlighted ? 'normal' : 'multiply',
                          }}
                        >
                          <Image 
                            src={multiImgSrc(index, colourMode)}
                            alt={`Clock ${index + 1}`}
                            fill
                            className={`object-cover rounded-full ${colourMode === 'mono' ? 'dark:invert dark:brightness-100 [&_*]:fill-current [&_*]:stroke-none' : ''}`}
                            priority
                            loading="eager"
                          />
                        </div>
                        {/* Focus nodes — always visible: greyed by default, color on hover, full color on enter (focus) */}
                        <div
                          className="absolute inset-0 pointer-events-none transition-[filter,opacity] duration-200"
                          style={{
                            transform: `rotate(${clock.imageOrientation ?? 0}deg)`,
                            transformOrigin: 'center',
                          }}
                        >
                          {Array.from({ length: clock.focusNodes }).map((_, nodeIndex) => {
                            const angle = ((360 / clock.focusNodes) * nodeIndex + 270) % 360
                            const radians = angle * (Math.PI / 180)
                            const nodeRadius = 55
                            const x = 50 + nodeRadius * Math.cos(radians)
                            const y = 50 + nodeRadius * Math.sin(radians)
                            const showColor = isHighlighted
                            return (
                              <div
                                key={nodeIndex}
                                className={`absolute w-2 h-2 rounded-full transition-all duration-200 ${
                                  showColor ? '' : 'bg-gray-400 dark:bg-gray-500 opacity-60'
                                }`}
                                style={{
                                  backgroundColor: showColor ? CLOCK_HEX[index] : undefined,
                                  left: `${x}%`,
                                  top: `${y}%`,
                                  transform: 'translate(-50%, -50%)',
                                  mixBlendMode: showColor ? (isDarkMode ? 'screen' : 'multiply') : 'normal',
                                  boxShadow: showColor
                                    ? (isDarkMode
                                        ? '0 0 4px rgba(255, 255, 255, 0.3)'
                                        : '0 0 4px rgba(0, 0, 0, 0.2)')
                                    : 'none',
                                }}
                              />
                            )
                          })}
                        </div>
                      </motion.div>
                      {isHighlighted && currentTime != null && (
                        <div className="absolute left-1/2 top-full -translate-x-1/2 mt-1.5 text-center text-xs font-mono tabular-nums text-gray-700 dark:text-gray-300 whitespace-nowrap z-50 pointer-events-none">
                          {(() => {
                            const r = clockRotation
                            const signed = r > 180 ? r - 360 : r
                            return `${signed.toFixed(3)}°`
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                  </Fragment>
                );
              })}
            </motion.div>
          </div>
          </>
        )}
      </div>
    </div>
  )
}
