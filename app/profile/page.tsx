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
import Image from 'next/image'

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
  const [showElements, setShowElements] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showSatellites, setShowSatellites] = useState(false)

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

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="dark:bg-black dark:text-white">
        {/* Logo */}
        <Link href="/" className="absolute top-4 left-4 z-10">
          <Image
            src="/logo.png"
            alt="MindMechanism Logo"
            width={40}
            height={40}
            className="rounded-xl"
          />
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
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">Profile Settings</h1>
            {hasUnsavedChanges && (
              <span className="text-sm font-normal text-yellow-600 dark:text-yellow-400">
                Unsaved changes
              </span>
            )}
          </div>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 mb-8">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={profileData.name || session?.user?.name || ''}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthday">Birthday</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={profileData.birthday}
                    onChange={(e) => setProfileData({ ...profileData, birthday: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={profileData.country}
                    onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                    placeholder="Your country"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={profileData.timezone} 
                    onValueChange={(value) => setProfileData({ ...profileData, timezone: value })}
                  >
                    <SelectTrigger>
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
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={session?.user?.email || ''}
                        disabled
                        className="bg-muted"
                      />
                    </div>

                    {profileData.last_login && (
                      <div className="text-sm text-muted-foreground">
                        Last login: {new Date(profileData.last_login).toLocaleString()}
                      </div>
                    )}

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
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <Label>Theme</Label>
                    <div className="grid grid-cols-3 gap-4">
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4 mt-8">
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
  )
} 