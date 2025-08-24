'use client'

import { useState } from 'react'
import { Menu as MenuIcon, X, Settings, Sun, Moon, BookOpen, ClipboardList, LogOut, LayoutDashboard, Clock, Home, Volume2, VolumeX, ExternalLink } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useTheme } from '@/app/ThemeContext'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { SettingsDialog } from './settings/SettingsDialog'
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

const MenuItem = ({ 
  href, 
  icon: Icon, 
  children, 
  isActive = false,
  onClick,
  external = false 
}: { 
  href?: string; 
  icon: any; 
  children: React.ReactNode; 
  isActive?: boolean;
  onClick?: () => void;
  external?: boolean;
}) => {
  const className = `group flex items-center justify-between w-full px-4 py-3 text-left transition-all duration-200 ${
    isActive 
      ? 'bg-black text-white dark:bg-white dark:text-black' 
      : 'text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'
  }`

  if (href) {
    return (
      <Link
        href={href}
        className={className}
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          <Icon className={`h-4 w-4 ${isActive ? 'text-current' : 'text-black dark:text-white'} group-hover:text-current transition-colors`} />
          <span className="text-sm font-medium">{children}</span>
        </div>
        {external && <ExternalLink className="h-3 w-3 opacity-60" />}
      </Link>
    )
  }

  return (
    <button
      onClick={onClick}
      type="button"
      className={className}
    >
      <div className="flex items-center gap-3">
        <Icon className={`h-4 w-4 ${isActive ? 'text-current' : 'text-black dark:text-white'} group-hover:text-current transition-colors`} />
        <span className="text-sm font-medium">{children}</span>
      </div>
      {external && <ExternalLink className="h-3 w-3 opacity-60" />}
    </button>
  )
}

const MenuSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="border-b border-black/10 dark:border-white/10">
    <div className="px-4 py-2">
      <h3 className="text-xs font-bold text-black/60 dark:text-white/60 uppercase tracking-widest">
        {title}
      </h3>
    </div>
    {children}
  </div>
)

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
  const { isDarkMode, setIsDarkMode } = useTheme()
  const { soundEnabled, setSoundEnabled } = useSettings()
  const { user, signOut } = useAuth()
  const { isMenuOpen, setIsMenuOpen } = useMenu()

  const handleSignOut = async () => {
    await signOut()
    setIsMenuOpen(false)
  }

  const handleNavigation = (href: string) => {
    setIsMenuOpen(false)
    // Use setTimeout to ensure menu closes before navigation
    setTimeout(() => {
      router.push(href)
    }, 100)
  }

  const isActive = (href: string) => pathname === href

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="fixed top-6 right-6 z-[999] w-12 h-12 bg-white dark:bg-black border border-black dark:border-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center rounded-full"
      >
        <MenuIcon className="h-6 w-6 text-black dark:text-white" />
      </button>

      {/* Mega Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 dark:bg-black/60 z-[998]"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mega Menu Content */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 40 
            }}
            className="fixed top-0 left-0 right-0 z-[999] bg-white dark:bg-black border-b border-black dark:border-white shadow-lg"
          >
            <div className="max-w-3xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/10">
                <h1 className="text-xl font-bold text-black dark:text-white">
                  1M3 Mindmechanism
                </h1>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-10 h-10 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center hover:bg-black/80 dark:hover:bg-white/80 transition-colors rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Menu Content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                {/* Navigation */}
                <MenuSection title="Navigation">
                  <MenuItem 
                    href="/home" 
                    icon={Home} 
                    isActive={isActive('/home')}
                    onClick={() => handleNavigation('/home')}
                  >
                    Home
                  </MenuItem>
                  <MenuItem 
                    href="/dashboard" 
                    icon={LayoutDashboard} 
                    isActive={isActive('/dashboard')}
                    onClick={() => handleNavigation('/dashboard')}
                  >
                    Dashboard
                  </MenuItem>
                  <MenuItem 
                    href="/sessions" 
                    icon={Clock} 
                    isActive={isActive('/sessions')}
                    onClick={() => handleNavigation('/sessions')}
                  >
                    Sessions
                  </MenuItem>
                  <MenuItem 
                    href="/notes" 
                    icon={ClipboardList} 
                    isActive={isActive('/notes')}
                    onClick={() => handleNavigation('/notes')}
                  >
                    Notes
                  </MenuItem>
                  <MenuItem 
                    href="/glossary" 
                    icon={BookOpen} 
                    isActive={isActive('/glossary')}
                    onClick={() => handleNavigation('/glossary')}
                  >
                    Glossary
                  </MenuItem>
                </MenuSection>

                {/* Settings */}
                <MenuSection title="Settings">
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        <span className="text-sm font-medium text-black dark:text-white">
                          {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                        </span>
                      </div>
                      <Switch
                        checked={isDarkMode}
                        onCheckedChange={setIsDarkMode}
                        className="data-[state=checked]:bg-black dark:data-[state=checked]:bg-white"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                        <span className="text-sm font-medium text-black dark:text-white">
                          Sound
                        </span>
                      </div>
                      <Switch
                        checked={soundEnabled}
                        onCheckedChange={setSoundEnabled}
                        className="data-[state=checked]:bg-black dark:data-[state=checked]:bg-white"
                      />
                    </div>

                    <button
                      onClick={() => {
                        setIsMenuOpen(false)
                        setIsSettingsOpen(true)
                      }}
                      className="flex items-center gap-3 w-full text-left hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-200 px-0 py-2"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="text-sm font-medium">Advanced Settings</span>
                    </button>
                  </div>
                </MenuSection>

                {/* Account & Legal */}
                <MenuSection title="Account & Legal">
                  {user ? (
                    <MenuItem 
                      icon={LogOut} 
                      onClick={handleSignOut}
                    >
                      Sign Out
                    </MenuItem>
                  ) : (
                    <MenuItem 
                      href="/auth/signin" 
                      icon={LogOut} 
                      isActive={isActive('/auth/signin')}
                      onClick={() => handleNavigation('/auth/signin')}
                    >
                      Sign In
                    </MenuItem>
                  )}
                  
                  <div className="px-4 py-3 space-y-2">
                    <Link 
                      href="/privacy" 
                      className="block text-xs text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
                    >
                      Privacy Policy
                    </Link>
                    <Link 
                      href="/terms" 
                      className="block text-xs text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
                    >
                      Terms & Conditions
                    </Link>
                    <Link 
                      href="/impressum" 
                      className="block text-xs text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
                    >
                      Impressum
                    </Link>
                  </div>
                </MenuSection>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-black/10 dark:border-white/10">
                <div className="text-center">
                  <p className="text-xs font-medium text-black dark:text-white mb-1">
                    Mindmechanism 2025
                  </p>
                  <p className="text-xs text-black/60 dark:text-white/60">
                    All rights reserved
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SettingsDialog 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  )
} 