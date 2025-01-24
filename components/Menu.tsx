'use client'

import { useState, useEffect } from 'react'
import { Menu as MenuIcon, X, Settings, Eye, EyeOff, LogIn, Sun, Moon, User, Trash2, Lock, Mail } from 'lucide-react'
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
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    theme: 'auto'
  })
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [initialProfileData, setInitialProfileData] = useState<ProfileData>({
    name: '',
    birthday: '',
    country: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    theme: 'auto'
  })
  const router = useRouter()
  const { data: session, update: updateSession } = useSession()

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfileData()
    }
  }, [session?.user?.id])

  const fetchProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user?.id)
        .single()

      if (error) throw error

      const newProfileData = {
        name: data?.name || '',
        birthday: data?.birthday || '',
        country: data?.country || '',
        timezone: data?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
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

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsProfileOpen(true)
    setIsMenuOpen(false)
  }

  const handleCloseDialog = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        setProfileData(initialProfileData) // Reset to initial data
        setIsProfileOpen(false)
      }
    } else {
      setIsProfileOpen(false)
    }
  }

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
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
      setInitialProfileData(profileData) // Update initial data after successful save
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
                  <button
                    onClick={handleProfileClick}
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

                  <div className="h-px bg-black/10 dark:bg-white/10 mx-2" />

                  {onSettingsClick && (
                    <button
                      onClick={() => {
                        onSettingsClick();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-800 dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                  )}

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
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Dialog 
            open={isProfileOpen} 
            onOpenChange={(open) => {
              if (!open) {
                handleCloseDialog()
              }
            }}
          >
            <DialogContent 
              className="sm:max-w-[500px] bg-white/95 dark:bg-black/95 backdrop-blur-xl text-black dark:text-white border border-black/10 dark:border-white/10 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold flex items-center justify-between">
                  Profile Settings
                  {hasUnsavedChanges && (
                    <span className="text-sm font-normal text-yellow-600 dark:text-yellow-400">
                      Unsaved changes
                    </span>
                  )}
                </DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="w-full grid grid-cols-3 gap-1 p-1 mb-6 bg-black/5 dark:bg-white/5 rounded-lg">
                  <TabsTrigger 
                    value="general"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-black dark:data-[state=active]:text-white rounded-md transition-all"
                  >
                    General
                  </TabsTrigger>
                  <TabsTrigger 
                    value="security"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-black dark:data-[state=active]:text-white rounded-md transition-all"
                  >
                    Security
                  </TabsTrigger>
                  <TabsTrigger 
                    value="appearance"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-black data-[state=active]:text-black dark:data-[state=active]:text-white rounded-md transition-all"
                  >
                    Appearance
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                      <input
                        type="text"
                        value={profileData.name || session?.user?.name || ''}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-black/50 border border-black/10 dark:border-white/10 focus:border-black dark:focus:border-white outline-none transition-colors"
                        placeholder="Your name"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Birthday</label>
                      <input
                        type="date"
                        value={profileData.birthday}
                        onChange={(e) => setProfileData({ ...profileData, birthday: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-black/50 border border-black/10 dark:border-white/10 focus:border-black dark:focus:border-white outline-none transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
                      <input
                        type="text"
                        value={profileData.country}
                        onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-black/50 border border-black/10 dark:border-white/10 focus:border-black dark:focus:border-white outline-none transition-colors"
                        placeholder="Your country"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Timezone</label>
                      <select
                        value={profileData.timezone}
                        onChange={(e) => setProfileData({ ...profileData, timezone: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white/50 dark:bg-black/50 border border-black/10 dark:border-white/10 focus:border-black dark:focus:border-white outline-none transition-colors"
                      >
                        {Intl.supportedValuesOf('timeZone').map((tz) => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                      <input
                        type="email"
                        value={session?.user?.email || ''}
                        disabled
                        className="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10"
                      />
                    </div>

                    {profileData.last_login && (
                      <div className="px-3 py-2 rounded-lg bg-black/5 dark:bg-white/5 text-sm text-gray-600 dark:text-gray-400">
                        Last login: {new Date(profileData.last_login).toLocaleString()}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => router.push('/auth/change-password')}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-black border border-black/10 dark:border-white/10 transition-colors"
                      >
                        <Lock className="h-4 w-4" />
                        Change Password
                      </button>

                      <button
                        onClick={() => router.push('/auth/change-email')}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-black border border-black/10 dark:border-white/10 transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                        Change Email
                      </button>
                    </div>

                    <button
                      onClick={handleDeleteAccount}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 border border-red-200 dark:border-red-800 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </button>
                  </div>
                </TabsContent>

                <TabsContent value="appearance" className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['light', 'dark', 'auto'].map((theme) => (
                        <button
                          key={theme}
                          onClick={() => setProfileData({ ...profileData, theme: theme as 'light' | 'dark' | 'auto' })}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            profileData.theme === theme
                              ? 'bg-white dark:bg-black border-black dark:border-white text-black dark:text-white'
                              : 'bg-white/50 dark:bg-black/50 border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white'
                          }`}
                        >
                          {theme.charAt(0).toUpperCase() + theme.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={handleCloseDialog}
                  className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading || !hasUnsavedChanges}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </DialogContent>
          </Dialog>
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