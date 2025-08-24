'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { Play, BookOpen, ClipboardList, ArrowRight, LogIn, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import DotNavigation from '@/components/DotNavigation'
import { clockSettings } from '@/lib/clockSettings'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/FirebaseAuthContext'
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

export default function Home1Page() {
  const [showElements, setShowElements] = useState(true)
  const { isDarkMode } = useTheme()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [rotationValues, setRotationValues] = useState<Record<number, number[]>>({})
  const animationRef = useRef<number>()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const featuresRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/signin')
  }

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

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

  // Optimize rotation values update with batch updates
  useEffect(() => {
    const updateRotations = () => {
      const now = Date.now();
      const newRotations: Record<number, number[]> = {};
      
      clockSettings.forEach((clock, index) => {
        if (!clockSatellites[index]) return;
        
        const elapsedMilliseconds = now - clock.startDateTime.getTime();
        const configs = defaultSatelliteConfigs[index] || [];
        
        newRotations[index] = configs.map(config => {
          const satelliteRotation = (elapsedMilliseconds / config.rotationTime) * 360;
          return config.rotationDirection === 'clockwise'
            ? satelliteRotation % 360
            : (-satelliteRotation + 360) % 360;
        });
      });

      setRotationValues(newRotations);
      animationRef.current = requestAnimationFrame(updateRotations);
    };

    updateRotations();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [clockSettings]);

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
      {/* Navigation Layer */}
      <div className="fixed inset-0 pointer-events-none z-[999]">
        <div className="pointer-events-auto">
          {showElements && (
            <DotNavigation
              activeDot={9}
              isSmallMultiView={false}
            />
          )}
          <Menu
            showElements={showElements}
            onToggleShow={() => setShowElements(!showElements)}
          />
        </div>
      </div>

      {/* Content Layer - Multiview Background */}
      <div className="relative flex-grow flex items-center justify-center z-0">
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
      </div>

      {/* Home Page Elements Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pointer-events-auto">
          {/* Welcome Section */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-7xl font-bold text-black dark:text-white mb-4">
                1M3 Mindmechanism
              </h1>
              <p className="text-xl md:text-2xl text-black/90 dark:text-white/90 max-w-2xl mx-auto mb-8">
                Your mind. Your mechanism.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button 
                  onClick={scrollToFeatures}
                  className="px-6 py-2.5 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 transition-all text-sm"
                >
                  Explore
                </button>
                {user ? (
                  <button
                    onClick={handleSignOut}
                    className="px-6 py-2.5 rounded-lg bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all flex items-center gap-2 text-sm text-black dark:text-white"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={() => router.push('/auth/signin')}
                    className="px-6 py-2.5 rounded-lg bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all flex items-center gap-2 text-sm text-black dark:text-white"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </button>
                )}
              </div>
            </motion.div>
          </div>

          {/* Features Section */}
          <div ref={featuresRef} className="space-y-8 mt-32">
            <h2 className="text-lg font-semibold text-black dark:text-white">Key Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center mb-3">
                  <Play className="h-4 w-4 text-black dark:text-white" />
                </div>
                <h3 className="text-base font-medium text-black dark:text-white mb-2">Meditation Clock</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">A unique clock interface designed to enhance your meditation practice.</p>
                <button 
                  onClick={() => router.push('/sessions')}
                  className="flex items-center gap-1.5 text-xs font-medium text-black dark:text-white group-hover:gap-2 transition-all"
                >
                  Learn more
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center mb-3">
                  <BookOpen className="h-4 w-4 text-black dark:text-white" />
                </div>
                <h3 className="text-base font-medium text-black dark:text-white mb-2">Guided Sessions</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Access a library of guided meditation sessions for all levels.</p>
                <button 
                  onClick={() => router.push('/sessions')}
                  className="flex items-center gap-1.5 text-xs font-medium text-black dark:text-white group-hover:gap-2 transition-all"
                >
                  Learn more
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center mb-3">
                  <ClipboardList className="h-4 w-4 text-black dark:text-white" />
                </div>
                <h3 className="text-base font-medium text-black dark:text-white mb-2">Progress Tracking</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Monitor your meditation journey with detailed insights and statistics.</p>
                <button 
                  onClick={() => router.push('/sessions')}
                  className="flex items-center gap-1.5 text-xs font-medium text-black dark:text-white group-hover:gap-2 transition-all"
                >
                  Learn more
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
