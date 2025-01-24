'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { createClient } from '@supabase/supabase-js'
import { Lock, Mail, Trash2, User, Calendar, Globe, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

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

export default function ProfilePopover() {
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
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
  const { data: session, update: updateSession } = useSession()

  useEffect(() => {
    if (session?.user?.id && isOpen) {
      fetchProfileData()
    }
  }, [session?.user?.id, isOpen])

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
      setIsOpen(false)
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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <User className="h-5 w-5" />
        </Button>
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
              onClick={() => setIsOpen(false)}
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
  )
} 