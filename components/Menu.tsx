'use client'

import { useState, useEffect } from 'react'
import { Menu as MenuIcon, X, Settings, Eye, EyeOff, LogIn, Sun, Moon, User, Trash2, Lock, Mail, Calendar, Globe, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession, signOut } from 'next-auth/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import Link from 'next/link'
import ProfilePopover from '@/app/profile/page'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface MenuProps {
  showElements: boolean
  onToggleShow: () => void
  onSettingsClick?: () => void
  showSatellites: boolean
  onSatellitesChange: (checked: boolean) => void
  isDarkMode: boolean
  onDarkModeChange: (checked: boolean) => void
}

interface ProfileData {
  name: string
  birthday: string
  country: string
  timezone: string
  theme: 'light' | 'dark' | 'auto'
  last_login?: string
}

export function Menu({
  showElements,
  onToggleShow,
  onSettingsClick,
  showSatellites,
  onSatellitesChange,
  isDarkMode,
  onDarkModeChange
}: MenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    birthday: '',
    country: '',
    timezone: 'Europe/Berlin',
    theme: 'auto'
  })
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [initialProfileData, setInitialProfileData] = useState<ProfileData>({
    name: '',
    birthday: '',
    country: '',
    timezone: 'Europe/Berlin',
    theme: 'auto'
  })
  const router = useRouter()
  const { data: session, update: updateSession } = useSession()

  useEffect(() => {
    if (session?.user?.id && isProfileOpen) {
      fetchProfileData()
    }
  }, [session?.user?.id, isProfileOpen])

  const fetchProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user?.id)
        .single()

      if (error) throw error

      const newProfileData = {
        name: data?.name || session?.user?.name || '',
        birthday: data?.birthday || '',
        country: data?.country || '',
        timezone: data?.timezone || 'Europe/Berlin',
        theme: data?.theme || 'auto',
        last_login: data?.last_login || undefined
      }

      setProfileData(newProfileData)
      setInitialProfileData(newProfileData)
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile data')
    }
  }

  useEffect(() => {
    const hasChanges = JSON.stringify(profileData) !== JSON.stringify(initialProfileData)
    setHasUnsavedChanges(hasChanges)
  }, [profileData, initialProfileData])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session?.user?.id,
          ...profileData,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      await updateSession()
      setInitialProfileData(profileData)
      toast.success('Profile updated successfully')
      setIsProfileOpen(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.admin.deleteUser(session?.user?.id!)
      if (error) throw error

      await signOut({ callbackUrl: '/' })
      toast.success('Account deleted successfully')
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {showElements && (
        <>
          <div className="absolute top-4 right-4 z-10">
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative w-9 h-9 rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-lg border border-black/10 dark:border-white/20 hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
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
                  <X className="h-4 w-4 text-black dark:text-white" />
                ) : (
                  <MenuIcon className="h-4 w-4 text-black dark:text-white" />
                )}
              </motion.div>
            </motion.button>
          </div>
          
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
                  {session ? (
                    <Popover open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                      <PopoverTrigger asChild>
                        <button className="w-full flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-800 dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <User className="h-4 w-4" />
                          Profile
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-96 p-6" align="end">
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Profile Settings</h2>
                            {hasUnsavedChanges && (
                              <span className="text-xs text-yellow-600 dark:text-yellow-400">
                                Unsaved changes
                              </span>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <Input
                                value={profileData.name}
                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                placeholder="Your name"
                                className="h-8"
                              />
                            </div>

                            <div className="flex items-center gap-3">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <Input
                                type="email"
                                value={session?.user?.email || ''}
                                disabled
                                className="h-8 bg-muted"
                              />
                            </div>

                            <div className="flex items-center gap-3">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <Input
                                type="date"
                                value={profileData.birthday}
                                onChange={(e) => setProfileData({ ...profileData, birthday: e.target.value })}
                                className="h-8"
                              />
                            </div>

                            <div className="flex items-center gap-3">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <Input
                                value={profileData.country}
                                onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                                placeholder="Your country"
                                className="h-8"
                              />
                            </div>

                            <div className="flex items-center gap-3">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <Select 
                                value={profileData.timezone} 
                                onValueChange={(value) => setProfileData({ ...profileData, timezone: value })}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Intl.supportedValuesOf('timeZone').map((tz) => (
                                    <SelectItem key={tz} value={tz}>
                                      {tz}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                              onClick={() => window.location.href = '/auth/change-password'}
                            >
                              <Lock className="h-4 w-4" />
                              Change Password
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                              onClick={() => window.location.href = '/auth/change-email'}
                            >
                              <Mail className="h-4 w-4" />
                              Change Email
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start gap-2 text-destructive hover:text-destructive/90"
                              onClick={handleDeleteAccount}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Account
                            </Button>
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSave}
                              disabled={isLoading || !hasUnsavedChanges}
                            >
                              {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <button
                      onClick={() => {
                        router.push('/auth/signin');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-800 dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </button>
                  )}

                  <div className="px-3 py-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800 dark:text-white flex items-center gap-2">
                      {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      Dark Mode
                    </span>
                    <div 
                      className="relative w-8 h-4 cursor-pointer"
                      onClick={() => onDarkModeChange(!isDarkMode)}
                    >
                      <motion.div
                        className="absolute inset-0 rounded-full border border-black/20 dark:border-white/20"
                        animate={{
                          backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(229, 231, 235, 1)'
                        }}
                      />
                      <motion.div
                        className="absolute w-3 h-3 rounded-full bg-white dark:bg-black border border-black/20 dark:border-white/20"
                        style={{ top: '2px', left: '2px' }}
                        animate={{
                          x: isDarkMode ? 16 : 0
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                      <input
                        type="checkbox"
                        checked={isDarkMode}
                        onChange={(e) => onDarkModeChange(e.target.checked)}
                        className="sr-only"
                      />
                    </div>
                  </div>

                  <div className="px-3 py-1.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800 dark:text-white">
                      Satellites
                    </span>
                    <div 
                      className="relative w-8 h-4 cursor-pointer"
                      onClick={() => onSatellitesChange(!showSatellites)}
                    >
                      <motion.div
                        className="absolute inset-0 rounded-full border border-black/20 dark:border-white/20"
                        animate={{
                          backgroundColor: showSatellites ? 'rgba(0, 0, 0, 0.9)' : 'rgba(229, 231, 235, 1)'
                        }}
                      />
                      <motion.div
                        className="absolute w-3 h-3 rounded-full bg-white dark:bg-black border border-black/20 dark:border-white/20"
                        style={{ top: '2px', left: '2px' }}
                        animate={{
                          x: showSatellites ? 16 : 0
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                      <input
                        type="checkbox"
                        checked={showSatellites}
                        onChange={(e) => onSatellitesChange(e.target.checked)}
                        className="sr-only"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
      <div 
        onClick={onToggleShow} 
        className="fixed bottom-4 right-4 cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors z-10"
      >
        {showElements ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
      </div>
    </>
  )
} 