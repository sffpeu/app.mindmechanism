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
                      <User className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-2 right-2 rounded-full w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <ImageIcon className="h-4 w-4" />
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="w-full space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="Enter username"
                    className={`${usernameError ? 'border-red-500' : ''} bg-white dark:bg-gray-800/50`}
                  />
                  {usernameError && (
                    <p className="text-xs text-red-500">{usernameError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Additional Info and Settings */}
          <div className="overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-medium text-gray-700 dark:text-gray-300">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell us about yourself"
                    className="h-20 resize-none bg-white dark:bg-gray-800/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthdate" className="text-sm font-medium text-gray-700 dark:text-gray-300">Birth Date</Label>
                  <Input
                    id="birthdate"
                    type="date"
                    value={profile.birthdate}
                    onChange={(e) => setProfile({ ...profile, birthdate: e.target.value })}
                    className="bg-white dark:bg-gray-800/50"
                  />
                </div>
              </div>

              <Separator className="bg-gray-200 dark:bg-gray-700" />

              {/* Settings Section */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Privacy & Permissions</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="locationData" className="text-sm text-gray-600 dark:text-gray-400">Location Access</Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Allow app to access your location for better experience</p>
                      </div>
                      <Switch
                        id="locationData"
                        checked={profile.preferences.allowLocationData}
                        onCheckedChange={(checked) => setProfile({
                          ...profile,
                          preferences: { ...profile.preferences, allowLocationData: checked }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="emailNotifications" className="text-sm text-gray-600 dark:text-gray-400">Email Notifications</Label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Receive email updates about your sessions</p>
                      </div>
                      <Switch
                        id="emailNotifications"
                        checked={profile.preferences.emailNotifications}
                        onCheckedChange={(checked) => setProfile({
                          ...profile,
                          preferences: { ...profile.preferences, emailNotifications: checked }
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Security</h3>
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout" className="text-sm text-gray-700 dark:text-gray-300">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={profile.security.sessionTimeout}
                      onChange={(e) => setProfile({
                        ...profile,
                        security: { ...profile.security, sessionTimeout: parseInt(e.target.value) || 30 }
                      })}
                      min="5"
                      max="120"
                      className="bg-white dark:bg-gray-800/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-black">
              <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={loading}
                className="bg-white dark:bg-black text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={loading || !!usernameError}
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 