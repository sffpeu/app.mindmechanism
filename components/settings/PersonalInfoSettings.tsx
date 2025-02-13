'use client'

import { useAuth } from '@/lib/FirebaseAuthContext'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Camera, AlertCircle } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { getAuth, updateProfile } from 'firebase/auth'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

interface PersonalInfoSettingsProps {
  onChangesPending?: (hasChanges: boolean) => void
}

export function PersonalInfoSettings({ onChangesPending }: PersonalInfoSettingsProps) {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const auth = getAuth()
  const storage = getStorage()

  useEffect(() => {
    const hasChanges = displayName.trim() !== (user?.displayName || '')
    onChangesPending?.(hasChanges)
  }, [displayName, user?.displayName, onChangesPending])

  useEffect(() => {
    const handleSave = async () => {
      if (!auth.currentUser || displayName.trim() === user?.displayName) return
      setIsUpdating(true)
      setError(null)

      try {
        await updateProfile(auth.currentUser, {
          displayName: displayName.trim()
        })
      } catch (err) {
        setError('Failed to update display name. Please try again.')
        console.error('Error updating profile:', err)
      } finally {
        setIsUpdating(false)
      }
    }

    const handleCancel = () => {
      setDisplayName(user?.displayName || '')
    }

    window.addEventListener('settings-save', handleSave)
    window.addEventListener('settings-cancel', handleCancel)

    return () => {
      window.removeEventListener('settings-save', handleSave)
      window.removeEventListener('settings-cancel', handleCancel)
    }
  }, [auth.currentUser, displayName, user?.displayName])

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
      <div className="flex items-start gap-4">
        {/* Profile Image */}
        <div className="relative flex-shrink-0">
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="Profile" 
              className="w-14 h-14 rounded-full object-cover ring-2 ring-white/10 dark:ring-black/10"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center ring-2 ring-white/10 dark:ring-black/10">
              <User className="h-7 w-7 text-gray-400 dark:text-gray-500" />
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Camera className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        <div className="flex-grow space-y-3">
          {/* Display Name */}
          <div className="space-y-1.5">
            <Label htmlFor="displayName" className="text-sm text-gray-700 dark:text-gray-300">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm text-gray-700 dark:text-gray-300">Email</Label>
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
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </Card>
  )
} 