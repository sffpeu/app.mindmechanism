'use client'

import { useAuth } from '@/lib/FirebaseAuthContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Camera, AlertCircle } from 'lucide-react'
import { useState, useRef } from 'react'
import { getAuth, updateProfile } from 'firebase/auth'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export function PersonalInfoSettings() {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const auth = getAuth()
  const storage = getStorage()

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return
    setIsUpdating(true)
    setError(null)

    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName
      })
    } catch (err) {
      setError('Failed to update display name. Please try again.')
      console.error('Error updating profile:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!auth.currentUser || !event.target.files?.[0]) return
    setIsUpdating(true)
    setError(null)

    try {
      const file = event.target.files[0]
      const imageRef = ref(storage, `profile-images/${auth.currentUser.uid}`)
      await uploadBytes(imageRef, file)
      const photoURL = await getDownloadURL(imageRef)
      
      await updateProfile(auth.currentUser, {
        photoURL: photoURL
      })
    } catch (err) {
      setError('Failed to update profile image. Please try again.')
      console.error('Error updating profile image:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className="p-4 bg-white/50 dark:bg-black/50">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Personal Information</h2>
      <div className="space-y-4">
        {/* Profile Image */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="w-16 h-16 rounded-full object-cover ring-2 ring-white/10 dark:ring-black/10"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center ring-2 ring-white/10 dark:ring-black/10">
                <User className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Camera className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Profile Image</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Click the camera icon to change your profile image
            </p>
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="displayName" className="text-gray-700 dark:text-gray-300">Display Name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email</Label>
          <div className="flex items-center gap-2">
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            />
            <div className="relative group">
              <AlertCircle className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Email cannot be changed when using Google Sign-in
              </div>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}

        <Button 
          onClick={handleUpdateProfile}
          disabled={isUpdating || !displayName.trim() || displayName === user?.displayName}
          className="w-full"
        >
          {isUpdating ? 'Updating...' : 'Save Changes'}
        </Button>
      </div>
    </Card>
  )
} 