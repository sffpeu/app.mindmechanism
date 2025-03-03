'use client'

import { useState } from 'react'
import { Menu as MenuIcon, X, Settings, Sun, Moon, BookOpen, ClipboardList, LogOut, LayoutDashboard, Clock } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useTheme } from '@/app/ThemeContext'
import { useAuth } from '@/lib/FirebaseAuthContext'
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

const menuContainerVariants = {
  hidden: { 
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.2
    }
  },
  visible: { 
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3
    }
  }
}

const MenuCategory = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="px-2">
    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 mb-2">{title}</h3>
    <div className="space-y-1">
      {children}
    </div>
  </div>
)

const Path = (props: any) => (
  <motion.path
    fill="transparent"
    strokeWidth="2"
    stroke="currentColor"
    strokeLinecap="round"
    {...props}
  />
)

const MenuIcon = ({ isOpen }: { isOpen: boolean }) => {
  return (
    <motion.svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      className="text-black dark:text-white"
    >
      <Path
        variants={{
          closed: { d: "M 2 4 L 18 4" },
          open: { d: "M 3 16.5 L 17 2.5" }
        }}
        animate={isOpen ? "open" : "closed"}
        transition={{ duration: 0.3 }}
      />
      <Path
        d="M 2 10 L 18 10"
        variants={{
          closed: { opacity: 1 },
          open: { opacity: 0 }
        }}
        transition={{ duration: 0.3 }}
        animate={isOpen ? "open" : "closed"}
      />
      <Path
        variants={{
          closed: { d: "M 2 16 L 18 16" },
          open: { d: "M 3 2.5 L 17 16.5" }
        }}
        animate={isOpen ? "open" : "closed"}
        transition={{ duration: 0.3 }}
      />
    </motion.svg>
  )
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
          isActive ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white font-medium' : ''
        }`}
      >
        <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
        <span className="text-sm">{children}</span>
        {isActive && (
          <div className="absolute left-0 w-1 h-5 bg-gradient-to-b from-black to-gray-700 dark:from-white dark:to-white/70 rounded-full my-auto top-0 bottom-0" />
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
            className="fixed top-4 left-4 z-[110] h-9 w-9 rounded-lg bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-black/5 dark:border-white/10 hover:bg-white/90 dark:hover:bg-black/90 shadow-sm"
          >
            <MenuIcon isOpen={isMenuOpen} />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-80 p-0 bg-gradient-to-b from-white via-white to-gray-50 dark:from-black dark:via-black/95 dark:to-black/90 backdrop-blur-xl border-r border-black/5 dark:border-white/10"
        >
          <div className="h-full flex flex-col">
            <motion.div
              className="flex-1 pt-16 pb-6 overflow-y-auto scrollbar-none"
              initial="hidden"
              animate={isMenuOpen ? "visible" : "hidden"}
              variants={menuContainerVariants}
            >
              <MenuCategory title="Navigation">
                <NavLink href="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
                <NavLink href="/sessions" icon={Clock}>Sessions</NavLink>
                <NavLink href="/notes" icon={ClipboardList}>Notes</NavLink>
                <NavLink href="/glossary" icon={BookOpen}>Glossary</NavLink>
              </MenuCategory>

              <Separator className="my-6 bg-black/5 dark:bg-white/10" />

              <MenuCategory title="Preferences">
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="group flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all touch-manipulation"
                >
                  <div className="flex items-center gap-3">
                    {isDarkMode ? 
                      <Moon className="h-4 w-4 group-hover:scale-110 transition-transform" /> : 
                      <Sun className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    }
                    <span className="text-sm">
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
                  <span className="text-sm">Settings</span>
                </button>
              </MenuCategory>

              {user && (
                <div className="px-2 mt-6">
                  <button
                    onClick={handleSignOut}
                    className="group flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all touch-manipulation"
                  >
                    <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              )}
            </motion.div>

            <div className="p-6 border-t border-black/5 dark:border-white/10">
              <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                Mind Mechanism v1.0.0
              </div>
            </div>
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