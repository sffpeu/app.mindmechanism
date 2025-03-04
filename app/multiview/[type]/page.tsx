'use client'

import { useState } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { useParams } from 'next/navigation'
import DotNavigation from '@/components/DotNavigation'

export default function MultiViewPage() {
  const params = useParams()
  const type = parseInt(params.type as string)
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const { isDarkMode } = useTheme()

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
        {/* Multiview content will be rebuilt here */}
      </div>
    </div>
  )
} 