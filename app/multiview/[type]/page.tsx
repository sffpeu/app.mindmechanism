'use client'

import { useState, useEffect } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { useParams } from 'next/navigation'
import DotNavigation from '@/components/DotNavigation'
import { clockSettings } from '@/lib/clockSettings'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { ClockSettings } from '@/types/ClockSettings'

// Default satellite configurations for each clock
const defaultSatelliteConfigs = {
  1: [{ rotationTime: 60000, rotationDirection: 'clockwise' }],
  2: [{ rotationTime: 45000, rotationDirection: 'counterclockwise' }],
  3: [{ rotationTime: 30000, rotationDirection: 'clockwise' }],
  4: [{ rotationTime: 40000, rotationDirection: 'counterclockwise' }],
  5: [{ rotationTime: 50000, rotationDirection: 'clockwise' }],
  6: [{ rotationTime: 35000, rotationDirection: 'counterclockwise' }],
  7: [{ rotationTime: 55000, rotationDirection: 'clockwise' }],
  8: [{ rotationTime: 45000, rotationDirection: 'counterclockwise' }],
  9: [{ rotationTime: 40000, rotationDirection: 'clockwise' }],
}

export default function MultiViewPage() {
  const params = useParams()
  const type = parseInt(params.type as string)
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const { isDarkMode } = useTheme()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const isMultiView2 = type === 2

  // Initialize and update current time
  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

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

  // Render satellites for a clock
  const renderSatellites = (clockId: number, rotation: number) => {
    if (!showSatellites) return null;
    
    const satelliteConfig = defaultSatelliteConfigs[clockId as keyof typeof defaultSatelliteConfigs] || [];
    
    return satelliteConfig.map((satellite, index) => {
      const now = Date.now();
      const elapsedMilliseconds = now - clockSettings[clockId - 1].startDateTime.getTime();
      const satelliteRotation = (elapsedMilliseconds / satellite.rotationTime) * 360;
      const totalRotation = satellite.rotationDirection === 'clockwise'
        ? satelliteRotation
        : -satelliteRotation;

      // Calculate position
      const angle = totalRotation % 360;
      const radians = angle * (Math.PI / 180);
      const radius = 53; // Adjusted radius to match focus nodes
      const x = 50 + radius * Math.cos(radians);
      const y = 50 + radius * Math.sin(radians);

      return (
        <motion.div
          key={`satellite-${clockId}-${index}`}
          className="absolute"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 0.5 + (index * 0.1),
            duration: 0.5,
            ease: "easeOut"
          }}
          style={{
            left: `${x}%`,
            top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
          }}
          whileHover={{ scale: 1.5 }}
        >
          <div 
            className="w-2.5 h-2.5 rounded-full bg-black dark:bg-white"
            style={{
              mixBlendMode: isDarkMode ? 'screen' : 'multiply',
            }}
          />
        </motion.div>
      );
    });
  };

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
        showSatellites={showSatellites}
        onSatellitesChange={setShowSatellites}
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
                      <div
                        className="absolute inset-0"
                        style={{
                          transform: `rotate(${rotation}deg)`,
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
                                className={`absolute w-3 h-3 rounded-full ${focusNodeColors[index]} dark:brightness-150`}
                                style={{
                                  left: `${x}%`,
                                  top: `${y}%`,
                                  transform: 'translate(-50%, -50%)',
                                  mixBlendMode: isDarkMode ? 'screen' : 'multiply',
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

                    {/* Satellites */}
                    <div className="absolute inset-0">
                      {renderSatellites(index + 1, rotation)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
} 