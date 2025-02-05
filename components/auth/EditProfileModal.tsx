'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, collection, query, where, getDocs, Firestore } from 'firebase/firestore'
import { toast } from 'sonner'

interface UserProfile {
  username: string;
  preferences: {
    emailNotifications: boolean;
    publicProfile: boolean;
    shareProgress: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
  };
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [profile, setProfile] = useState<UserProfile>({
    username: '',
    preferences: {
      emailNotifications: true,
      publicProfile: false,
      shareProgress: true,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
    },
  })

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uid || !db) {
        console.error('User or Firestore not initialized')
        return
      }

      try {
        const docRef = doc(db as Firestore, 'user_profiles', user.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile
          setProfile(data)
          setUsername(data.username)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        toast.error('Failed to load profile data')
      }
    }

    loadProfile()
  }, [user?.uid])

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

  const handleSave = async () => {
    if (!user?.uid || !db) {
      toast.error('Unable to save: Firebase not initialized')
      return
    }
    if (usernameError) return

    setLoading(true)
    try {
      // Final username availability check before saving
      const isAvailable = await checkUsernameAvailability(username)
      if (!isAvailable) {
        setUsernameError('Username is no longer available')
        return
      }

      const updatedProfile = {
        username,
        preferences: {
          emailNotifications: profile.preferences.emailNotifications,
          publicProfile: profile.preferences.publicProfile,
          shareProgress: profile.preferences.shareProgress,
        },
        security: {
          twoFactorAuth: profile.security.twoFactorAuth,
          sessionTimeout: profile.security.sessionTimeout,
        },
        updatedAt: new Date(),
        userId: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
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
      const batch = db.batch()
      
      sessionsSnapshot.forEach((doc) => {
        batch.update(doc.ref, {
          user_profile: {
            username: username,
            preferences: updatedProfile.preferences
          }
        })
      })
      
      await batch.commit()

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
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-black/90 border border-gray-200 dark:border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">Edit Profile</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="Enter username"
              />
              {usernameError && (
                <p className="text-sm text-red-500">{usernameError}</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive email updates about your meditation progress
                  </p>
                </div>
                <Switch
                  checked={profile.preferences.emailNotifications}
                  onCheckedChange={(checked) =>
                    setProfile({
                      ...profile,
                      preferences: { ...profile.preferences, emailNotifications: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Public Profile</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Make your profile visible to other users
                  </p>
                </div>
                <Switch
                  checked={profile.preferences.publicProfile}
                  onCheckedChange={(checked) =>
                    setProfile({
                      ...profile,
                      preferences: { ...profile.preferences, publicProfile: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Share Progress</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Share your meditation progress with the community
                  </p>
                </div>
                <Switch
                  checked={profile.preferences.shareProgress}
                  onCheckedChange={(checked) =>
                    setProfile({
                      ...profile,
                      preferences: { ...profile.preferences, shareProgress: checked }
                    })
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch
                  checked={profile.security.twoFactorAuth}
                  onCheckedChange={(checked) =>
                    setProfile({
                      ...profile,
                      security: { ...profile.security, twoFactorAuth: checked }
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Session Timeout (minutes)</Label>
                <Input
                  type="number"
                  min="5"
                  max="120"
                  value={profile.security.sessionTimeout}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      security: { ...profile.security, sessionTimeout: parseInt(e.target.value) || 30 }
                    })
                  }
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !!usernameError}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 