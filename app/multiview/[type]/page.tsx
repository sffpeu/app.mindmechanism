'use client'

import { useState, useEffect, useRef } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { useParams } from 'next/navigation'
import DotNavigation from '@/components/DotNavigation'
import { clockSettings } from '@/lib/clockSettings'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { ClockSettings } from '@/types/ClockSettings'

// Default satellite configurations for all clocks
const defaultSatelliteConfigs: Record<number, Array<{ rotationTime: number, rotationDirection: 'clockwise' | 'counterclockwise' }>> = {
  0: [ // Clock 1
    { rotationTime: 300 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 600 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 900 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 1800 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 2700 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 5400 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 5400 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 1800 * 1000, rotationDirection: 'counterclockwise' }
  ],
  1: [ // Clock 2
    { rotationTime: 1800 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 3600 * 1000, rotationDirection: 'counterclockwise' }
  ],
  2: [ // Clock 3
    { rotationTime: 600 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 1800 * 1000, rotationDirection: 'clockwise' }
  ],
  3: [ // Clock 4
    { rotationTime: 60 * 1000, rotationDirection: 'clockwise' }
  ],
  4: [ // Clock 5
    { rotationTime: 720 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 1140 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 1710 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 1710 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 900 * 1000, rotationDirection: 'clockwise' }
  ],
  5: [ // Clock 6
    { rotationTime: 60 * 1000, rotationDirection: 'clockwise' }
  ],
  6: [ // Clock 7
    { rotationTime: 900 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 900 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 1800 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 900 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 700 * 1000, rotationDirection: 'clockwise' }
  ],
  7: [ // Clock 8
    { rotationTime: 1800 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 1800 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 1800 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 1800 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 1800 * 1000, rotationDirection: 'clockwise' }
  ],
  8: [ // Clock 9
    { rotationTime: 3600 * 1000, rotationDirection: 'clockwise' }
  ]
};

// Satellite counts for each clock
const clockSatellites: Record<number, number> = {
  0: 8, // Clock 1
  1: 2, // Clock 2
  2: 2, // Clock 3
  3: 1, // Clock 4
  4: 5, // Clock 5
  5: 1, // Clock 6
  6: 5, // Clock 7
  7: 5, // Clock 8
  8: 1, // Clock 9
};

export default function MultiViewPage() {
  const params = useParams()
  const type = parseInt(params.type as string)
  const [showElements, setShowElements] = useState(true)
  const { isDarkMode } = useTheme()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const isMultiView2 = type === 2
  const [satelliteRotations, setSatelliteRotations] = useState<Record<number, number[]>>({})
  const animationRef = useRef<number>()
  const [hoveredClock, setHoveredClock] = useState<number | null>(null)
  const [rotationValues, setRotationValues] = useState<Record<number, number>>({})

  // Initialize and update current time
  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Update rotation values when hovering
  useEffect(() => {
    if (hoveredClock === null) return

    const updateRotation = () => {
      setRotationValues(prev => ({
        ...prev,
        [hoveredClock]: getClockRotation(clockSettings[hoveredClock])
      }))
    }

    // Update immediately and then every 16ms (60fps)
    updateRotation()
    const interval = setInterval(updateRotation, 16)

    return () => clearInterval(interval)
  }, [hoveredClock, currentTime])

  // Smooth animation for satellites
  useEffect(() => {
    if (type !== 1) return

    const animate = () => {
      const now = Date.now()
      const newRotations: Record<number, number[]> = {}
      
      // Calculate rotations for all clocks' satellites
      clockSettings.forEach((clock, clockIndex) => {
        if (!clockSatellites[clockIndex]) return
        
        const elapsedMilliseconds = now - clock.startDateTime.getTime()
        const configs = defaultSatelliteConfigs[clockIndex] || []
        
        newRotations[clockIndex] = configs.map(config => {
          const satelliteRotation = (elapsedMilliseconds / config.rotationTime) * 360
          return config.rotationDirection === 'clockwise'
            ? satelliteRotation
            : -satelliteRotation
        })
      })

      setSatelliteRotations(newRotations)
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [type])

  // Calculate rotation for each clock
  const getClockRotation = (clock: typeof clockSettings[0]) => {
    if (!currentTime) return 0
    const elapsedMilliseconds = currentTime.getTime() - clock.startDateTime.getTime()
    const calculatedRotation = (elapsedMilliseconds / clock.rotationTime) * 360
    return clock.rotationDirection === 'clockwise'
      ? (clock.startingDegree + calculatedRotation) % 360
      : (clock.startingDegree - calculatedRotation + 360) % 360
  }

  // Focus node colors from individual clocks
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-black/90">
      {showElements && (
        <DotNavigation
          activeDot={9}
          isSmallMultiView={type === 2}
        />
      )}
      <Menu
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
      />

      <div className="flex-grow flex items-center justify-center">
        {type === 1 && (
          <div className="relative w-[600px] h-[600px]">
            {clockSettings.map((clock, index) => {
              const rotation = getClockRotation(clock)
              return (
                <div
                  key={index}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    mixBlendMode: isDarkMode ? 'screen' : 'multiply',
                  }}
                >
                  <div className="w-full h-full relative">
                    {/* Clock face */}
                    <div className="absolute inset-0">
                      <motion.div
                        className="absolute inset-0"
                        animate={{ rotate: rotation }}
                        transition={{
                          duration: 1,
                          ease: "linear",
                        }}
                        style={{
                          transformOrigin: 'center',
                        }}
                      >
                        <div
                          className="absolute inset-0"
                          style={{
                            transform: `translate(${clock.imageX || 0}%, ${clock.imageY || 0}%) rotate(${clock.imageOrientation}deg) scale(${clock.imageScale})`,
                            transformOrigin: 'center',
                          }}
                        >
                          <Image
                            src={`/${index + 1}.svg`}
                            alt={`Clock ${index + 1}`}
                            fill
                            className="object-cover rounded-full dark:invert dark:brightness-100 [&_*]:fill-current [&_*]:stroke-none"
                            priority
                            loading="eager"
                          />
                        </div>
                      </motion.div>
                    </div>

                    {/* Focus nodes */}
                    <div 
                      className="absolute inset-0"
                      style={{
                        transform: `rotate(${rotation}deg)`,
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-full rounded-full relative">
                          {Array.from({ length: clock.focusNodes }).map((_, nodeIndex) => {
                            const angle = (nodeIndex * 360) / clock.focusNodes
                            const radius = 55
                            const x = 50 + radius * Math.cos((angle - 90) * (Math.PI / 180))
                            const y = 50 + radius * Math.sin((angle - 90) * (Math.PI / 180))
                            return (
                              <motion.div
                                key={nodeIndex}
                                className={`absolute w-2 h-2 rounded-full ${focusNodeColors[index]} dark:brightness-150`}
                                style={{
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
                                  duration: 0.5,
                                  delay: nodeIndex * 0.1,
                                  ease: "easeOut"
                                }}
                              />
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Satellites for all clocks */}
                    {clockSatellites[index] > 0 && (
                      <div className="absolute inset-0">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-full rounded-full relative">
                            {Array.from({ length: clockSatellites[index] }).map((_, satelliteIndex) => {
                              const angle = (satelliteIndex * 360) / clockSatellites[index]
                              const radius = 60
                              
                              // Use pre-calculated rotation from animation frame
                              const totalRotation = satelliteRotations[index]?.[satelliteIndex] || 0

                              // Apply both base position and rotation
                              const rotatedRadians = (angle + totalRotation) * (Math.PI / 180)
                              const x = 50 + radius * Math.cos((rotatedRadians - 90 * (Math.PI / 180)))
                              const y = 50 + radius * Math.sin((rotatedRadians - 90 * (Math.PI / 180)))

                              return (
                                <motion.div
                                  key={satelliteIndex}
                                  className="absolute w-2 h-2 rounded-full"
                                  style={{
                                    left: `${x}%`,
                                    top: `${y}%`,
                                    transform: 'translate(-50%, -50%)',
                                    backgroundColor: isDarkMode ? '#fff' : '#000',
                                    boxShadow: isDarkMode 
                                      ? '0 0 6px rgba(255, 255, 255, 0.4)' 
                                      : '0 0 6px rgba(0, 0, 0, 0.4)',
                                    willChange: 'transform'
                                  }}
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ 
                                    opacity: 1, 
                                    scale: 1,
                                  }}
                                  transition={{
                                    duration: 0.5,
                                    delay: 1 + satelliteIndex * 0.1,
                                    ease: "easeOut"
                                  }}
                                  whileHover={{ scale: 1.5 }}
                                />
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
          <div className="relative w-[450px] h-[450px]">
            {/* Satellite grid pattern */}
            <div 
              className="absolute inset-[-25%] rounded-full overflow-hidden opacity-40"
              style={{ zIndex: 20 }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src="/satellite-grid.jpg"
                  alt="Satellite Grid Pattern"
                  layout="fill"
                  objectFit="cover"
                  className="opacity-40 dark:invert"
                  priority
                />
              </div>
            </div>

            {/* Center layered clocks */}
            <motion.div 
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] aspect-square" 
              style={{ zIndex: 40 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {clockSettings.map((clock, index) => {
                if (index >= 9) return null;
                const rotation = getClockRotation(clock);
                return (
                  <div
                    key={index}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      mixBlendMode: isDarkMode ? 'screen' : 'multiply',
                    }}
                  >
                    <div className="w-full h-full relative">
                      {/* Clock face */}
                      <div className="absolute inset-0">
                        <div
                          className="absolute inset-0"
                          style={{ 
                            transform: `rotate(${rotation}deg)`,
                            transformOrigin: 'center',
                          }}
                        >
                          <div
                            className="absolute inset-0"
                            style={{
                              transform: `translate(${clock.imageX || 0}%, ${clock.imageY || 0}%) rotate(${clock.imageOrientation}deg) scale(${clock.imageScale})`,
                              transformOrigin: 'center',
                            }}
                          >
                            <Image
                              src={`/${index + 1}.svg`}
                              alt={`Clock ${index + 1}`}
                              fill
                              className="object-cover rounded-full dark:invert dark:brightness-100 [&_*]:fill-current [&_*]:stroke-none"
                              priority
                              loading="eager"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* Outer ring clocks */}
            <motion.div 
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              {clockSettings.map((clock, index) => {
                if (index >= 9) return null;
                const rotation = getClockRotation(clock);
                
                // Calculate position for outer clock
                const angle = 270 + 20 + (360 / 9) * index;
                const radius = 72;
                const radians = angle * (Math.PI / 180);
                const x = 50 + radius * Math.cos(radians);
                const y = 50 + radius * Math.sin(radians);

                return (
                  <div
                    key={index}
                    className="absolute aspect-square group hover:scale-110 transition-transform duration-200"
                    style={{
                      width: '32%',
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: 30,
                    }}
                    onMouseEnter={() => setHoveredClock(index)}
                    onMouseLeave={() => setHoveredClock(null)}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-black dark:text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                      {(hoveredClock === index ? rotationValues[index] : rotation).toFixed(1)}°
                    </div>
                    <div className="relative w-full h-full">
                      <div className="absolute inset-0 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-0"
                          style={{ 
                            transform: `rotate(${rotation}deg)`,
                            transformOrigin: 'center',
                          }}
                        >
                          <div
                            className="absolute inset-0"
                            style={{
                              transform: `translate(${clock.imageX || 0}%, ${clock.imageY || 0}%) rotate(${clock.imageOrientation}deg) scale(${clock.imageScale})`,
                              transformOrigin: 'center',
                            }}
                          >
                            <Image
                              src={`/clock_${index + 1}.svg`}
                              alt={`Clock ${index + 1}`}
                              fill
                              className="object-cover rounded-full dark:invert dark:brightness-100 [&_*]:fill-current [&_*]:stroke-none"
                              priority
                              loading="eager"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}