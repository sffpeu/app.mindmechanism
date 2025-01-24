'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Lock, Mail, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Menu } from '@/components/Menu'
import DotNavigation from '@/components/DotNavigation'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ProfileData {
  name: string
  birthday: string
  country: string
  timezone: string
  theme: 'light' | 'dark' | 'auto'
  last_login?: string
}

export default function ProfilePage() {
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
  const { data: session, status, update: updateSession } = useSession()
  const [showElements, setShowElements] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showSatellites, setShowSatellites] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfileData()
    }
  }, [session?.user?.id])

  useEffect(() => {
    // Check system preference and localStorage for dark mode
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const storedTheme = localStorage.getItem('theme')
    setIsDarkMode(storedTheme === 'dark' || (!storedTheme && darkModeMediaQuery.matches))

    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e.matches)
      }
    }

    darkModeMediaQuery.addEventListener('change', handleChange)
    return () => darkModeMediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
    if (isDarkMode) {
      localStorage.setItem('theme', 'dark')
    } else {
      localStorage.setItem('theme', 'light')
    }
  }, [isDarkMode])

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

  if (status === 'loading' || status === 'unauthenticated') {
    return null
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="dark:bg-black dark:text-white">
        {/* Logo */}
        <Link href="/" className="absolute top-4 left-4 z-10 font-bold text-4xl">
          M
        </Link>

        {/* Menu */}
        <Menu
          showElements={showElements}
          onToggleShow={() => setShowElements(!showElements)}
          showSatellites={showSatellites}
          onSatellitesChange={setShowSatellites}
          isDarkMode={isDarkMode}
          onDarkModeChange={setIsDarkMode}
        />

        {/* DotNavigation */}
        <DotNavigation activeDot={-1} />

        {/* Main Content */}
        <div className="container max-w-xl mx-auto px-4 py-16">
          <div className="flex flex-col items-start space-y-8">
            <div className="w-full flex items-center justify-between">
              <h1 className="text-3xl font-bold">Profile</h1>
              {hasUnsavedChanges && (
                <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  Unsaved changes
                </span>
              )}
            </div>

            <Card className="w-full">
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      placeholder="Your name"
                      className="bg-white/50 dark:bg-black/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={session?.user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthday">Birthday</Label>
                    <Input
                      id="birthday"
                      type="date"
                      value={profileData.birthday}
                      onChange={(e) => setProfileData({ ...profileData, birthday: e.target.value })}
                      className="bg-white/50 dark:bg-black/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={profileData.country}
                      onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                      placeholder="Your country"
                      className="bg-white/50 dark:bg-black/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={profileData.timezone} 
                      onValueChange={(value) => setProfileData({ ...profileData, timezone: value })}
                    >
                      <SelectTrigger className="bg-white/50 dark:bg-black/50">
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

                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {['light', 'dark', 'auto'].map((theme) => (
                        <button
                          key={theme}
                          onClick={() => setProfileData({ ...profileData, theme: theme as 'light' | 'dark' | 'auto' })}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            profileData.theme === theme
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary hover:bg-secondary/80'
                          }`}
                        >
                          {theme.charAt(0).toUpperCase() + theme.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => router.push('/auth/change-password')}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                      <Lock className="h-4 w-4" />
                      Change Password
                    </button>

                    <button
                      onClick={() => router.push('/auth/change-email')}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                      Change Email
                    </button>
                  </div>

                  <button
                    onClick={handleDeleteAccount}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 border border-destructive/20 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </button>
                </div>
              </CardContent>
            </Card>

            <div className="w-full flex justify-end gap-4">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading || !hasUnsavedChanges}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isLoading || !hasUnsavedChanges
                    ? 'bg-primary/50 cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 