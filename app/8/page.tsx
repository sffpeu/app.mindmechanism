'use client'

import { useState, useEffect, Suspense, useRef, useCallback, Fragment } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '@/app/ThemeContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ClockBreathingTone } from '@/components/ClockBreathingTone'
import { ClockBreathingGlow } from '@/components/ClockBreathingGlow'
import { useHueSync } from '@/lib/hooks/useHueSync'
import { useIdleFade } from '@/lib/hooks/useIdleFade'
import { ClockFocusNodeAppear } from '@/components/ClockFocusNodeAppear'
import { ClockPageSettingsTrigger } from '@/components/ClockPageSettingsTrigger'
import { motion, AnimatePresence } from 'framer-motion'
import { clockSettings } from '@/lib/clockSettings'
import Image from 'next/image'
import { List, Satellite, HelpCircle, Book, User, Edit, LogOut, Play, BookOpen, Library, Sun, Moon, MapPin, Cloud, Droplets, Wind, X } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useSearchParams, useRouter } from 'next/navigation'
import Timer from '@/components/Timer'
import { DraggableClockPanel, ClockPanelRow } from '@/components/DraggableClockPanel'
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { GlossaryWord } from '@/types/Glossary'
import { getAllWords } from '@/lib/glossary'
import Clock, { defaultSatelliteConfigs } from '@/components/Clock'
import { ClockWheelFaceOverlay } from '@/components/ClockWheelFaceOverlay'
import { ClockVideoOverlay } from '@/components/ClockVideoOverlay'
import { ClockPageSatelliteLayer } from '@/components/ClockPageSatelliteLayer'
import { SessionTimer } from '@/components/SessionTimer'
import { SessionPresenceBroadcast } from '@/components/SessionPresenceBroadcast'
import { useSessionTimer } from '@/lib/useSessionTimer'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { useLocation } from '@/lib/hooks/useLocation'
import { useClockEntrance } from '@/lib/hooks/useClockEntrance'
import DotNavigation from '@/components/DotNavigation'
import { clockTitles } from '@/lib/clockTitles'
import { DEFAULT_WORDS_BY_CLOCK } from '@/lib/defaultWordsByClock'
import { cn } from '@/lib/utils'
import { CurvedCircleWordLabel } from '@/components/CurvedCircleWordLabel'
import { wordProgressAlongProgressRing } from '@/lib/sessionWordRingFill'
import { getSession } from '@/lib/sessions'
import { MandalaCeremony } from '@/components/MandalaCeremony'

// Weather and Moon data interfaces
interface WeatherResponse {
  location: {
    name: string
    region: string
    country: string
    lat: number
    lon: number
    tz_id: string
    localtime: string
  }
  current: {
    temp_c: number
    condition: {
      text: string
      icon: string
    }
    humidity: number
    uv: number
    pressure_mb: number
    wind_kph: number
    wind_dir: string
    air_quality: {
      'us-epa-index': number
    }
  }
}

interface MoonData {
  moon_phase: string
  moon_illumination: string
  moonrise: string
  moonset: string
  next_full_moon: string
  next_new_moon: string
}

// Clock 1–9 hex palette; this page uses index 8 (clock 9)
const CLOCK_INDEX = 8
const CLOCK_HEX = ['#fd290a', '#fba63b', '#f7da5f', '#6dc037', '#156fde', '#941952', '#541b96', '#ee5fa7', '#56c1ff']
const clockHex = CLOCK_HEX[CLOCK_INDEX]
const satelliteConfigs = defaultSatelliteConfigs[CLOCK_INDEX] ?? []


function NodesPageContent() {
  const searchParams = useSearchParams()
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showSatellites')
      return saved ? JSON.parse(saved) : true // Default to true for individual clock pages
    }
    return true
  })
  const [selectedNodeIndices, setSelectedNodeIndices] = useState<number[]>([])
  const [hoveredNodeIndex, setHoveredNodeIndex] = useState<number | null>(null)
  const [nodeNumbersVisible, setNodeNumbersVisible] = useState(true)
  const nodeNumberTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetNodeNumberTimer = useCallback(() => {
    setNodeNumbersVisible(true)
    if (nodeNumberTimerRef.current) clearTimeout(nodeNumberTimerRef.current)
    nodeNumberTimerRef.current = setTimeout(() => setNodeNumbersVisible(false), 3000)
  }, [])
  const [showWords, setShowWords] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showWords')
      return saved ? JSON.parse(saved) : true
    }
    return true
  })
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { isDarkMode, setIsDarkMode } = useTheme()
  const [remainingTime, setRemainingTime] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [showCeremony, setShowCeremony] = useState(false)
  const [colourMode, setColourMode] = useState<'colour' | 'mono'>('mono')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [glossaryWords, setGlossaryWords] = useState<GlossaryWord[]>([])
  const [loadingGlossary, setLoadingGlossary] = useState(true)
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [pillHoveredNodeIndex, setPillHoveredNodeIndex] = useState<number | null>(null)
  const [glossaryOpenForNode, setGlossaryOpenForNode] = useState<number | null>(null)
  const [cardPosition, setCardPosition] = useState<{ x: number; y: number } | null>(null)
  const dragRef = useRef<{ startX: number; startY: number; startLeft: number; startTop: number } | null>(null)
  const isMountedRef = useRef(true)
  const dragListenersRef = useRef<{ onMove: ((e: MouseEvent) => void) | null; onUp: (() => void) | null }>({ onMove: null, onUp: null })
  const [customWords, setCustomWords] = useState<string[]>([])
  const [duration, setDuration] = useState<number | null>(null)
  const [originalDuration, setOriginalDuration] = useState<number | null>(null)
  const [originalDurationFromUrl] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null
    const p = new URLSearchParams(window.location.search)
    const v = p.get('originalDuration')
    if (!v) return null
    const n = parseInt(v, 10)
    return !Number.isNaN(n) && n > 0 ? n : null
  })
  const [sessionTotalDuration, setSessionTotalDuration] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showUserSatelliteTime, setShowUserSatelliteTime] = useState(false)

  // Overlay state management
  const router = useRouter()
  useHueSync(CLOCK_INDEX)
  const { isIdle } = useIdleFade()
  const { user, signOut } = useAuth()
  const { location } = useLocation()
  const [mounted, setMounted] = useState(false)
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null)
  const [moon, setMoon] = useState<MoonData | null>(null)
  const [isWeatherLoading, setIsWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [customLocation, setCustomLocation] = useState('')
  const [isEditingLocation, setIsEditingLocation] = useState(false)

  // Get clock 8 settings
  const clockSettingsIndex = 8
  const currentClockSettings = clockSettings[clockSettingsIndex]
  const focusNodes = currentClockSettings.focusNodes
  const startingDegree = currentClockSettings.startingDegree
  const rotationTime = currentClockSettings.rotationTime
  const rotationDirection = currentClockSettings.rotationDirection

  // Calculate rotation
  const [rotation, setRotation] = useState(startingDegree)
  const [currentDegree, setCurrentDegree] = useState(startingDegree)
  const [entranceOffset, triggerCompleteSpin] = useClockEntrance()

  // Helper functions
  const handleSignOut = async () => {
    await signOut()
    router.push('/home')
  }

  const handleLocationSave = () => {
    setIsEditingLocation(false)
    // The weather data will be refetched automatically due to the useEffect dependency
  }

  const getAQIDescription = (index: number) => {
    const descriptions = {
      1: 'Good',
      2: 'Moderate',
      3: 'Unhealthy for sensitive groups',
      4: 'Unhealthy',
      5: 'Very Unhealthy',
      6: 'Hazardous'
    }
    return descriptions[index as keyof typeof descriptions] || 'Unknown'
  }

  // Initialize session from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const durationParam = params.get('duration')
    const originalDurationParam = params.get('originalDuration')
    const sessionIdParam = params.get('sessionId')
    const wordsParam = params.get('words')
    
    if (durationParam) {
      setDuration(parseInt(durationParam, 10))
    }
    if (originalDurationParam) {
      setOriginalDuration(parseInt(originalDurationParam, 10))
    }
    if (sessionIdParam) {
      setSessionId(sessionIdParam)
    }
    if (wordsParam) {
      try {
        const decodedWords = JSON.parse(decodeURIComponent(wordsParam))
        setCustomWords(decodedWords)
        // Auto-select all nodes that have a word assigned when session starts
        const autoSelected = (decodedWords as string[])
          .map((w: string, i: number) => (w?.trim() ? i : -1))
          .filter((i: number) => i >= 0)
        if (autoSelected.length > 0) setSelectedNodeIndices(autoSelected)
      } catch (error) {
        console.error('Error decoding words:', error)
        setCustomWords([])
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!sessionId) return
    getSession(sessionId).then((session) => {
      if (session?.duration != null && session.duration > 0) {
        setSessionTotalDuration(session.duration)
      }
    })
  }, [sessionId])

  // Handle mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch weather and moon data
  useEffect(() => {
    if (!mounted) return

    const fetchData = async () => {
      setIsWeatherLoading(true)
      try {
        const locationQuery = customLocation || (location?.coords ? `${location.coords.lat},${location.coords.lon}` : 'auto:ip')
        
        const weatherRes = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=6cb652a81cb64a19a84103447252001&q=${locationQuery}&aqi=yes`
        )
        if (!weatherRes.ok) {
          throw new Error('Weather API request failed')
        }
        const weatherData = await weatherRes.json()
        setWeatherData(weatherData)
        setWeatherError(null)

        const astronomyRes = await fetch(
          `https://api.weatherapi.com/v1/astronomy.json?key=6cb652a81cb64a19a84103447252001&q=${locationQuery}`
        )
        if (!astronomyRes.ok) {
          throw new Error('Astronomy API request failed')
        }
        const astronomyData = await astronomyRes.json()
        setMoon(astronomyData.astronomy.astro)
      } catch (error) {
        console.error('Error fetching weather data:', error)
        setWeatherError(error instanceof Error ? error.message : 'Failed to load weather data')
      } finally {
        setIsWeatherLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5 * 60 * 1000) // Update every 5 minutes
    return () => clearInterval(interval)
  }, [mounted, location?.coords, customLocation])

  // Handle session completion
  const handleSessionComplete = () => {
    setShowCeremony(true)
    localStorage.removeItem('pendingSession')
    triggerCompleteSpin()
  }

  const sessionState = useSessionTimer(duration, sessionId, handleSessionComplete)

  const handlePauseResume = () => {
    if (duration != null) sessionState.onPauseResume()
    else setIsPaused((p) => !p)
  }

  // Timer countdown effect
  useEffect(() => {
    if (!remainingTime || isPaused) return

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (!prev || prev <= 0) {
          clearInterval(timer)
          return 0
        }
        return prev - 1000
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [remainingTime, isPaused])

  useEffect(() => {
    const startDateTime = currentClockSettings.startDateTime
    const animate = () => {
      const now = Date.now()
      const elapsedMilliseconds = now - startDateTime.getTime()
      const calculatedRotation = (elapsedMilliseconds / rotationTime) * 360
      const newRotation = rotationDirection === 'clockwise'
        ? (startingDegree + calculatedRotation) % 360
        : (startingDegree - calculatedRotation + 360) % 360

      setRotation(newRotation)
      setCurrentDegree(newRotation)
      requestAnimationFrame(animate)
    }

    const animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [startingDegree, rotationTime, rotationDirection, currentClockSettings.startDateTime])

  // Load glossary words
  useEffect(() => {
    const loadGlossaryWords = async () => {
      try {
        const words = await getAllWords()
        setGlossaryWords(words)
      } catch (error) {
        console.error('Error loading glossary words:', error)
      } finally {
        setLoadingGlossary(false)
      }
    }
    loadGlossaryWords()
  }, [])

  const handleNodeClick = (index: number) => {
    setSelectedNodeIndices((prev) =>
      prev.includes(index) ? prev.filter((j) => j !== index) : [...prev, index]
    )
  }

  const getSentimentStyles = (rating: '+' | '~' | '-' | undefined) => {
    const r = rating ?? '~'
    if (r === '+') return { pillFillClass: 'bg-emerald-100/90 dark:bg-emerald-500/20', cardOutline: '0 0 0 2px #10b981' }
    if (r === '-') return { pillFillClass: 'bg-rose-100/90 dark:bg-rose-500/20', cardOutline: '0 0 0 2px #f43f5e' }
    return { pillFillClass: 'bg-slate-100/90 dark:bg-slate-500/20', cardOutline: '0 0 0 2px #64748b' }
  }
  useEffect(() => {
    if (!selectedWord) {
      setCardPosition(null)
      setGlossaryOpenForNode(null)
    }
  }, [selectedWord])
  useEffect(() => { isMountedRef.current = true; return () => { isMountedRef.current = false; const { onMove, onUp } = dragListenersRef.current; if (onMove) window.removeEventListener('mousemove', onMove); if (onUp) window.removeEventListener('mouseup', onUp); dragListenersRef.current = { onMove: null, onUp: null } } }, [])
  const handleCardDragStart = useCallback((e: React.MouseEvent) => { e.preventDefault(); if (!cardPosition) return; dragRef.current = { startX: e.clientX, startY: e.clientY, startLeft: cardPosition.x, startTop: cardPosition.y }; const onMove = (e: MouseEvent) => { if (!dragRef.current || !isMountedRef.current) return; setCardPosition({ x: dragRef.current.startLeft + e.clientX - dragRef.current.startX, y: dragRef.current.startTop + e.clientY - dragRef.current.startY }) }; const onUp = () => { dragRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); dragListenersRef.current = { onMove: null, onUp: null } }; dragListenersRef.current = { onMove, onUp }; window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp) }, [cardPosition])
  const defaultWords = DEFAULT_WORDS_BY_CLOCK[CLOCK_INDEX] ?? []
  const getFocusNodeStyle = (index: number, isSelected: boolean) => {
    const color = clockHex
    return {
      backgroundColor: color,
      border: `2px solid ${color}`,
      width: '18px',
      height: '18px',
      opacity: 1,
      transform: 'translate(-50%, -50%)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: isSelected ? 400 : 200,
      boxShadow: isSelected ? '0 0 0 2px rgba(255,255,255,0.9), 0 0 12px rgba(0,0,0,0.2)' : '0 0 8px rgba(0, 0, 0, 0.2)',
    }
  }

  const handleSatellitesChange = (checked: boolean) => {
    setShowSatellites(checked)
    if (typeof window !== 'undefined') {
      localStorage.setItem('showSatellites', JSON.stringify(checked))
    }
  }

  const handleWordsChange = (checked: boolean) => {
    setShowWords(checked)
    if (typeof window !== 'undefined') {
      localStorage.setItem('showWords', JSON.stringify(checked))
    }
  }



  const remainingSessionTime = duration != null ? (sessionState.remainingTime ?? duration) : null
  const totalForProgress =
    duration != null && duration > 0
      ? sessionTotalDuration ?? originalDurationFromUrl ?? originalDuration ?? duration
      : null
  const sessionProgress =
    totalForProgress != null && totalForProgress > 0 && remainingSessionTime != null
      ? Math.min(1, Math.max(0, (totalForProgress - remainingSessionTime) / totalForProgress))
      : 0
  const isSessionActive = duration != null && duration > 0 && remainingSessionTime != null && remainingSessionTime > 0



  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <ProtectedRoute>
      <ClockBreathingTone clockIndex={CLOCK_INDEX} />
      <div className="h-full overflow-x-hidden flex flex-col bg-gray-50 dark:bg-black/95 min-h-0">
        {/* Settings Dropdown */}
        <div className={cn("fixed top-4 right-14 z-[200] transition-opacity duration-700", isIdle && "opacity-0 pointer-events-none")}>
          <ClockPageSettingsTrigger clockHex={clockHex} onClick={() => setIsDropdownOpen(o => !o)} />
          <DraggableClockPanel open={isDropdownOpen} onClose={() => setIsDropdownOpen(false)} clockHex={clockHex} clockIndex={8}>
              <ClockPanelRow>
                <div className="flex min-w-0 flex-1 items-center gap-1.5 pr-0.5">
                  <Satellite className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="leading-snug">Satellites</span>
                </div>
                <Switch
                  className="origin-right scale-[0.72] shrink-0"
                  checked={showSatellites}
                  onCheckedChange={handleSatellitesChange}
                />
              </ClockPanelRow>
              <ClockPanelRow>
                <div className="flex min-w-0 flex-1 items-center gap-1.5 pr-0.5">
                  <List className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="leading-snug">Focus Words</span>
                </div>
                <Switch
                  className="origin-right scale-[0.72] shrink-0"
                  checked={showWords}
                  onCheckedChange={handleWordsChange}
                />
              </ClockPanelRow>
                      </DraggableClockPanel>
        </div>

        {/* Session pause/resume — bottom left (colour toggle uses same corner at z-[999]) */}
        {remainingTime !== null && (
          <div className={cn("fixed bottom-4 left-4 z-50 transition-opacity duration-700", isIdle && "opacity-0 pointer-events-none")}>
            <Timer
              remainingTime={remainingTime}
              isPaused={isPaused}
              onPauseResume={handlePauseResume}
            />
          </div>
        )}
        {user?.uid && mounted && createPortal(
          <SessionPresenceBroadcast
            uid={user.uid}
            clockIndex={8}
            clockHex={clockHex}
            durationMins={duration != null ? Math.round(duration / 60) : null}
          />,
          document.getElementById('dock-broadcast-slot') ?? document.body
        )}

        <div className="flex-grow flex items-center justify-center min-h-0 overflow-visible py-8">
          <div className="relative w-[82vw] h-[82vw] max-w-[615px] max-h-[615px] overflow-visible" onPointerMove={resetNodeNumberTimer} onPointerDown={resetNodeNumberTimer}>
            <ClockBreathingGlow clockHex={clockHex} sessionActive={isSessionActive} />
            {/* Session progress ring (clock page) */}
            {duration != null && duration > 0 && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 5 }}
                animate={{ rotate: rotation + entranceOffset }}
                transition={{ type: 'tween', duration: entranceOffset > 0 ? 0 : 0.016, ease: 'linear' }}
              >
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="-20 -20 140 140"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ overflow: 'visible' }}
                >
                  <circle
                    cx={50}
                    cy={50}
                    r={91}
                    fill="none"
                    stroke={clockHex}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeDasharray={`${sessionProgress * 2 * Math.PI * 91} ${2 * Math.PI * 91}`}
                    transform="rotate(-90 50 50)"
                    opacity={0.85}
                  />
                </svg>
              </motion.div>
            )}

            {/* Satellites layer (no session progress on clock — progress bar is at bottom of page so it never blocks focus nodes) */}
            {showSatellites && (
              <motion.div
                className="absolute inset-0 overflow-visible pointer-events-none"
                style={{
                  willChange: 'transform',
                  zIndex: 300,
                }}
              >
                <ClockPageSatelliteLayer
                  satellites={satelliteConfigs}
                  startDateTime={currentClockSettings.startDateTime}
                />
              </motion.div>
            )}

            {/* Clock face */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <motion.div 
                className="absolute inset-0"
                style={{ 
                  willChange: 'transform',
                }}
                animate={{ rotate: rotation + entranceOffset }}
                transition={{
                  type: 'tween',
                  duration: entranceOffset > 0 ? 0 : 0.016,
                  ease: 'linear'
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    transform: `translate(${currentClockSettings.imageX}%, ${currentClockSettings.imageY}%) rotate(${currentClockSettings.imageOrientation}deg) scale(${currentClockSettings.imageScale})`,
                    willChange: 'transform',
                    transformOrigin: 'center',
                  }}
                >
                  <Image 
                    src={colourMode === 'colour' ? '/clock_9_colour.svg' : currentClockSettings.imageUrl}
                    alt={`Clock Face ${CLOCK_INDEX + 1}`}
                    layout="fill"
                    objectFit="cover"
                    className={colourMode === 'colour' ? "rounded-full" : "rounded-full dark:invert [&_*]:fill-current [&_*]:stroke-none [&_*]:stroke-[0.5]"}
                    style={colourMode === 'colour' ? { mixBlendMode: 'screen' } : undefined}
                    priority
                    loading="eager"
                  />
                  <ClockWheelFaceOverlay clockId={CLOCK_INDEX} />
                </div>
              </motion.div>
              <ClockVideoOverlay clockId={CLOCK_INDEX} />
              {showCeremony && (
                <MandalaCeremony
                  clockHex={clockHex}
                  onComplete={() => setShowCeremony(false)}
                />
              )}
            </div>

            {/* Focus nodes layer */}
            <motion.div 
              className="absolute inset-0 overflow-visible"
              style={{ 
                willChange: 'transform',
                zIndex: 500,
                pointerEvents: 'none',
              }}
              animate={{ rotate: rotation + entranceOffset }}
              transition={{
                type: 'tween',
                duration: entranceOffset > 0 ? 0 : 0.016,
                ease: 'linear'
              }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{ transform: `rotate(${currentClockSettings.imageOrientation}deg)` }}>
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: focusNodes }).map((_, index) => {
                    const angle = ((360 / focusNodes) * index + 270) % 360
                    const radians = angle * (Math.PI / 180)
                    const nodeRadius = 55 // Increased from 48 to move nodes further out
                    const x = 50 + nodeRadius * Math.cos(radians)
                    const y = 50 + nodeRadius * Math.sin(radians)
                    const isSelected = selectedNodeIndices.includes(index)
                    const word = customWords[index] || defaultWords[index]

                    const nodeStyle = {
                      ...getFocusNodeStyle(index, isSelected),
                      ...(duration != null && hoveredNodeIndex === index && {
                        boxShadow: `0 0 0 2px rgba(255,255,255,0.95), 0 0 0 4px ${clockHex}`,
                      }),
                    }
                    return (
                      <Fragment key={index}>
                        <ClockFocusNodeAppear
                          nodeIndex={index}
                          className="absolute rounded-full cursor-pointer flex items-center justify-center"
                          style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            minWidth: 44,
                            minHeight: 44,
                            transform: 'translate(-50%, -50%)',
                            zIndex: nodeStyle.zIndex,
                          }}
                          onClick={() => handleNodeClick(index)}
                          onMouseEnter={() => setHoveredNodeIndex(index)}
                          onMouseLeave={() => setHoveredNodeIndex(null)}
                        >
                          <span
                            className="flex-shrink-0 flex items-center justify-center text-white text-[10px] font-medium pointer-events-none select-none rounded-full transition-opacity duration-700"
                            style={{
                              ...getFocusNodeStyle(index, isSelected),
                              width: 18,
                              height: 18,
                              transform: 'none',
                              opacity: nodeNumbersVisible ? 1 : 0,
                            }}
                          >
                            {index + 1}
                          </span>
                        </ClockFocusNodeAppear>
                        {showWords && isSelected && word && (
                          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 900 }}>
                            <AnimatePresence>
                              {selectedWord && glossaryOpenForNode === index ? null : (
                                <motion.div
                                  key={`pill-${index}`}
                                  className="absolute inset-0"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                >
                                  <CurvedCircleWordLabel
                                    word={word}
                                    centerAngleDeg={angle}
                                    radiusPercent={nodeRadius + 5}
                                    isSelected={isSelected}
                                    fillProgress={wordProgressAlongProgressRing(sessionProgress, index, focusNodes, isSessionActive)}
                                    baseColor="#ffffff"
                                    accentColor={clockHex}
                                    interactive
                                    isHovered={pillHoveredNodeIndex === index}
                                    onHoverIn={() => setPillHoveredNodeIndex(index)}
                                    onHoverOut={() => setPillHoveredNodeIndex(null)}
                                    onActivate={(e) => {
                                      e.stopPropagation()
                                      const path = e.currentTarget as SVGPathElement
                                      const rect = path.ownerSVGElement?.getBoundingClientRect()
                                      if (rect) setCardPosition({ x: rect.left, y: rect.top })
                                      setGlossaryOpenForNode(index)
                                      setSelectedWord(word)
                                    }}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </Fragment>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Draggable word card (portal) */}
        {mounted && selectedWord && cardPosition && typeof document !== 'undefined' && createPortal(
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="rounded-xl border-0 bg-white/95 dark:bg-black/90 backdrop-blur-lg shadow-lg min-w-[240px] max-w-[280px] text-left overflow-hidden cursor-grab active:cursor-grabbing"
            style={{ position: 'fixed', left: cardPosition.x, top: cardPosition.y, zIndex: 10000 }}
            onClick={(e) => { e.stopPropagation() }}
          >
            {(() => {
              const gw = glossaryWords.find(w => w.word === selectedWord)
              return (
                <>
                  <div className="p-4 pb-2 pr-10 cursor-grab active:cursor-grabbing select-none" onMouseDown={handleCardDragStart}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-black dark:text-white truncate">{gw?.word ?? selectedWord}</h3>
                        {gw?.phonetic_spelling && <span className="text-sm text-gray-500 dark:text-gray-400 block">{gw.phonetic_spelling}</span>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {gw && (
                          <>
                            <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium', gw.rating === '+' ? 'bg-emerald-100 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300' : gw.rating === '-' ? 'bg-rose-100 dark:bg-rose-500/25 text-rose-700 dark:text-rose-300' : 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300')}>{gw.grade}</span>
                            <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium', gw.rating === '+' ? 'bg-emerald-100 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300' : gw.rating === '-' ? 'bg-rose-100 dark:bg-rose-500/25 text-rose-700 dark:text-rose-300' : 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300')}>{gw.rating}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedWord(null); setGlossaryOpenForNode(null) }} className="absolute top-2 right-2 p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white transition-colors" aria-label="Close card">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="px-4 pb-4 pt-0 cursor-default">
                    {gw ? <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{gw.definition}</p> : <p className="text-sm text-gray-500 dark:text-gray-400">No definition in glossary</p>}
                  </div>
                </>
              )
            })()}
          </motion.div>,
          document.body
        )}

        {/* Dot Navigation - wrapper is pointer-events-none so only the nav strip receives clicks */}
        <div className={cn("fixed inset-0 pointer-events-none z-[999] transition-opacity duration-700", isIdle && "opacity-0")}>
          {showElements && (
            <DotNavigation
              activeDot={CLOCK_INDEX}
              isSmallMultiView={false}
            />
          )}
        </div>

        {/* Position the timer at the bottom center */}
        <div className={cn("absolute bottom-4 left-1/2 -translate-x-1/2 z-50 transition-opacity duration-700", isIdle && "opacity-0 pointer-events-none")}>
          <SessionTimer
            duration={duration ?? undefined}
            sessionId={sessionId ?? undefined}
            onSessionComplete={handleSessionComplete}
            remainingTime={duration != null ? sessionState.remainingTime : undefined}
            isPaused={duration != null ? sessionState.isPaused : undefined}
            onPauseResume={duration != null ? sessionState.onPauseResume : undefined}
            initialDuration={duration ?? undefined}
          />
        </div>

      </div>
    
      {/* COLOUR / MONO toggle */}
      <button
        onClick={() => setColourMode(m => m === 'colour' ? 'mono' : 'colour')}
        className="fixed bottom-4 left-4 z-[999] flex items-center gap-0 rounded-full border border-white/20 bg-black/60 backdrop-blur-sm text-[10px] font-medium tracking-widest text-white/70 overflow-hidden select-none"
        aria-label="Toggle colour mode"
      >
        <span className={`px-3 py-1.5 transition-colors ${
          colourMode === 'colour' ? 'bg-white/20 text-white' : 'text-white/40'
        }`}>COLOUR</span>
        <span className={`px-3 py-1.5 transition-colors ${
          colourMode === 'mono' ? 'bg-white/20 text-white' : 'text-white/40'
        }`}>MONO</span>
      </button>
    </ProtectedRoute>
  )
}

export default function NodesPage() {
  return (
    <Suspense fallback={null}>
      <NodesPageContent />
    </Suspense>
  )
}
