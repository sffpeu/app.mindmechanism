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
  'Cosmos',
  'Destiny',
  'Wisdom',
  'Journey',
  'Balance',
  'Mystery',
  'Guidance',
  'Discovery',
  'Harmony',
  'Vision',
  'Insight',
  'Reflection',
  'Growth',
  'Cycles',
  'Energy',
  'Time'
]

// Satellite configuration
const satelliteConfigs = [
  { rotationTime: 1200 * 1000, rotationDirection: 'counterclockwise' as const },
  { rotationTime: 800 * 1000, rotationDirection: 'clockwise' as const },
  { rotationTime: 1500 * 1000, rotationDirection: 'counterclockwise' as const },
  { rotationTime: 1000 * 1000, rotationDirection: 'clockwise' as const },
  { rotationTime: 600 * 1000, rotationDirection: 'counterclockwise' as const },
  { rotationTime: 2000 * 1000, rotationDirection: 'clockwise' as const }
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
  const focusNodesCount = clock8.focusNodes
  const focusNodes = Array(focusNodesCount).fill(null)
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
    const startDateTime = new Date('0015-12-07T02:00:00') // Clock 8's start date
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
    const startDateTime = new Date('0015-12-07T02:00:00') // Clock 8's start date
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
    const color = '#1b5496' // Color for clock 8 (blue)
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
      const orbitRadius = 300 + index * 50 // Increasing orbit radius for each satellite
      const startAngle = (360 / satelliteConfigs.length) * index // Distribute satellites evenly
      const rotationDuration = config.rotationTime / 1000 // Convert to seconds

      return (
        <motion.div
          key={index}
          className="absolute"
          style={{
            width: `${orbitRadius * 2}px`,
            height: `${orbitRadius * 2}px`,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <motion.div
            className="absolute"
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#1b5496',
              left: '50%',
              marginLeft: '-5px',
              top: '0',
              transformOrigin: '50% 50%',
            }}
            animate={{
              rotate: config.rotationDirection === 'clockwise' ? [0, 360] : [360, 0],
            }}
            transition={{
              duration: rotationDuration,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          <div
            className="absolute w-full h-full rounded-full border border-blue-800 opacity-10"
            style={{
              transform: 'translate(-50%, -50%)',
              left: '50%',
              top: '50%',
            }}
          />
        </motion.div>
      )
    })
  }

  return (
    <ProtectedRoute>
      <div className="relative w-full h-screen overflow-hidden bg-white dark:bg-black">
        <Menu />
        <div className="absolute top-4 right-4 z-50 flex gap-4">
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg">
                <Settings className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4" />
                  <span>Show Words</span>
                </div>
                <Switch
                  checked={showWords}
                  onCheckedChange={handleWordsChange}
                />
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Satellite className="w-4 h-4" />
                  <span>Show Satellites</span>
                </div>
                <Switch
                  checked={showSatellites}
                  onCheckedChange={(checked) => {
                    setShowSatellites(checked)
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('showSatellites', JSON.stringify(checked))
                    }
                  }}
                />
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <span>Show Info Cards</span>
                </div>
                <Switch
                  checked={showInfoCards}
                  onCheckedChange={setShowInfoCards}
                />
              </DropdownMenuItem>
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

        {/* Info Cards */}
        {showInfoCards && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-4">
            <Card className="w-48">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon className="w-4 h-4" />
                  <span className="font-semibold">Rotation</span>
                </div>
                <div className="text-sm">
                  {Math.round(clockInfo.rotation)}°
                </div>
              </CardContent>
            </Card>
            <Card className="w-48">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <RotateCw className="w-4 h-4" />
                  <span className="font-semibold">Rotations</span>
                </div>
                <div className="text-sm">
                  {clockInfo.rotationsCompleted}
                </div>
              </CardContent>
            </Card>
            <Card className="w-48">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TimerIcon className="w-4 h-4" />
                  <span className="font-semibold">Elapsed Time</span>
                </div>
                <div className="text-sm">
                  {clockInfo.elapsedTime}
                </div>
              </CardContent>
            </Card>
            <Card className="w-48">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Compass className="w-4 h-4" />
                  <span className="font-semibold">Direction</span>
                </div>
                <div className="text-sm capitalize">
                  {clockInfo.direction}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Help Button */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="absolute bottom-4 right-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg">
              <HelpCircle className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <h3 className="font-semibold">Celestial Wisdom Clock</h3>
              <p className="text-sm text-gray-500">
                This clock represents the ancient wisdom of celestial cycles and their influence on human consciousness.
                The rotating elements symbolize the interconnected nature of cosmic patterns and personal growth.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <Book className="w-4 h-4" />
                <span className="text-sm font-medium">Learn More</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Main Clock Container */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            perspective: '1000px',
          }}
        >
          {/* Background Circle */}
          <div
            className="absolute w-[600px] h-[600px] rounded-full"
            style={{
              background: isDarkMode
                ? 'radial-gradient(circle at center, rgba(27, 84, 150, 0.2) 0%, rgba(27, 84, 150, 0.1) 50%, rgba(27, 84, 150, 0) 70%)'
                : 'radial-gradient(circle at center, rgba(27, 84, 150, 0.1) 0%, rgba(27, 84, 150, 0.05) 50%, rgba(27, 84, 150, 0) 70%)',
            }}
          />

          {/* Satellites */}
          {renderSatellites()}

          {/* Clock Image */}
          <motion.div
            className="relative"
            style={{
              width: '600px',
              height: '600px',
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

            {/* Focus Nodes */}
            {focusNodes.map((node, index) => {
              const isSelected = selectedNodeIndex === index
              const isHovered = hoveredNodeIndex === index
              const angle = (360 / focusNodesCount) * index
              const radius = 250 // Distance from center
              const x = radius * Math.cos((angle - 90) * (Math.PI / 180))
              const y = radius * Math.sin((angle - 90) * (Math.PI / 180))

              return (
                <div key={index} className="absolute left-1/2 top-1/2">
                  {/* Node */}
                  <div
                    className="absolute rounded-full cursor-pointer"
                    style={{
                      ...getFocusNodeStyle(index, isSelected || isHovered),
                      left: x,
                      top: y,
                    }}
                    onClick={() => handleNodeClick(index)}
                    onMouseEnter={() => setHoveredNodeIndex(index)}
                    onMouseLeave={() => setHoveredNodeIndex(null)}
                  />

                  {/* Word */}
                  {showWords && (
                    <div
                      style={{
                        ...getWordContainerStyle(angle, isSelected || isHovered),
                        left: x,
                        top: y,
                      }}
                      className={`whitespace-nowrap text-sm font-medium ${
                        isSelected || isHovered
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                      onClick={() => {
                        setSelectedWord(testWords[index])
                        handleNodeClick(index)
                      }}
                    >
                      {testWords[index]}
                    </div>
                  )}
                </div>
              )
            })}
          </motion.div>
        </div>

        {/* Glossary Popover */}
        {selectedWord && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <Card className="w-96">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">{selectedWord}</h3>
                {loadingGlossary ? (
                  <p>Loading...</p>
                ) : (
                  <div>
                    {glossaryWords.find(word => word.word.toLowerCase() === selectedWord.toLowerCase())?.definition || 
                     'Definition not found in glossary.'}
                  </div>
                )}
                <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setSelectedWord(null)}
                >
                  ×
                </button>
              </CardContent>
            </Card>
          </div>
        )}
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