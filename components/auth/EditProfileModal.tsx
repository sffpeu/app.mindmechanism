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

interface UserProfile {
  username: string;
  displayName: string;
  bio: string;
  location: string;
  website: string;
  birthdate: string;
  avatarUrl: string;
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
    displayName: '',
    bio: '',
    location: '',
    website: '',
    birthdate: '',
    avatarUrl: '',
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
        displayName: profile.displayName || user?.displayName || '',
        bio: profile.bio,
        location: profile.location,
        website: profile.website,
        birthdate: profile.birthdate,
        avatarUrl: profile.avatarUrl || user?.photoURL || '',
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Profile
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
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
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0"
                onClick={() => {/* TODO: Implement image upload */}}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Basic Info Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="Enter username"
                className={usernameError ? 'border-red-500' : ''}
              />
              {usernameError && (
                <p className="text-sm text-red-500">{usernameError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm font-medium">Display Name</Label>
              <Input
                id="displayName"
                value={profile.displayName}
                onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                placeholder="Enter display name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-gray-50 dark:bg-gray-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell us about yourself"
                className="h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="Your location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="text-sm font-medium flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Website
                </Label>
                <Input
                  id="website"
                  value={profile.website}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  placeholder="Your website"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthdate" className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Birth Date
              </Label>
              <Input
                id="birthdate"
                type="date"
                value={profile.birthdate}
                onChange={(e) => setProfile({ ...profile, birthdate: e.target.value })}
              />
            </div>
          </div>

          <Separator />

          {/* Preferences Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="emailNotifications" className="text-sm">Email Notifications</Label>
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

          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Privacy
            </h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="publicProfile" className="text-sm">Public Profile</Label>
              <Switch
                id="publicProfile"
                checked={profile.preferences.publicProfile}
                onCheckedChange={(checked) => setProfile({
                  ...profile,
                  preferences: { ...profile.preferences, publicProfile: checked }
                })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="shareProgress" className="text-sm">Share Progress</Label>
              <Switch
                id="shareProgress"
                checked={profile.preferences.shareProgress}
                onCheckedChange={(checked) => setProfile({
                  ...profile,
                  preferences: { ...profile.preferences, shareProgress: checked }
                })}
              />
            </div>
          </div>

          <Separator />

          {/* Security Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="twoFactorAuth" className="text-sm">Two-Factor Authentication</Label>
              <Switch
                id="twoFactorAuth"
                checked={profile.security.twoFactorAuth}
                onCheckedChange={(checked) => setProfile({
                  ...profile,
                  security: { ...profile.security, twoFactorAuth: checked }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout" className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Session Timeout (minutes)
              </Label>
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
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
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