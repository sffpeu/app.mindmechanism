'use client'

import { useState } from 'react'
import { Menu as MenuIcon, X, Settings, Sun, Moon, Eye, Home, LayoutGrid, Play, BookOpen, ClipboardList, LogOut, Info, LayoutDashboard } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useTheme } from '@/app/ThemeContext'
import { useAuth } from '@/lib/FirebaseAuthContext'
import Image from 'next/image'

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
    router.push('/')
  }

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="p-2 rounded-lg bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all"
      >
        {isMenuOpen ? (
          <X className="h-5 w-5 text-black dark:text-white" />
        ) : (
          <MenuIcon className="h-5 w-5 text-black dark:text-white" />
        )}
      </button>

      {isMenuOpen && (
        <div className="absolute left-0 mt-2 w-64 rounded-xl bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 shadow-lg">
          <div className="p-2">
            <nav className="space-y-1">
              <Link
                href="/"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
              >
                <Home className="h-5 w-5" />
                Home
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
              >
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </Link>
              <Link
                href="/sessions"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
              >
                <Play className="h-5 w-5" />
                Sessions
              </Link>
              <Link
                href="/glossary"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
              >
                <BookOpen className="h-5 w-5" />
                Glossary
              </Link>
              <Link
                href="/notes"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
              >
                <ClipboardList className="h-5 w-5" />
                Notes
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
              >
                <Settings className="h-5 w-5" />
                Settings
              </Link>
            </nav>
          </div>
          {user && (
            <div className="p-2 border-t border-gray-200 dark:border-white/10">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 