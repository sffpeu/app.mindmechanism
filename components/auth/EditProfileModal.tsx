'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, collection, query, where, getDocs, Firestore, writeBatch } from 'firebase/firestore'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'
import { User, Bell, Globe, Shield, Clock, Mail, Link, MapPin, Calendar, Image as ImageIcon } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import Image from 'next/image'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

interface UserProfile {
  username: string;
  bio: string;
  birthdate: string;
  avatarUrl: string;
  preferences: {
    emailNotifications: boolean;
    allowLocationData: boolean;
  };
  security: {
    sessionTimeout: number;
  };
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, profile: contextProfile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [profile, setProfile] = useState<UserProfile>({
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

  // Load profile data from context when modal opens
  useEffect(() => {
    if (contextProfile) {
      setProfile(contextProfile)
      setUsername(contextProfile.username)
    }
  }, [contextProfile])

  const checkUsernameAvailability = async (username: string) => {
    if (!username || !db) return false

    try {
      const q = query(
        collection(db as Firestore, 'user_profiles'),
        where('username', '==', username)
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.empty || (querySnapshot.size === 1 && querySnapshot.docs[0].id === user?.uid)
    } catch (error) {
      console.error('Error checking username:', error)
      return false
    }
  }

  const generateUniqueUsername = async (baseUsername: string) => {
    let counter = 1
    let uniqueUsername = baseUsername

    while (!(await checkUsernameAvailability(uniqueUsername))) {
      uniqueUsername = `${baseUsername}${counter}`
      counter++
    }

    return uniqueUsername
  }

  const handleUsernameChange = async (value: string) => {
    setUsername(value)
    setUsernameError('')

    if (!value) {
      setUsernameError('Username is required')
      return
    }

    // Basic validation
    if (value.length < 3) {
      setUsernameError('Username must be at least 3 characters long')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError('Username can only contain letters, numbers, and underscores')
      return
    }

    // Check availability
    const isAvailable = await checkUsernameAvailability(value)
    if (!isAvailable) {
      const suggestion = await generateUniqueUsername(value)
      setUsernameError(`Username taken. Try: ${suggestion}`)
    }
  }

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

      // Update the profile in Firestore with new avatar URL
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
    if (usernameError) return

    setLoading(true)
    try {
      const isAvailable = await checkUsernameAvailability(username)
      if (!isAvailable) {
        setUsernameError('Username is no longer available')
        return
      }

      const updatedProfile = {
        username,
        bio: profile.bio,
        birthdate: profile.birthdate,
        avatarUrl: profile.avatarUrl || user?.photoURL || '',
        preferences: {
          emailNotifications: profile.preferences.emailNotifications,
          allowLocationData: profile.preferences.allowLocationData,
        },
        security: {
          sessionTimeout: profile.security.sessionTimeout,
        },
        updatedAt: new Date(),
        userId: user.uid,
        email: user.email,
        lastUpdated: new Date(),
      }

      // Update the profile in Firestore
      await setDoc(doc(db as Firestore, 'user_profiles', user.uid), updatedProfile, { merge: true })

      // Update any references to this profile in active sessions
      const sessionsQuery = query(
        collection(db as Firestore, 'sessions'),
        where('user_id', '==', user.uid),
        where('status', '==', 'in_progress')
      )
      
      const sessionsSnapshot = await getDocs(sessionsQuery)
      const batch = writeBatch(db as Firestore)
      
      sessionsSnapshot.forEach((doc) => {
        batch.update(doc.ref, {
          user_profile: {
            username: username,
            preferences: updatedProfile.preferences,
            avatarUrl: updatedProfile.avatarUrl,
          }
        })
      })
      
      await batch.commit()

      // Refresh the profile in the context
      await refreshProfile()

      toast.success('Profile updated successfully')
      onClose()
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to save profile: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-0 bg-white dark:bg-black border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="grid grid-cols-[280px,1fr]">
          {/* Left Panel - Profile Picture and Basic Info */}
          <div className="border-r border-gray-200 dark:border-white/10 p-6 space-y-6 bg-gray-50 dark:bg-black/40">
            <DialogHeader className="text-left p-0">
              <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <User className="h-5 w-5" />
                Edit Profile
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800/50 border-2 border-white dark:border-gray-800">
                  {profile.avatarUrl ? (
                    <Image
                      src={profile.avatarUrl}
                      alt="Profile"
                      width={128}
                      height={128}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                    </div>
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <ImageIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="w-full space-y-4">
                <div>
                  <Label htmlFor="username" className="text-gray-900 dark:text-gray-100">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    className="bg-white dark:bg-black/60 border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100"
                  />
                  {usernameError && (
                    <p className="mt-1 text-sm text-red-500 dark:text-red-400">{usernameError}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="bio" className="text-gray-900 dark:text-gray-100">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    className="h-20 bg-white dark:bg-black/60 border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Settings */}
          <div className="p-6 space-y-6 overflow-y-auto">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gray-900 dark:text-gray-100">Email Notifications</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive email updates about your activity</p>
                  </div>
                  <Switch
                    checked={profile.preferences.emailNotifications}
                    onCheckedChange={(checked) => setProfile(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, emailNotifications: checked }
                    }))}
                    className="data-[state=checked]:bg-black dark:data-[state=checked]:bg-white"
                  />
                </div>
              </div>
            </div>

            <Separator className="border-gray-200 dark:border-white/10" />

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Location
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gray-900 dark:text-gray-100">Location Data</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Allow access to your location data</p>
                  </div>
                  <Switch
                    checked={profile.preferences.allowLocationData}
                    onCheckedChange={(checked) => setProfile(prev => ({
                      ...prev,
                      preferences: { ...prev.preferences, allowLocationData: checked }
                    }))}
                    className="data-[state=checked]:bg-black dark:data-[state=checked]:bg-white"
                  />
                </div>
              </div>
            </div>

            <Separator className="border-gray-200 dark:border-white/10" />

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="session-timeout" className="text-gray-900 dark:text-gray-100">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={profile.security.sessionTimeout}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      security: { ...prev.security, sessionTimeout: parseInt(e.target.value) || 30 }
                    }))}
                    min="1"
                    className="bg-white dark:bg-black/60 border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 p-6 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/40">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-900 dark:text-gray-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !!usernameError}
            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 