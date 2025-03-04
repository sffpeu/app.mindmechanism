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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-black/95">
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
            {clockSettings.map((clock, index) => (
              <div
                key={index}
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  opacity: 0.15,
                }}
              >
                <div className="w-full h-full relative">
                  <div className="absolute inset-0">
                    <div
                      className="absolute inset-0"
                      style={{
                        transform: `rotate(${clock.imageOrientation}deg)`,
                      }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{
                          transform: `translate(${clock.imageX || 0}%, ${clock.imageY || 0}%) scale(${clock.imageScale})`,
                          transformOrigin: 'center',
                        }}
                      >
                        <Image
                          src={clock.imageUrl}
                          alt={`Clock ${index + 1}`}
                          fill
                          className="object-cover rounded-full dark:invert [&_*]:fill-current [&_*]:stroke-none"
                          priority
                          loading="eager"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[98%] h-[98%] rounded-full relative">
                      {Array.from({ length: clock.focusNodes }).map((_, nodeIndex) => {
                        const angle = (nodeIndex * 360) / clock.focusNodes
                        const radius = 49
                        const x = 50 + radius * Math.cos((angle - 90) * (Math.PI / 180))
                        const y = 50 + radius * Math.sin((angle - 90) * (Math.PI / 180))
                        return (
                          <div
                            key={nodeIndex}
                            className={`absolute w-2.5 h-2.5 rounded-full ${
                              index === 0 ? 'bg-red-500' :
                              index === 1 ? 'bg-orange-500' :
                              index === 2 ? 'bg-yellow-500' :
                              index === 3 ? 'bg-green-500' :
                              index === 4 ? 'bg-blue-500' :
                              index === 5 ? 'bg-pink-500' :
                              index === 6 ? 'bg-purple-500' :
                              index === 7 ? 'bg-indigo-500' :
                              'bg-cyan-500'
                            }`}
                            style={{
                              left: `${x}%`,
                              top: `${y}%`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 