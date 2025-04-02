'use client'

import { useState, useEffect } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { motion } from 'framer-motion'
import { clockSettings } from '@/lib/clockSettings'
import Image from 'next/image'
import { Settings, List, Info, Satellite } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

export default function NodesPage() {
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

  // Get clock 0 settings
  const clock0 = clockSettings[0]
  const focusNodes = clock0.focusNodes
  const startingDegree = clock0.startingDegree
  const rotationTime = clock0.rotationTime
  const rotationDirection = clock0.rotationDirection

  // Calculate rotation
  const [rotation, setRotation] = useState(startingDegree)

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
      requestAnimationFrame(animate)
    }

    const animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [startingDegree, rotationTime, rotationDirection])

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
      marginLeft: isLeftSide ? '-0.75rem' : '0.75rem',
      marginRight: isLeftSide ? '0.75rem' : '-0.75rem',
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

      // Calculate position with larger radius (65 instead of 43)
      const angle = ((360 / satelliteConfigs.length) * index + totalRotation) % 360
      const radians = angle * (Math.PI / 180)
      const radius = 65 // Increased radius to position satellites outside nodes
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
          whileHover={{ scale: 1.5 }}
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
                    alt="Clock Face 1"
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
                    const word = testWords[index]

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
                        whileHover={{ scale: 1.5 }}
                      >
                        {showWords && (hoveredNodeIndex === index || isSelected) && word && (
                          <div 
                            className="absolute whitespace-nowrap pointer-events-none px-2 py-1 rounded-full text-xs font-medium bg-white/90 dark:bg-black/90 backdrop-blur-sm 
                            shadow-sm transition-all outline outline-1 outline-black/10 dark:outline-white/20"
                            style={getWordContainerStyle(angle, isSelected)}
                          >
                            <span className="text-black/90 dark:text-white/90">{word}</span>
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
      </div>
    </ProtectedRoute>
  )
} 