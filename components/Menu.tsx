'use client'

import { useState } from 'react'
import { Menu as MenuIcon, X, Settings, Sun, Moon, User, LogIn, LayoutGrid, Play, BookOpen, ClipboardList, Eye, Home } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useTheme } from '@/app/ThemeContext'

interface MenuProps {
  showElements: boolean
  onToggleShow: () => void
  showSatellites: boolean
  onSatellitesChange: (checked: boolean) => void
  showInfoCards?: boolean
  onInfoCardsChange?: (checked: boolean) => void
}

export function Menu({
  showElements,
  onToggleShow,
  showSatellites,
  onSatellitesChange,
  showInfoCards = true,
  onInfoCardsChange,
}: MenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const isClockPage = pathname?.includes('/clock/')
  const { isDarkMode, setIsDarkMode } = useTheme()

  return (
    <>
      {showElements ? (
        <>
          {/* Left Sidebar */}
          <div className="fixed left-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
            <Link href="/home">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative w-9 h-9 rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-lg border border-black/10 dark:border-white/20 hover:border-black/50 dark:hover:border-white/50 hover:border-2 dark:hover:border-2 transition-all flex items-center justify-center"
              >
                <Home className="h-[18px] w-[18px] text-black dark:text-white" />
                <div className="absolute left-12 px-2 py-1 bg-white dark:bg-black rounded-md text-sm font-medium text-black dark:text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-black/10 dark:border-white/20">
                  Home
                </div>
              </motion.button>
            </Link>

            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative w-9 h-9 rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-lg border border-black/10 dark:border-white/20 hover:border-black/50 dark:hover:border-white/50 hover:border-2 dark:hover:border-2 transition-all flex items-center justify-center"
              >
                <LayoutGrid className="h-[18px] w-[18px] text-black dark:text-white" />
                <div className="absolute left-12 px-2 py-1 bg-white dark:bg-black rounded-md text-sm font-medium text-black dark:text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-black/10 dark:border-white/20">
                  Dashboard
                </div>
              </motion.button>
            </Link>

            <Link href="/sessions">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative w-9 h-9 rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-lg border border-black/10 dark:border-white/20 hover:border-black/50 dark:hover:border-white/50 hover:border-2 dark:hover:border-2 transition-all flex items-center justify-center"
              >
                <Play className="h-[18px] w-[18px] text-black dark:text-white" />
                <div className="absolute left-12 px-2 py-1 bg-white dark:bg-black rounded-md text-sm font-medium text-black dark:text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-black/10 dark:border-white/20">
                  Sessions
                </div>
              </motion.button>
            </Link>

            <Link href="/glossary">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative w-9 h-9 rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-lg border border-black/10 dark:border-white/20 hover:border-black/50 dark:hover:border-white/50 hover:border-2 dark:hover:border-2 transition-all flex items-center justify-center"
              >
                <BookOpen className="h-[18px] w-[18px] text-black dark:text-white" />
                <div className="absolute left-12 px-2 py-1 bg-white dark:bg-black rounded-md text-sm font-medium text-black dark:text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-black/10 dark:border-white/20">
                  Glossary
                </div>
              </motion.button>
            </Link>

            <Link href="/notes">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative w-9 h-9 rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-lg border border-black/10 dark:border-white/20 hover:border-black/50 dark:hover:border-white/50 hover:border-2 dark:hover:border-2 transition-all flex items-center justify-center"
              >
                <ClipboardList className="h-[18px] w-[18px] text-black dark:text-white" />
                <div className="absolute left-12 px-2 py-1 bg-white dark:bg-black rounded-md text-sm font-medium text-black dark:text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-black/10 dark:border-white/20">
                  Notes
                </div>
              </motion.button>
            </Link>
          </div>

          {/* Top Right Menu Button */}
          <div className="absolute top-4 right-4 z-10">
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative w-9 h-9 rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-lg border border-black/10 dark:border-white/20 hover:border-black/50 dark:hover:border-white/50 hover:border-2 dark:hover:border-2 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={false}
                animate={{ rotate: isMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isMenuOpen ? (
                  <X className="h-[18px] w-[18px] text-black dark:text-white" />
                ) : (
                  <MenuIcon className="h-[18px] w-[18px] text-black dark:text-white" />
                )}
              </motion.div>
            </motion.button>
          </div>

          {/* Bottom Right Settings Button - Only show on clock pages */}
          {isClockPage && (
            <div className="fixed bottom-4 right-4 z-10">
              <motion.button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="relative w-9 h-9 rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-lg border border-black/10 dark:border-white/20 hover:border-black/50 dark:hover:border-white/50 hover:border-2 dark:hover:border-2 transition-all flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings className="h-[18px] w-[18px] text-black dark:text-white" />
              </motion.button>

              <AnimatePresence>
                {isSettingsOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-12 right-0 bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-xl shadow-lg z-20 min-w-[200px] overflow-hidden border border-black/10 dark:border-white/20"
                  >
                    <div className="py-2 space-y-1">
                      <div className="px-3 py-1.5 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800 dark:text-white">
                          Show UI
                        </span>
                        <Switch
                          checked={showElements}
                          onCheckedChange={onToggleShow}
                        />
                      </div>

                      <div className="px-3 py-1.5 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800 dark:text-white">
                          Show Satellites
                        </span>
                        <Switch
                          checked={showSatellites}
                          onCheckedChange={onSatellitesChange}
                        />
                      </div>

                      {onInfoCardsChange && (
                        <div className="px-3 py-1.5 flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-800 dark:text-white">
                            Show Info Cards
                          </span>
                          <Switch
                            checked={showInfoCards}
                            onCheckedChange={onInfoCardsChange}
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.15 }}
                className="fixed top-14 right-4 bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-xl shadow-lg z-20 min-w-[200px] overflow-hidden border border-black/10 dark:border-white/20"
              >
                <div className="py-2 space-y-1">
                  <button
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-800 dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </button>

                  <div className="px-3 py-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800 dark:text-white flex items-center gap-2">
                      {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      Dark Mode
                    </span>
                    <Switch
                      checked={isDarkMode}
                      onCheckedChange={setIsDarkMode}
                    />
                  </div>

                  <div className="h-px bg-black/10 dark:bg-white/10 mx-2" />

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-800 dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <motion.button
          onClick={onToggleShow}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-4 right-4 w-9 h-9 rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-lg border border-black/10 dark:border-white/20 hover:border-white/50 dark:hover:border-white/50 hover:border-2 dark:hover:border-2 transition-all flex items-center justify-center z-10"
        >
          <Eye className="h-[18px] w-[18px] text-black/50 dark:text-white/50 hover:text-white dark:hover:text-white transition-colors" />
        </motion.button>
      )}
    </>
  )
} 