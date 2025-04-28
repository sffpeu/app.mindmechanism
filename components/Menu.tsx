'use client'

import { useState } from 'react'
import { Menu as MenuIcon, X, Settings, Sun, Moon, BookOpen, ClipboardList, LogOut, LayoutDashboard, Clock, Home, Volume2, VolumeX } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useTheme } from '@/app/ThemeContext'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { SettingsDialog } from './settings/SettingsDialog'
import { Sheet, SheetContent, SheetTrigger, SheetWrapper } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useSettings } from '@/lib/hooks/useSettings'
import { useMenu } from '@/app/MenuContext'

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
    x: -100,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  visible: { 
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  }
}

const MenuCategory = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="px-2 mb-4">
    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 mb-2.5">{title}</h3>
    <div className="space-y-1.5">
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

const AnimatedMenuIcon = ({ isOpen }: { isOpen: boolean }) => {
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const isClockPage = pathname?.includes('/clock/')
  const { isDarkMode, setIsDarkMode } = useTheme()
  const { soundEnabled, setSoundEnabled } = useSettings()
  const { user, signOut } = useAuth()
  const { isMenuOpen, setIsMenuOpen } = useMenu()

  const handleSignOut = async () => {
    await signOut()
  }

  const NavLink = ({ href, icon: Icon, children, className }: { href: string; icon: any; children: React.ReactNode; className?: string }) => {
    const isActive = pathname === href
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault()
      // Close the menu when navigating
      setIsMenuOpen(false)
      
      // Use router.replace instead of push to ensure full page navigation
      // This is especially important for clock pages which may have complex state
      if (pathname.match(/^\/\d+$/) && href.match(/^\/\d+$/)) {
        // For navigation between clock pages, use window.location for a full page refresh
        window.location.href = href;
      } else {
        // For other navigation, use the router
        router.replace(href);
      }
    }

    return (
      <Link
        href={href}
        onClick={handleClick}
        className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 
          hover:bg-black/5 dark:hover:bg-white/5
          hover:border-black/5 dark:hover:border-white/5 border border-transparent
          transition-all touch-manipulation relative ${
          isActive ? 'bg-black/[0.04] dark:bg-white/[0.04] text-black dark:text-white font-medium border-black/5 dark:border-white/5 shadow-sm' : ''
        } ${className || ''}`}
      >
        <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'} group-hover:scale-105 transition-transform`} />
        <span className="text-sm">{children}</span>
        {isActive && (
          <div className="absolute left-0 w-1 h-6 bg-gradient-to-b from-black to-gray-700 dark:from-white dark:to-white/70 rounded-full my-auto top-0 bottom-0" />
        )}
      </Link>
    )
  }

  const PrefButton = ({ 
    icon: Icon, 
    activeIcon: ActiveIcon, 
    isActive, 
    onClick, 
    children 
  }: { 
    icon: any; 
    activeIcon?: any; 
    isActive: boolean; 
    onClick: () => void; 
    children: React.ReactNode 
  }) => {
    const IconToUse = isActive && ActiveIcon ? ActiveIcon : Icon;
    
    return (
      <button
        onClick={onClick}
        className="group flex items-center justify-between w-full px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all touch-manipulation"
      >
        <div className="flex items-center gap-3">
          <IconToUse className={`h-4.5 w-4.5 ${isActive ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'} group-hover:scale-110 transition-transform`} />
          <span className="text-sm">{children}</span>
        </div>
        <Switch
          checked={isActive}
          onCheckedChange={onClick}
          className="data-[state=checked]:bg-black dark:data-[state=checked]:bg-white data-[state=unchecked]:bg-black/20 dark:data-[state=unchecked]:bg-white/20 h-5 w-9"
        />
      </button>
    )
  }

  return (
    <>
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-[999] h-10 w-10 rounded-xl bg-white/90 dark:bg-black/90 backdrop-blur-sm border border-black/5 dark:border-white/10 hover:bg-white dark:hover:bg-black/95 shadow-sm pointer-events-auto"
          >
            <AnimatedMenuIcon isOpen={isMenuOpen} />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-80 p-0 bg-gradient-to-b from-white via-white to-gray-50/95 dark:from-black dark:via-black/98 dark:to-black/95 backdrop-blur-xl border-r border-black/5 dark:border-white/10 [&>button[type='button']]:hidden z-[999] pointer-events-auto rounded-r-3xl"
        >
          <div className="h-full flex flex-col">
            <motion.div
              className="flex-1 pt-20 pb-6 overflow-y-auto scrollbar-none px-3"
              initial="hidden"
              animate={isMenuOpen ? "visible" : "hidden"}
              variants={menuContainerVariants}
            >
              <MenuCategory title="Navigation">
                <NavLink href="/home" icon={Home} className="sidebar-item">Home</NavLink>
                <NavLink href="/dashboard" icon={LayoutDashboard} className="sidebar-item">Dashboard</NavLink>
                <NavLink href="/sessions" icon={Clock} className="sidebar-item">Sessions</NavLink>
                <NavLink href="/notes" icon={ClipboardList} className="sidebar-item">Notes</NavLink>
                <NavLink href="/glossary" icon={BookOpen} className="sidebar-item">Glossary</NavLink>
              </MenuCategory>

              <Separator className="my-5 bg-black/5 dark:bg-white/10" />

              <MenuCategory title="Preferences">
                <PrefButton 
                  icon={Moon} 
                  activeIcon={Sun} 
                  isActive={isDarkMode} 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                >
                  {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                </PrefButton>

                <PrefButton 
                  icon={VolumeX} 
                  activeIcon={Volume2} 
                  isActive={soundEnabled} 
                  onClick={() => setSoundEnabled(!soundEnabled)}
                >
                  {soundEnabled ? 'Sound On' : 'Sound Off'}
                </PrefButton>

                <button
                  onClick={() => {
                    setIsMenuOpen(false)
                    setIsSettingsOpen(true)
                  }}
                  className="group flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all touch-manipulation"
                >
                  <Settings className="h-4.5 w-4.5 text-gray-500 dark:text-gray-400 group-hover:scale-110 transition-transform" />
                  <span className="text-sm">Settings</span>
                </button>
              </MenuCategory>

              {user && (
                <div className="px-2 mt-4">
                  <button
                    onClick={handleSignOut}
                    className="group flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-red-50/70 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all touch-manipulation"
                  >
                    <LogOut className="h-4.5 w-4.5 text-gray-500 dark:text-gray-400 group-hover:scale-110 transition-transform" />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              )}
            </motion.div>

            <div className="p-5 border-t border-black/5 dark:border-white/10">
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