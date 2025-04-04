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

// Test words for each node
const testWords = [
  'Stars',
  'Charts',
  'Ancient',
  'Mapping',
  'Accuracy',
  'Celestial',
  'Navigation',
  'Astronomy',
  'Constellations',
  'Observation',
  'Tracking',
  'Alignment',
  'Patterns',
  'Movement',
  'Position',
  'Cycles'
]

// Satellite configuration
const satelliteConfigs = [
  { rotationTime: 900 * 1000, rotationDirection: 'clockwise' as const },
  { rotationTime: 900 * 1000, rotationDirection: 'counterclockwise' as const },
  { rotationTime: 1800 * 1000, rotationDirection: 'clockwise' as const },
  { rotationTime: 900 * 1000, rotationDirection: 'counterclockwise' as const },
  { rotationTime: 700 * 1000, rotationDirection: 'clockwise' as const }
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

  // Get clock 8 settings
  const clock8 = clockSettings[7]
  const focusNodes = clock8.focusNodes
  const startingDegree = clock8.startingDegree
  const rotationTime = clock8.rotationTime
  const rotationDirection = clock8.rotationDirection

  // Calculate rotation
  const [rotation, setRotation] = useState(startingDegree)
  const [currentDegree, setCurrentDegree] = useState(startingDegree)

  // Initialize timer from URL parameters
  useEffect(() => {
    const duration = searchParams.get('duration')
    const sessionIdParam = searchParams.get('sessionId')
    if (duration) {
      const durationMs = parseInt(duration)
      setRemainingTime(durationMs)
    }
    if (sessionIdParam) {
      setSessionId(sessionIdParam)
    }
  }, [searchParams])

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
    const startDateTime = new Date('0015-11-21T00:00:00')
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
    const startDateTime = new Date('0015-11-21T00:00:00')
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
    const counterRotation = -rotation - clock8.imageOrientation // Counter-rotate both current rotation and image orientation
    return {
      position: 'absolute' as const,
      left: isLeftSide ? 'auto' : '100%',
      right: isLeftSide ? '100%' : 'auto',
      top: '50%',
      marginLeft: isLeftSide ? '-1.5rem' : '1.5rem',
      marginRight: isLeftSide ? '1.5rem' : '-1.5rem',
      transform: `translateY(-50%) scale(${isSelected ? 1.1 : 1}) rotate(${counterRotation}deg)`,
      transformOrigin: isLeftSide ? 'right' : 'left',
    }
  }

  const getFocusNodeStyle = (index: number, isSelected: boolean) => {
    const color = '#541b96' // Color for clock 8 (purple)
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

  const handleWordsChange = (checked: boolean) => {
    setShowWords(checked)
    if (typeof window !== 'undefined') {
      localStorage.setItem('showWords', JSON.stringify(checked))
    }
  }

  const getElapsedTime = (startDateTime: Date): string => {
    const now = new Date()
    const elapsedMilliseconds = now.getTime() - startDateTime.getTime()
    const years = Math.floor(elapsedMilliseconds / (365 * 24 * 60 * 60 * 1000))
    const days = Math.floor((elapsedMilliseconds % (365 * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000))
    const hours = Math.floor((elapsedMilliseconds % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    const minutes = Math.floor((elapsedMilliseconds % (60 * 60 * 1000)) / (60 * 1000))
    const seconds = Math.floor((elapsedMilliseconds % (60 * 1000)) / 1000)
    return `${years}y ${days}d ${hours}h ${minutes}m ${seconds}s`
  }

  const renderSatellites = () => {
    if (!showSatellites) return null

    return satelliteConfigs.map((config, index) => {
      const orbitRadius = 200 + index * 30 // Increasing orbit radius for each satellite
      const startAngle = (360 / satelliteConfigs.length) * index // Distribute satellites evenly
      const rotationDuration = config.rotationTime / 1000 // Convert to seconds

      return (
        <motion.div
          key={index}
          className="absolute"
          style={{
            width: `${orbitRadius * 2}px`,
            height: `${orbitRadius * 2}px`,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <motion.div
            className="absolute w-2 h-2 bg-purple-500 rounded-full"
            style={{
              top: '0%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              rotate: config.rotationDirection === 'clockwise' ? 360 : -360
            }}
            transition={{
              duration: rotationDuration,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </motion.div>
      )
    })
  }

  return (
    <ProtectedRoute>
      <div className="relative w-full h-screen overflow-hidden bg-background">
        <Menu />
        
        {/* Settings Panel */}
        <div className="absolute top-4 right-4 z-50">
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg bg-background border border-border hover:bg-muted transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show Words</span>
                  <Switch
                    checked={showWords}
                    onCheckedChange={handleWordsChange}
                  />
                </div>
              </div>
              <div className="p-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show Satellites</span>
                  <Switch
                    checked={showSatellites}
                    onCheckedChange={(checked) => {
                      setShowSatellites(checked)
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('showSatellites', JSON.stringify(checked))
                      }
                    }}
                  />
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Timer */}
        {remainingTime !== null && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
            <Timer
              remainingTime={remainingTime}
              isPaused={isPaused}
              onPauseResume={handlePauseResume}
            />
          </div>
        )}

        {/* Clock Info Panel */}
        <div className="absolute bottom-4 left-4 z-50">
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-2 rounded-lg bg-background border border-border hover:bg-muted transition-colors">
                <Info className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" align="start" className="w-64">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-4 h-4" />
                  <span className="text-sm">Rotation: {Math.round(clockInfo.currentRotation)}°</span>
                </div>
                <div className="flex items-center space-x-2">
                  <RotateCw className="w-4 h-4" />
                  <span className="text-sm">Rotations: {clockInfo.rotationsCompleted}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Elapsed: {clockInfo.elapsedTime}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Compass className="w-4 h-4" />
                  <span className="text-sm">Direction: {clockInfo.direction}</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Glossary Panel */}
        <div className="absolute bottom-4 right-4 z-50">
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-2 rounded-lg bg-background border border-border hover:bg-muted transition-colors">
                <Book className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="left" align="start" className="w-64 max-h-96 overflow-y-auto">
              {loadingGlossary ? (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {glossaryWords.map((word, index) => (
                    <Card key={index} className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4">
                        <h3 className="font-semibold">{word.word}</h3>
                        <p className="text-sm text-muted-foreground">{word.definition}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Help Button */}
        <div className="absolute top-4 left-4 z-50">
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-2 rounded-lg bg-background border border-border hover:bg-muted transition-colors">
                <HelpCircle className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" align="start" className="w-64">
              <div className="space-y-2">
                <h3 className="font-semibold">Clock 8</h3>
                <p className="text-sm text-muted-foreground">
                  This clock represents the Ancient Star Charts, showing celestial movements and patterns.
                  Click on nodes to explore different astronomical concepts.
                </p>
                <div className="text-sm text-muted-foreground">
                  <strong>Controls:</strong>
                  <ul className="list-disc list-inside mt-1">
                    <li>Click nodes to select</li>
                    <li>Toggle words in settings</li>
                    <li>View glossary for definitions</li>
                  </ul>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Main Clock Container */}
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '600px',
            height: '600px',
          }}
        >
          {/* Clock Image */}
          <div
            className="relative w-full h-full"
            style={{
              transform: `rotate(${rotation}deg)`,
            }}
          >
            <Image
              src="/images/clock8.png"
              alt="Clock 8"
              width={600}
              height={600}
              className="w-full h-full"
              style={{
                transform: `rotate(${clock8.imageOrientation}deg)`,
              }}
            />
          </div>

          {/* Focus Nodes */}
          {focusNodes.map((node, index) => {
            const isSelected = selectedNodeIndex === index
            const isHovered = hoveredNodeIndex === index
            const angle = node.angle + rotation + clock8.imageOrientation

            return (
              <div key={index}>
                {/* Node */}
                <div
                  className="absolute cursor-pointer rounded-full"
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    ...getFocusNodeStyle(index, isSelected)
                  }}
                  onClick={() => handleNodeClick(index)}
                  onMouseEnter={() => setHoveredNodeIndex(index)}
                  onMouseLeave={() => setHoveredNodeIndex(null)}
                />

                {/* Word */}
                {showWords && (isSelected || isHovered) && (
                  <div
                    style={getWordContainerStyle(angle, isSelected)}
                  >
                    <span className="text-sm font-medium whitespace-nowrap">
                      {testWords[index]}
                    </span>
                  </div>
                )}
              </div>
            )
          })}

          {/* Satellites */}
          {renderSatellites()}
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