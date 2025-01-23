'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import AuthPopup from './AuthPopup'
import { Menu as MenuIcon, X, Settings, Eye, EyeOff, LogIn, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

interface MenuProps {
  showElements?: boolean
  onToggleShow?: () => void
  onSettingsClick?: () => void
  showSatellites?: boolean
  onSatellitesChange?: (show: boolean) => void
  isDarkMode?: boolean
  onDarkModeChange?: (isDark: boolean) => void
}

export default function Menu({
  showElements,
  onToggleShow,
  onSettingsClick,
  showSatellites,
  onSatellitesChange,
  isDarkMode,
  onDarkModeChange,
}: MenuProps) {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showAuthPopup, setShowAuthPopup] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <>
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={toggleMenu}
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="w-6 h-6 text-black dark:text-white" />
          ) : (
            <MenuIcon className="w-6 h-6 text-black dark:text-white" />
          )}
        </button>

        {isMenuOpen && (
          <div className="absolute top-12 right-0 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg shadow-lg py-2 min-w-[200px]">
            {session ? (
              <div className="px-4 py-2 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2 text-sm text-black/70 dark:text-white/70">
                  <User className="w-4 h-4" />
                  {session.user?.email}
                </div>
              </div>
            ) : null}
            
            <div className="px-2">
              <button
                onClick={onToggleShow}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded"
              >
                {showElements ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showElements ? 'Hide Elements' : 'Show Elements'}
              </button>

              {onSettingsClick && (
                <button
                  onClick={onSettingsClick}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
              )}

              {session ? (
                <button
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => setShowAuthPopup(true)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <AuthPopup isOpen={showAuthPopup} onClose={() => setShowAuthPopup(false)} />
    </>
  )
} 