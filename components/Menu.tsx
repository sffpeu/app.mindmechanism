'use client'

import { useState } from 'react'
import { Menu as MenuIcon, X, Settings, Info, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

interface MenuProps {
  showElements: boolean
  onToggleShow: () => void
  onSettingsClick?: () => void
  showSatellites: boolean
  onSatellitesChange: (checked: boolean) => void
  isDarkMode: boolean
  onDarkModeChange: (checked: boolean) => void
}

export function Menu({
  showElements,
  onToggleShow,
  onSettingsClick,
  showSatellites,
  onSatellitesChange,
  isDarkMode,
  onDarkModeChange
}: MenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      {showElements && (
        <>
          <Button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="absolute top-4 right-4 z-10 hover:bg-transparent dark:text-white"
            size="icon"
            variant="ghost"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </Button>
          
          {isMenuOpen && (
            <div className="fixed top-16 right-4 bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-lg shadow-lg z-20 min-w-[200px] py-2 ring-1 ring-black/10 dark:ring-white/20">
              <div className="w-full px-4 py-2 flex items-center justify-between text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-800">
                <span className="font-medium">Dark Mode</span>
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={onDarkModeChange}
                  className="data-[state=checked]:bg-gray-900 data-[state=unchecked]:bg-gray-200"
                />
              </div>
              <div className="w-full px-4 py-2 flex items-center justify-between text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-800">
                <span className="font-medium">Show Satellites</span>
                <Switch
                  checked={showSatellites}
                  onCheckedChange={onSatellitesChange}
                  className="data-[state=checked]:bg-gray-900 data-[state=unchecked]:bg-gray-200"
                />
              </div>
              {onSettingsClick && (
                <button
                  onClick={() => {
                    onSettingsClick();
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-white flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
              )}
            </div>
          )}
        </>
      )}
      <div 
        onClick={onToggleShow} 
        className="fixed bottom-4 right-4 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors z-10"
      >
        {showElements ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
      </div>
    </>
  )
} 