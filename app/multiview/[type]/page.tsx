'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
  const [rotationValues, setRotationValues] = useState<Record<number, number[]>>({})
  const animationRef = useRef<number>()

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

  // Remove the duplicate satellite animation effect and combine the rotation logic
  useEffect(() => {
    if (type !== 1 && type !== 2) return;

    const animate = () => {
      const now = Date.now();
      const newRotations: Record<number, number[]> = {};
      
      // Calculate rotations for all clocks
      clockSettings.forEach((clock, clockIndex) => {
        const elapsedMilliseconds = now - clock.startDateTime.getTime();
        const calculatedRotation = (elapsedMilliseconds / clock.rotationTime) * 360;
        const baseRotation = clock.rotationDirection === 'clockwise'
          ? (clock.startingDegree + calculatedRotation) % 360
          : (clock.startingDegree - calculatedRotation + 360) % 360;
        
        // Store the base rotation as first element
        newRotations[clockIndex] = [baseRotation];
        
        // Add satellite rotations if they exist
        if (clockSatellites[clockIndex]) {
          const configs = defaultSatelliteConfigs[clockIndex] || [];
          const satelliteRotations = configs.map(config => {
            const satelliteRotation = (elapsedMilliseconds / config.rotationTime) * 360;
            return config.rotationDirection === 'clockwise'
              ? satelliteRotation % 360
              : (-satelliteRotation + 360) % 360;
          });
          newRotations[clockIndex].push(...satelliteRotations);
        }
      });

      setRotationValues(newRotations);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [type, clockSettings]);

  // Update getClockRotation to use rotationValues
  const getClockRotation = (clock: typeof clockSettings[0], index: number) => {
    return (rotationValues[index]?.[0] || 0);
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
      {/* Navigation Layer */}
      <div className="fixed inset-0 pointer-events-none z-[999]">
        <div className="pointer-events-auto">
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
        </div>
      </div>

      {/* Content Layer */}
      <div className="relative flex-grow flex items-center justify-center z-0">
        {type === 1 && (
          <div className="relative w-[600px] h-[600px]">
            {clockSettings.map((clock, index) => {
              const rotation = getClockRotation(clock, index)
              return (
                <div
                  key={index}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    mixBlendMode: isDarkMode ? 'screen' : 'multiply',
                  }}
                >
                  <div className="w-full h-full relative">
                    {/* Clock face with shorter initial animation */}
                    <div className="absolute inset-0">
                      <motion.div
                        className="absolute inset-0"
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

                    {/* Focus nodes moved slightly inward */}
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
                            const radius = 53 // Reduced from 55 to move focus nodes inward
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
                      <div className="absolute inset-0">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-full rounded-full relative">
                            {Array.from({ length: clockSatellites[index] }).map((_, satelliteIndex) => {
                              const { x, y } = getSatellitePosition(index, satelliteIndex, clockSatellites[index])
                              return (
                                <motion.div
                                  key={satelliteIndex}
                                  className="absolute w-3 h-3 rounded-full"
                                  style={{
                                    left: `${x}%`,
                                    top: `${y}%`,
                                    transform: 'translate(-50%, -50%)',
                                    backgroundColor: isDarkMode ? '#fff' : '#000',
                                    boxShadow: isDarkMode 
                                      ? '0 0 6px rgba(255, 255, 255, 0.3)' 
                                      : '0 0 6px rgba(0, 0, 0, 0.3)',
                                    willChange: 'transform'
                                  }}
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ 
                                    opacity: 1, 
                                    scale: 1,
                                  }}
                                  transition={{
                                    duration: 0.3,
                                    delay: 0.3 + satelliteIndex * 0.05,
                                    ease: "easeOut"
                                  }}
                                  whileHover={{ scale: 1.8 }}
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
            <motion.div 
              className="absolute inset-[-25%] rounded-full overflow-hidden opacity-40"
              style={{ zIndex: 20 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ duration: 0.8, delay: 1.2 }}
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
            </motion.div>

            {/* Center layered clocks */}
            <motion.div 
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] aspect-square" 
              style={{ zIndex: 40 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
            >
              {clockSettings.slice(0, 9).map((clock, index) => (
                <div
                  key={index}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    mixBlendMode: isDarkMode ? 'screen' : 'multiply',
                  }}
                >
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0">
                      <div
                        className="absolute inset-0"
                        style={{ 
                          transform: `rotate(${rotationValues[index]?.[0] || 0}deg)`,
                          transformOrigin: 'center',
                          willChange: 'transform'
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
              ))}
            </motion.div>

            {/* Outer ring clocks */}
            <motion.div 
              className="absolute inset-0"
              style={{ zIndex: 30 }}
            >
              {clockSettings.slice(0, 9).map((clock, index) => {
                const rotation = rotationValues[index]?.[0] || 0;
                
                // Map indices to arrange clocks in specific order
                const positionIndex = index === 5 ? 0 : // Clock 6 to position 1
                                    index === 3 ? 1 : // Clock 4 to position 2
                                    index === 8 ? 2 : // Clock 9 to position 3
                                    index === 2 ? 3 : // Clock 3 to position 4
                                    index === 0 ? 4 : // Clock 1 to position 5
                                    index === 6 ? 5 : // Clock 7 to position 6
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

                return (
                  <motion.div
                    key={index}
                    className="absolute aspect-square transition-transform duration-200"
                    style={{
                      width: '28%',
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.4,
                      delay: positionIndex * 0.08,
                      ease: "easeOut"
                    }}
                  >
                    <div className="relative w-full h-full">
                      <div
                        className="absolute inset-0 rounded-full overflow-hidden"
                        style={{
                          transform: `rotate(${rotation}deg)`,
                        }}
                      >
                        <div
                          className="absolute inset-0"
                          style={{
                            transform: `translate(${clock.imageX || 0}%, ${clock.imageY || 0}%) rotate(${clock.imageOrientation}deg) scale(${clock.imageScale})`,
                            transformOrigin: 'center',
                            mixBlendMode: 'multiply',
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
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}