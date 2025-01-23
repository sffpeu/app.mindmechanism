'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import AuthPopup from './AuthPopup'
import { Menu as MenuIcon, X, Settings, Eye, EyeOff, LogIn, LogOut, User, Shield, Trash2 } from 'lucide-react'
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
  const [showProfileSettings, setShowProfileSettings] = useState(false)

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
              <>
                <div className="px-4 py-2 border-b border-black/10 dark:border-white/10">
                  <div className="flex items-center gap-2 text-sm text-black/70 dark:text-white/70">
                    <User className="w-4 h-4" />
                    {session.user?.email}
                  </div>
                </div>
                <div className="px-2 py-1">
                  <button
                    onClick={() => setShowProfileSettings(true)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded"
                  >
                    <Settings className="w-4 h-4" />
                    Profile Settings
                  </button>
                </div>
              </>
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
                  Clock Settings
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

      {showProfileSettings && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-md bg-white dark:bg-black p-8 rounded-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowProfileSettings(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
              type="button"
            >
              <X className="w-5 h-5 text-black/70 dark:text-white/70" />
            </button>

            <h2 className="text-2xl font-light text-black dark:text-white mb-6">Profile Settings</h2>

            <div className="space-y-4">
              <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
                <div>
                  <div className="font-medium">General Settings</div>
                  <div className="text-black/60 dark:text-white/60 text-xs">Update your profile information</div>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
                <Shield className="w-5 h-5" />
                <div>
                  <div className="font-medium">Security</div>
                  <div className="text-black/60 dark:text-white/60 text-xs">Manage your password and security settings</div>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-500 hover:bg-red-500/5 rounded-lg transition-colors">
                <Trash2 className="w-5 h-5" />
                <div>
                  <div className="font-medium">Delete Account</div>
                  <div className="text-red-500/60 text-xs">Permanently delete your account and all data</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 