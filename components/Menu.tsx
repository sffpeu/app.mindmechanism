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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

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

  const NavLink = ({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) => {
    const isActive = pathname === href
    return (
      <Link
        href={href}
        className={`group flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all touch-manipulation relative ${
          isActive ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white' : ''
        }`}
      >
        <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
        <span className="text-sm font-medium">{children}</span>
        {isActive && (
          <motion.div
            layoutId="active-indicator"
            className="absolute left-0 w-1 h-5 bg-black dark:bg-white rounded-full my-auto top-0 bottom-0"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </Link>
    )
  }

  return (
    <>
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-[110] h-9 w-9 rounded-lg bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-black/5 dark:border-white/10 hover:bg-white/90 dark:hover:bg-black/90"
          >
            <MenuIcon className="h-4 w-4 text-black dark:text-white" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-72 p-0 bg-gradient-to-b from-white via-white to-gray-50 dark:from-black dark:via-black/95 dark:to-black/90 backdrop-blur-xl"
        >
          <div className="h-full flex flex-col">
            <div className="flex-1 py-6">
              <div className="px-2 space-y-1">
                <NavLink href="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
                <NavLink href="/sessions" icon={Clock}>Sessions</NavLink>
                <NavLink href="/notes" icon={ClipboardList}>Notes</NavLink>
                <NavLink href="/glossary" icon={BookOpen}>Glossary</NavLink>
              </div>

              <Separator className="my-6 bg-black/5 dark:bg-white/10" />

              <div className="px-2 space-y-1">
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="group flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all touch-manipulation"
                >
                  <div className="flex items-center gap-3">
                    {isDarkMode ? 
                      <Moon className="h-4 w-4 group-hover:scale-110 transition-transform" /> : 
                      <Sun className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    }
                    <span className="text-sm font-medium">
                      {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                    </span>
                  </div>
                  <Switch
                    checked={isDarkMode}
                    onCheckedChange={setIsDarkMode}
                    className="data-[state=checked]:bg-black dark:data-[state=checked]:bg-white data-[state=unchecked]:bg-black/20 dark:data-[state=unchecked]:bg-white/20 h-5 w-9"
                  />
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false)
                    setIsSettingsOpen(true)
                  }}
                  className="group flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all touch-manipulation"
                >
                  <Settings className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Settings</span>
                </button>
              </div>
            </div>

            {user && (
              <div className="p-2 border-t border-black/5 dark:border-white/10">
                <button
                  onClick={handleSignOut}
                  className="group flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all touch-manipulation"
                >
                  <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <SettingsDialog 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  )
} 