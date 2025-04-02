'use client'

import { useState, useEffect } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { motion } from 'framer-motion'
import { clockSettings } from '@/lib/clockSettings'
import Image from 'next/image'

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

export default function NodesPage() {
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null)
  const [hoveredNodeIndex, setHoveredNodeIndex] = useState<number | null>(null)
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
      marginLeft: isLeftSide ? '-0.5rem' : '0.5rem',
      marginRight: isLeftSide ? '0.5rem' : '-0.5rem',
      transform: `translateY(-50%) scale(${isSelected ? 1.1 : 1})`,
      transformOrigin: isLeftSide ? 'right' : 'left',
    }
  }

  const getFocusNodeStyle = (index: number, isSelected: boolean) => {
    const color = '#fd290a' // Color from clock 0
    return {
      backgroundColor: isSelected ? color : 'transparent',
      border: `2px solid ${color}`,
      width: '8px',
      height: '8px',
      opacity: isSelected ? 1 : 0.9,
      transform: 'translate(-50%, -50%)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: isSelected ? 400 : 200,
      boxShadow: isSelected ? `0 0 16px ${color}60` : '0 0 8px rgba(0, 0, 0, 0.2)',
    }
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
        
        <div className="flex-grow flex items-center justify-center min-h-screen">
          <div className="relative w-[82vw] h-[82vw] max-w-[615px] max-h-[615px]">
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
                    const nodeRadius = 48
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
                        whileHover={{ scale: 1.2 }}
                      >
                        {(hoveredNodeIndex === index || isSelected) && word && (
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