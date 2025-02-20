'use client'

import { useState } from 'react'
import { Menu as MenuIcon, X, Settings, Sun, Moon, Eye, Home, LayoutGrid, Play, BookOpen, ClipboardList, LogOut, Info, LayoutDashboard, Clock } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useTheme } from '@/app/ThemeContext'
import { useAuth } from '@/lib/FirebaseAuthContext'
import Image from 'next/image'
import { SettingsDialog } from './settings/SettingsDialog'

interface MenuProps {
  showElements?: boolean
  onToggleShow?: () => void
  showSatellites?: boolean
  onSatellitesChange?: (value: boolean) => void
  showInfoCards?: boolean
  onInfoCardsChange?: (checked: boolean) => void
}

export function Menu({
  showElements = true,
  onToggleShow = () => {},
  showSatellites = false,
  onSatellitesChange = () => {},
  showInfoCards = true,
  onInfoCardsChange,
}: MenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const isClockPage = pathname?.includes('/clock/')
  const { isDarkMode, setIsDarkMode } = useTheme()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="fixed inset-y-0 left-0 z-[100] flex">
      {/* Backdrop when menu is open */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-[90]"
          />
        )}
      </AnimatePresence>

      {/* Menu Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="absolute top-4 left-4 p-2 rounded-lg bg-white dark:bg-black border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all z-[110]"
      >
        {isMenuOpen ? (
          <X className="h-5 w-5 text-black dark:text-white" />
        ) : (
          <MenuIcon className="h-5 w-5 text-black dark:text-white" />
        )}
      </button>

      {/* Side Menu */}
      <AnimatePresence mode="wait">
        {isMenuOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
            className="h-full w-64 bg-white dark:bg-black border-r border-black/5 dark:border-white/10 shadow-lg overflow-y-auto z-[100]"
          >
            <div className="pt-16 pb-4">
              <div className="px-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span className="font-medium">Dashboard</span>
                </Link>
                <Link
                  href="/sessions"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                >
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Sessions</span>
                </Link>
                <Link
                  href="/notes"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                >
                  <ClipboardList className="h-5 w-5" />
                  <span className="font-medium">Notes</span>
                </Link>
                <Link
                  href="/glossary"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                >
                  <BookOpen className="h-5 w-5" />
                  <span className="font-medium">Glossary</span>
                </Link>
              </div>

              {/* Settings Section */}
              <div className="px-2 mt-4 border-t border-gray-200 dark:border-white/10">
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    <span className="font-medium">
                      {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                    </span>
                  </div>
                  <Switch
                    checked={isDarkMode}
                    onCheckedChange={setIsDarkMode}
                    className="data-[state=checked]:bg-black dark:data-[state=checked]:bg-white data-[state=unchecked]:bg-black/20 dark:data-[state=unchecked]:bg-white/20"
                  />
                </button>

                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                >
                  <Settings className="h-5 w-5" />
                  <span className="font-medium">Settings</span>
                </button>
              </div>

              {/* Sign Out Section */}
              {user && (
                <div className="px-2 mt-4 border-t border-gray-200 dark:border-white/10">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut className="h-5 w-5" />
                      <span className="font-medium">Sign Out</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SettingsDialog 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  )
} 