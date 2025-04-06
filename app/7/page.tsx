'use client'

import { useState, useEffect, Suspense } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { motion } from 'framer-motion'
import { clockSettings } from '@/lib/clockSettings'
import Image from 'next/image'
import { Settings, List, Info, Satellite, Clock as ClockIcon, Calendar, RotateCw, Timer as TimerIcon, Compass, HelpCircle, Book } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useSearchParams } from 'next/navigation'
import Timer from '@/components/Timer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { GlossaryWord } from '@/types/Glossary'
import { getAllWords } from '@/lib/glossary'
import Clock from '@/components/Clock'
import { LeaveWarning } from '@/components/LeaveWarning'
import { SessionTimer } from '@/components/SessionTimer'
import { getClockColorClasses } from '@/lib/clockColors'

// Test words for each node
const testWords = [
  'Consciousness',
  'Quantum',
  'Synchronicity',
  'Emergence',
  'Resonance',
  'Entropy',
  'Duality',
  'Infinity'
]

// Satellite configurations from clock 0
const satelliteConfigs = [
  { rotationTime: 300 * 1000, rotationDirection: 'clockwise' },
  { rotationTime: 600 * 1000, rotationDirection: 'counterclockwise' },
  { rotationTime: 900 * 1000, rotationDirection: 'clockwise' },
  { rotationTime: 1800 * 1000, rotationDirection: 'counterclockwise' },
  { rotationTime: 2700 * 1000, rotationDirection: 'clockwise' },
  { rotationTime: 5400 * 1000, rotationDirection: 'counterclockwise' },
  { rotationTime: 5400 * 1000, rotationDirection: 'clockwise' },
  { rotationTime: 1800 * 1000, rotationDirection: 'counterclockwise' }
]

// Helper function to convert hex to rgb
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

function NodesPageContent() {
  const searchParams = useSearchParams()
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showSatellites')
      return saved ? JSON.parse(saved) : false
    }
    return false
  })
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null)
  const [hoveredNodeIndex, setHoveredNodeIndex] = useState<number | null>(null)
  const [showWords, setShowWords] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showWords')
      return saved ? JSON.parse(saved) : true
    }
    return true
  })
  const [showInfoCards, setShowInfoCards] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { isDarkMode } = useTheme()
  const [remainingTime, setRemainingTime] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [clockInfo, setClockInfo] = useState({
    rotation: 0,
    rotationsCompleted: 0,
    elapsedTime: '0y 0d 0h 0m 0s',
    currentRotation: 0,
    direction: 'clockwise'
  })
  const [glossaryWords, setGlossaryWords] = useState<GlossaryWord[]>([])
  const [loadingGlossary, setLoadingGlossary] = useState(true)
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [customWords, setCustomWords] = useState<string[]>([])
  const [duration, setDuration] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Get clock 0 settings
  const clock0 = clockSettings[0]
  const focusNodes = clock0.focusNodes
  const startingDegree = clock0.startingDegree
  const rotationTime = clock0.rotationTime
  const rotationDirection = clock0.rotationDirection

  // Calculate rotation
  const [rotation, setRotation] = useState(startingDegree)
  const [currentDegree, setCurrentDegree] = useState(startingDegree)

  // Initialize session from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const durationParam = params.get('duration')
    const sessionIdParam = params.get('sessionId')
    const wordsParam = params.get('words')
    
    if (durationParam) {
      setDuration(parseInt(durationParam, 10))
    }
    if (sessionIdParam) {
      setSessionId(sessionIdParam)
    }
    if (wordsParam) {
      try {
        const decodedWords = JSON.parse(decodeURIComponent(wordsParam))
        setCustomWords(decodedWords)
      } catch (error) {
        console.error('Error decoding words:', error)
        setCustomWords([])
      }
    }
    setIsLoading(false)
  }, [])

  // Handle session completion
  const handleSessionComplete = () => {
    // Clear saved session
    localStorage.removeItem('pendingSession')
    // Redirect to completion page or show completion message
    // You can implement this based on your requirements
  }

  // Handle pause/resume
  const handlePauseResume = () => {
    setIsPaused(!isPaused)
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
    const startDateTime = new Date('1610-12-21T03:00:00')
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
  }, [startingDegree, rotationTime, rotationDirection])

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Update clock info
  useEffect(() => {
    const startDateTime = new Date('1610-12-21T03:00:00')
    const now = Date.now()
    const elapsedMilliseconds = now - startDateTime.getTime()
    const rotations = Math.floor(elapsedMilliseconds / rotationTime)

    setClockInfo({
      rotation: currentDegree,
      rotationsCompleted: rotations,
      elapsedTime: getElapsedTime(startDateTime),
      currentRotation: currentDegree,
      direction: rotationDirection
    })
  }, [currentTime, rotationTime, currentDegree, rotationDirection])

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
    setSelectedNodeIndex(selectedNodeIndex === index ? null : index)
  }

  const getWordContainerStyle = (angle: number, isSelected: boolean) => {
    const isLeftSide = angle > 90 && angle < 270
    return {
      position: 'absolute' as const,
      left: isLeftSide ? 'auto' : '100%',
      right: isLeftSide ? '100%' : 'auto',
      top: '50%',
      marginLeft: isLeftSide ? '-1.5rem' : '1.5rem',
      marginRight: isLeftSide ? '1.5rem' : '-1.5rem',
      transform: `translateY(-50%) scale(${isSelected ? 1.1 : 1}) rotate(${-rotation}deg)`,
      transformOrigin: isLeftSide ? 'right' : 'left',
    }
  }

  const getFocusNodeStyle = (index: number, isSelected: boolean) => {
    const color = '#fd290a' // Color from clock 0
    return {
      backgroundColor: isSelected ? color : 'transparent',
      border: `2px solid ${color}`,
      width: '12px',
      height: '12px',
      opacity: isSelected ? 1 : 0.9,
      transform: 'translate(-50%, -50%)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: isSelected ? 400 : 200,
      boxShadow: isSelected ? `0 0 16px ${color}60` : '0 0 8px rgba(0, 0, 0, 0.2)',
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

  const renderSatellites = () => {
    return satelliteConfigs.map((satellite, index) => {
      const now = Date.now()
      const startDateTime = new Date('1610-12-21T03:00:00')
      const elapsedMilliseconds = now - startDateTime.getTime()
      const satelliteRotation = (elapsedMilliseconds / satellite.rotationTime) * 360
      const totalRotation = satellite.rotationDirection === 'clockwise'
        ? satelliteRotation
        : -satelliteRotation

      // Calculate position with adjusted radius (60 instead of 65)
      const angle = ((360 / satelliteConfigs.length) * index + totalRotation) % 360
      const radians = angle * (Math.PI / 180)
      const radius = 60 // Reduced from 65 to bring satellites closer
      const x = 50 + radius * Math.cos(radians)
      const y = 50 + radius * Math.sin(radians)

      return (
        <motion.div
          key={`satellite-${index}`}
          className="absolute cursor-pointer"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 1 + (index * 0.1),
            duration: 0.5,
            ease: "easeOut"
          }}
          style={{
            left: `${x}%`,
            top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 100,
          }}
          whileHover={{ scale: 1.25 }} // Reduced from 1.5
        >
          <div 
            className="w-4 h-4 rounded-full bg-black dark:bg-white"
            style={{
              boxShadow: '0 0 12px rgba(0, 0, 0, 0.4)',
            }}
          />
        </motion.div>
      )
    })
  }

  // Get the RGB values for the glow effect
  const clockColor = hexToRgb('#fd290a') // Red color from clock 0

  // Add getElapsedTime helper function
  const getElapsedTime = (startDateTime: Date): string => {
    const elapsed = Date.now() - startDateTime.getTime()
    const years = Math.floor(elapsed / (365 * 24 * 60 * 60 * 1000))
    const remainingDays = Math.floor((elapsed % (365 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000))
    const hours = Math.floor((elapsed % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    const minutes = Math.floor((elapsed % (60 * 60 * 1000)) / (60 * 1000))
    const seconds = Math.floor((elapsed % (60 * 1000)) / 1000)
    return `${years}y ${remainingDays}d ${hours}h ${minutes}m ${seconds}s`
  }

  // Save session state when leaving
  useEffect(() => {
    if (!sessionId || !remainingTime) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        localStorage.setItem('pendingSession', JSON.stringify({
          sessionId,
          remaining: remainingTime,
          timestamp: Date.now()
        }))
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [sessionId, remainingTime])

  // Auto-save session state periodically
  useEffect(() => {
    if (!sessionId || !remainingTime || isPaused) return

    const autoSaveInterval = setInterval(() => {
      localStorage.setItem('pendingSession', JSON.stringify({
        sessionId,
        remaining: remainingTime,
        timestamp: Date.now()
      }))
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [sessionId, remainingTime, isPaused])

  const { textColor, bgColor, hoverBorder, hoverShadow } = getClockColorClasses(7)

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-black/95">
        <Menu
          showElements={showElements}
          onToggleShow={() => setShowElements(!showElements)}
          showSatellites={showSatellites}
          onSatellitesChange={setShowSatellites}
        />
        
        {/* Settings Dropdown */}
        <div className="fixed top-4 right-4 z-50">
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-black/5 dark:border-white/10 hover:bg-white/90 dark:hover:bg-black/90 transition-colors">
                <Settings className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="flex items-center justify-between" onSelect={(e) => e.preventDefault()}>
                <div className="flex items-center gap-2">
                  <Satellite className="h-4 w-4" />
                  <span>Satellites</span>
                </div>
                <Switch
                  checked={showSatellites}
                  onCheckedChange={handleSatellitesChange}
                />
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center justify-between" onSelect={(e) => e.preventDefault()}>
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  <span>Focus Words</span>
                </div>
                <Switch
                  checked={showWords}
                  onCheckedChange={handleWordsChange}
                />
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center justify-between" onSelect={(e) => e.preventDefault()}>
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <span>Info Cards</span>
                </div>
                <Switch
                  checked={showInfoCards}
                  onCheckedChange={setShowInfoCards}
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Timer and Info Component */}
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2">
          {remainingTime !== null && (
            <Timer
              remainingTime={remainingTime}
              isPaused={isPaused}
              onPauseResume={handlePauseResume}
            />
          )}
          <div className="group relative">
            <button 
              className="p-2 rounded-lg bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-black/5 dark:border-white/10 hover:bg-white/90 dark:hover:bg-black/90 transition-colors"
              aria-label="Clock Information"
            >
              <Info className="h-4 w-4 text-black/70 dark:text-white/70" />
            </button>
            <div className="absolute bottom-full left-0 mb-2 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 origin-bottom-left">
              <Card className="w-[300px] bg-white/90 dark:bg-black/90 backdrop-blur-sm border-black/5 dark:border-white/10">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Clock Title and Description */}
                    <div className="space-y-2 pb-3 border-b border-black/10 dark:border-white/10">
                      <h3 className={`text-sm font-medium ${textColor}`}>
                        Winter Solstice Study
                      </h3>
                      <p className="text-xs text-black/60 dark:text-white/60 line-clamp-2">
                        First telescopic observations of the night sky, marking the beginning of modern astronomy.
                      </p>
                    </div>

                    {/* Clock Information */}
                    <div className="space-y-2 pb-3 border-b border-black/10 dark:border-white/10">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs font-medium text-black/60 dark:text-white/60 flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            Current
                          </p>
                          <p className="text-sm font-medium text-black/90 dark:text-white/90">
                            {currentTime.toLocaleTimeString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-black/60 dark:text-white/60 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Started
                          </p>
                          <p className="text-sm font-medium text-black/90 dark:text-white/90">
                            {new Date('1610-12-21T03:00:00').toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-black/60 dark:text-white/60 flex items-center gap-1">
                          <TimerIcon className="h-3 w-3" />
                          Elapsed
                        </p>
                        <p className="text-sm font-medium text-black/90 dark:text-white/90 font-mono">
                          {clockInfo.elapsedTime}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs font-medium text-black/60 dark:text-white/60 flex items-center gap-1">
                            <Compass className="h-3 w-3" />
                            Start °
                          </p>
                          <p className="text-sm font-medium text-black/90 dark:text-white/90">
                            {startingDegree.toFixed(1)}°
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-black/60 dark:text-white/60 flex items-center gap-1">
                            <RotateCw className="h-3 w-3" />
                            Rot. Time
                          </p>
                          <p className="text-sm font-medium text-black/90 dark:text-white/90">
                            {rotationTime / 1000}s
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5">
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                          <div className="w-1 h-1 rounded-full bg-red-500" />
                          Focus Nodes
                        </span>
                        <span className="text-xs font-medium text-gray-900 dark:text-white block text-center">
                          {focusNodes}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5">
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                          <div className="w-1 h-1 rounded-full border border-gray-900 dark:border-white/40" />
                          Satellites
                        </span>
                        <span className="text-xs font-medium text-gray-900 dark:text-white block text-center">
                          {satelliteConfigs.length}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5">
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                          <RotateCw className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                          Rotations
                        </span>
                        <span className="text-xs font-medium text-gray-900 dark:text-white block text-center">
                          {clockInfo.rotationsCompleted}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5">
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                          <Compass className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                          Current °
                        </span>
                        <span className="text-xs font-medium text-gray-900 dark:text-white block text-center">
                          {clockInfo.direction === 'clockwise' ? '+' : ''}{currentDegree.toFixed(3)}°
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div className="flex-grow flex items-center justify-center min-h-screen">
          <div className="relative w-[82vw] h-[82vw] max-w-[615px] max-h-[615px]">
            {/* Red glow effect */}
            {clockColor && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  '--shadow-color': `${clockColor.r}, ${clockColor.g}, ${clockColor.b}`,
                } as React.CSSProperties}
                animate={{
                  boxShadow: [
                    "0 0 50px rgba(var(--shadow-color), 0)",
                    "0 0 100px rgba(var(--shadow-color), 0.15)",
                    "0 0 150px rgba(var(--shadow-color), 0.3)",
                    "0 0 100px rgba(var(--shadow-color), 0.15)",
                    "0 0 50px rgba(var(--shadow-color), 0)"
                  ]
                }}
                transition={{
                  duration: 60,
                  ease: [0.4, 0, 0.6, 1],
                  repeat: Infinity,
                  times: [0, 0.25, 0.5, 0.75, 1]
                }}
              />
            )}

            {/* Satellites layer */}
            {showSatellites && (
              <motion.div 
                className="absolute inset-0"
                style={{ 
                  willChange: 'transform',
                  zIndex: 100,
                }}
              >
                {renderSatellites()}
              </motion.div>
            )}

            {/* Clock face */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <motion.div 
                className="absolute inset-0"
                style={{ 
                  willChange: 'transform',
                }}
                animate={{ rotate: rotation }}
                transition={{
                  type: 'tween',
                  duration: 0.016,
                  ease: 'linear'
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    transform: `translate(${clock0.imageX}%, ${clock0.imageY}%) rotate(${clock0.imageOrientation}deg) scale(${clock0.imageScale})`,
                    willChange: 'transform',
                    transformOrigin: 'center',
                  }}
                >
                  <Image 
                    src={clock0.imageUrl}
                    alt="Clock Face 0"
                    layout="fill"
                    objectFit="cover"
                    className="rounded-full dark:invert [&_*]:fill-current [&_*]:stroke-none"
                    priority
                    loading="eager"
                  />
                </div>
              </motion.div>
            </div>

            {/* Focus nodes layer */}
            <motion.div 
              className="absolute inset-0"
              style={{ 
                willChange: 'transform',
                zIndex: 200,
                pointerEvents: 'none',
              }}
              animate={{ rotate: rotation }}
              transition={{
                type: 'tween',
                duration: 0.016,
                ease: 'linear'
              }}
            >
              <div className="absolute inset-0" style={{ transform: `rotate(${clock0.imageOrientation}deg)`, pointerEvents: 'auto' }}>
                <div className="absolute inset-0" style={{ pointerEvents: 'auto' }}>
                  {Array.from({ length: focusNodes }).map((_, index) => {
                    const angle = ((360 / focusNodes) * index + startingDegree + 45) % 360
                    const radians = angle * (Math.PI / 180)
                    const nodeRadius = 55 // Increased from 48 to move nodes further out
                    const x = 50 + nodeRadius * Math.cos(radians)
                    const y = 50 + nodeRadius * Math.sin(radians)
                    const isSelected = selectedNodeIndex === index
                    const word = customWords[index] || testWords[index]

                    return (
                      <motion.div
                        key={index}
                        className="absolute rounded-full cursor-pointer"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          ...getFocusNodeStyle(index, isSelected),
                        }}
                        onClick={() => handleNodeClick(index)}
                        onMouseEnter={() => setHoveredNodeIndex(index)}
                        onMouseLeave={() => setHoveredNodeIndex(null)}
                      >
                        {showWords && (hoveredNodeIndex === index || isSelected) && word && (
                          <div 
                            className={`absolute whitespace-nowrap pointer-events-none px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${hoverBorder} ${hoverShadow}`}
                            style={getWordContainerStyle(angle, isSelected)}
                          >
                            {/* Word Display with click handler */}
                            <button
                              className="pointer-events-auto"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedWord(selectedWord === word ? null : word)
                              }}
                            >
                              <span className={`${textColor} ${hoverBorder} ${hoverShadow}`}>{word}</span>
                            </button>

                            {/* Icons above word - only show when word is selected */}
                            {selectedWord === word && (
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-2">
                                {/* Info Icon */}
                                <motion.div 
                                  className="group relative"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.2, delay: 0 }}
                                >
                                  <button 
                                    className="pointer-events-auto w-6 h-6 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm border border-black/10 dark:border-white/20 
                                    flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      // Show definition in a tooltip or modal
                                      console.log('Show definition for:', word)
                                    }}
                                  >
                                    <Info className="h-3 w-3 text-black/60 dark:text-white/60" />
                                  </button>
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs bg-black/90 text-white rounded whitespace-nowrap
                                    opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    Definition
                                  </div>
                                </motion.div>

                                {/* Notes Icon */}
                                <motion.div 
                                  className="group relative"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.2, delay: 0.1 }}
                                >
                                  <button 
                                    className="pointer-events-auto w-6 h-6 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm border border-black/10 dark:border-white/20 
                                    flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      // Open notes interface
                                      console.log('Open notes for:', word)
                                    }}
                                  >
                                    <List className="h-3 w-3 text-black/60 dark:text-white/60" />
                                  </button>
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs bg-black/90 text-white rounded whitespace-nowrap
                                    opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    Add Note
                                  </div>
                                </motion.div>

                                {/* Dictionary Icon */}
                                <motion.div 
                                  className="group relative"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.2, delay: 0.2 }}
                                >
                                  <button 
                                    className="pointer-events-auto w-6 h-6 rounded-full bg-white/90 dark:bg-black/90 backdrop-blur-sm border border-black/10 dark:border-white/20 
                                    flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      window.location.href = '/glossary'
                                    }}
                                  >
                                    <Book className="h-3 w-3 text-black/60 dark:text-white/60" />
                                  </button>
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs bg-black/90 text-white rounded whitespace-nowrap
                                    opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    Open Glossary
                                  </div>
                                </motion.div>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="relative w-full h-full">
          <LeaveWarning />
          <Clock
            id={0}
            startDateTime={clock0.startDateTime}
            rotationTime={rotationTime}
            imageUrl={clock0.imageUrl}
            startingDegree={startingDegree}
            focusNodes={focusNodes}
            rotationDirection={rotationDirection}
            imageOrientation={clock0.imageOrientation}
            imageScale={clock0.imageScale}
            imageX={clock0.imageX}
            imageY={clock0.imageY}
            showElements={showElements}
            currentTime={currentTime}
            syncTrigger={clockInfo.rotation}
            onToggleShow={() => setShowElements(!showElements)}
            showSatellites={showSatellites}
            showWords={showWords}
            customWords={customWords}
            onInfoUpdate={(info) => setClockInfo(prev => ({ ...prev, ...info }))}
            duration={duration}
            sessionId={sessionId}
          />
        </div>

        {/* Position the timer in the bottom left corner */}
        <div className="absolute bottom-4 left-4 z-50">
          <SessionTimer
            duration={duration}
            sessionId={sessionId}
            onSessionComplete={handleSessionComplete}
          />
        </div>
      </div>
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