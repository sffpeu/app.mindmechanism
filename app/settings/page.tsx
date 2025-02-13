'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { User, Bell, Moon, Sun, Laptop, Shield, Mail, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { doc, setDoc, Firestore } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export default function SettingsPage() {
  const { user, profile: contextProfile, refreshProfile } = useAuth()
  const { theme, setTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({
    username: '',
    bio: '',
    birthdate: '',
    avatarUrl: '',
    preferences: {
      emailNotifications: true,
      allowLocationData: false,
    },
    security: {
      sessionTimeout: 30,
    },
  })

  useEffect(() => {
    if (contextProfile) {
      setProfile(contextProfile)
    }
  }, [contextProfile])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !user?.uid) return

    const file = event.target.files[0]
    const storage = getStorage()
    const storageRef = ref(storage, `profile_pictures/${user.uid}`)

    try {
      setLoading(true)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)
      
      setProfile(prev => ({
        ...prev,
        avatarUrl: downloadURL
      }))

      if (db) {
        await setDoc(
          doc(db as Firestore, 'user_profiles', user.uid),
          { avatarUrl: downloadURL },
          { merge: true }
        )
      }

      toast.success('Profile picture updated successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload profile picture')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user?.uid || !db) {
      toast.error('Unable to save: Firebase not initialized')
      return
    }

    setLoading(true)
    try {
      const updatedProfile = {
        ...profile,
        updatedAt: new Date(),
        userId: user.uid,
        email: user.email,
        lastUpdated: new Date(),
      }

      await setDoc(doc(db as Firestore, 'user_profiles', user.uid), updatedProfile, { merge: true })
      await refreshProfile()
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      {/* Personal Information Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </h2>
          <Separator className="my-4" />
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-gray-800">
                  {profile.avatarUrl ? (
                    <Image
                      src={profile.avatarUrl}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 p-1 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90"
                >
                  <ImageIcon className="h-4 w-4" />
                  <input
                    id="avatar-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
              <div className="flex-1 space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profile.username}
                    onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Login & Security Section */}
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Login & Security
          </h2>
          <Separator className="my-4" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <div className="text-sm text-muted-foreground">Receive email notifications about your account</div>
              </div>
              <Switch
                checked={profile.preferences.emailNotifications}
                onCheckedChange={(checked) => 
                  setProfile(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, emailNotifications: checked }
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Location Data</Label>
                <div className="text-sm text-muted-foreground">Allow location data collection for better service</div>
              </div>
              <Switch
                checked={profile.preferences.allowLocationData}
                onCheckedChange={(checked) => 
                  setProfile(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, allowLocationData: checked }
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* Theme Preferences Section */}
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Theme Preferences
          </h2>
          <Separator className="my-4" />
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Appearance</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Laptop className="h-4 w-4" />
                      System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6">
          <Button
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
} 