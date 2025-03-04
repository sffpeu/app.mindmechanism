'use client'

import { useState, useEffect } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { useParams } from 'next/navigation'
import DotNavigation from '@/components/DotNavigation'
import { clockSettings } from '@/lib/clockSettings'
import Image from 'next/image'

export default function MultiViewPage() {
  const params = useParams()
  const type = parseInt(params.type as string)
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const { isDarkMode } = useTheme()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

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
                              <div
                                key={nodeIndex}
                                className={`absolute w-3 h-3 rounded-full ${
                                  index === 0 ? 'bg-red-500 dark:bg-red-400' :
                                  index === 1 ? 'bg-orange-500 dark:bg-orange-400' :
                                  index === 2 ? 'bg-yellow-500 dark:bg-yellow-400' :
                                  index === 3 ? 'bg-green-500 dark:bg-green-400' :
                                  index === 4 ? 'bg-blue-500 dark:bg-blue-400' :
                                  index === 5 ? 'bg-pink-500 dark:bg-pink-400' :
                                  index === 6 ? 'bg-purple-500 dark:bg-purple-400' :
                                  index === 7 ? 'bg-indigo-500 dark:bg-indigo-400' :
                                  'bg-cyan-500 dark:bg-cyan-400'
                                } dark:brightness-150`}
                                style={{
                                  left: `${x}%`,
                                  top: `${y}%`,
                                  transform: 'translate(-50%, -50%)',
                                  mixBlendMode: isDarkMode ? 'screen' : 'multiply',
                                }}
                              />
                            )
                          })}

                          {/* Satellites */}
                          {showSatellites && clock.satellites?.map((satellite, satIndex) => {
                            const angle = (satIndex * 360) / (clock.satellites?.length || 1)
                            const radius = 60
                            const x = 50 + radius * Math.cos((angle - 90) * (Math.PI / 180))
                            const y = 50 + radius * Math.sin((angle - 90) * (Math.PI / 180))
                            return (
                              <div
                                key={`satellite-${satIndex}`}
                                className={`absolute w-2 h-2 rounded-full ${
                                  index === 0 ? 'bg-red-300 dark:bg-red-200' :
                                  index === 1 ? 'bg-orange-300 dark:bg-orange-200' :
                                  index === 2 ? 'bg-yellow-300 dark:bg-yellow-200' :
                                  index === 3 ? 'bg-green-300 dark:bg-green-200' :
                                  index === 4 ? 'bg-blue-300 dark:bg-blue-200' :
                                  index === 5 ? 'bg-pink-300 dark:bg-pink-200' :
                                  index === 6 ? 'bg-purple-300 dark:bg-purple-200' :
                                  index === 7 ? 'bg-indigo-300 dark:bg-indigo-200' :
                                  'bg-cyan-300 dark:bg-cyan-200'
                                } dark:brightness-150`}
                                style={{
                                  left: `${x}%`,
                                  top: `${y}%`,
                                  transform: 'translate(-50%, -50%)',
                                  mixBlendMode: isDarkMode ? 'screen' : 'multiply',
                                }}
                              />
                            )
                          })}
                        </div>
                      </div>
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