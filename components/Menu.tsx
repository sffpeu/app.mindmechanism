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
        className="absolute top-4 left-4 p-2.5 rounded-lg bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 hover:bg-white/90 dark:hover:bg-black/90 transition-all z-[110] touch-manipulation"
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
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
            className="h-full w-72 bg-gradient-to-b from-white via-white to-gray-50 dark:from-black dark:via-black/95 dark:to-black/90 border-r border-black/5 dark:border-white/10 shadow-xl overflow-y-auto z-[100] backdrop-blur-xl"
          >
            <div className="pt-16 pb-4">
              <div className="px-2 space-y-1">
                <Link
                  href="/dashboard"
                  className={`group flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all touch-manipulation relative ${
                    pathname === '/dashboard' ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white' : ''
                  }`}
                >
                  <LayoutDashboard className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Dashboard</span>
                  {pathname === '/dashboard' && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute left-0 w-1 h-6 bg-black dark:bg-white rounded-full my-auto top-0 bottom-0"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
                <Link
                  href="/sessions"
                  className={`group flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all touch-manipulation relative ${
                    pathname === '/sessions' ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white' : ''
                  }`}
                >
                  <Clock className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Sessions</span>
                  {pathname === '/sessions' && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute left-0 w-1 h-6 bg-black dark:bg-white rounded-full my-auto top-0 bottom-0"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
                <Link
                  href="/notes"
                  className={`group flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all touch-manipulation relative ${
                    pathname === '/notes' ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white' : ''
                  }`}
                >
                  <ClipboardList className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Notes</span>
                  {pathname === '/notes' && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute left-0 w-1 h-6 bg-black dark:bg-white rounded-full my-auto top-0 bottom-0"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
                <Link
                  href="/glossary"
                  className={`group flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all touch-manipulation relative ${
                    pathname === '/glossary' ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white' : ''
                  }`}
                >
                  <BookOpen className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Glossary</span>
                  {pathname === '/glossary' && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute left-0 w-1 h-6 bg-black dark:bg-white rounded-full my-auto top-0 bottom-0"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              </div>

              {/* Settings Section */}
              <div className="px-2 mt-6 pt-6 border-t border-black/5 dark:border-white/10 space-y-1">
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="group flex items-center justify-between w-full px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all touch-manipulation"
                >
                  <div className="flex items-center gap-3">
                    {isDarkMode ? 
                      <Moon className="h-5 w-5 group-hover:scale-110 transition-transform" /> : 
                      <Sun className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    }
                    <span className="font-medium">
                      {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                    </span>
                  </div>
                  <Switch
                    checked={isDarkMode}
                    onCheckedChange={setIsDarkMode}
                    className="data-[state=checked]:bg-black dark:data-[state=checked]:bg-white data-[state=unchecked]:bg-black/20 dark:data-[state=unchecked]:bg-white/20 h-5 w-10"
                  />
                </button>

                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="group flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all touch-manipulation"
                >
                  <Settings className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Settings</span>
                </button>
              </div>

              {/* Sign Out Section */}
              {user && (
                <div className="px-2 mt-6 pt-6 border-t border-black/5 dark:border-white/10">
                  <button
                    onClick={handleSignOut}
                    className="group flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all touch-manipulation"
                  >
                    <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Sign Out</span>
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