'use client'

import { useAuth } from '@/lib/FirebaseAuthContext'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Camera, AlertCircle, ImageIcon } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { getAuth, updateProfile, type User } from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { getFirebaseStorage } from '@/lib/firebase'
import { FirebaseError } from 'firebase/app'
import { processBannerImageForUpload, type BannerFocalPoint } from '@/lib/cropBannerImage'
import { BannerFocalDialog } from './BannerFocalDialog'

/** Persists banner URL via API + Firebase Admin (bypasses client Firestore rules mismatches). */
async function persistBannerUrlAfterUpload(currentUser: User, bannerUrl: string): Promise<void> {
  const idToken = await currentUser.getIdToken()
  const res = await fetch('/api/profile/banner-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ bannerUrl }),
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) {
    throw new Error(data.error || `Could not save banner (${res.status})`)
  }
}

function bannerUploadErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    if (err.code === 'storage/unauthorized') {
      return 'Upload was denied. Sign out and sign in again, then retry.'
    }
    if (err.code === 'storage/unauthenticated') {
      return 'You must be signed in to upload a banner.'
    }
    if (err.code === 'permission-denied') {
      return 'Could not save the banner (permission denied). If this continues, contact support.'
    }
    if (err.code.startsWith('storage/')) {
      return 'Could not upload the image. Check your connection and try again.'
    }
  }
  if (err instanceof Error) {
    if (/load image|dimensions|encode banner|processed/i.test(err.message)) {
      return 'This image could not be processed. Try a standard JPG or PNG photo.'
    }
    if (err.message.includes('Firebase is not ready')) {
      return err.message
    }
    if (err.message.includes('Unauthorized') || err.message.includes('401')) {
      return 'Your session may have expired. Sign out and sign in, then try again.'
    }
    if (err.message.includes('503') || err.message.includes('verify authentication')) {
      return 'Could not save the banner (server configuration). Please try again later.'
    }
    if (err.message.startsWith('Could not save banner')) {
      return err.message
    }
  }
  return 'Failed to update profile banner. Please try again.'
}

interface PersonalInfoSettingsProps {
  onChangesPending?: (hasChanges: boolean) => void
}

type PendingBannerState = {
  blob: Blob
  previewUrl: string
}

export function PersonalInfoSettings({ onChangesPending }: PersonalInfoSettingsProps) {
  const { user, profile, refreshProfile, mergeProfilePatch } = useAuth()
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const [bannerFocalOpen, setBannerFocalOpen] = useState(false)
  const [pendingBannerFile, setPendingBannerFile] = useState<File | null>(null)
  const [pendingBanner, setPendingBanner] = useState<PendingBannerState | null>(null)
  const [pendingBannerRemove, setPendingBannerRemove] = useState(false)
  const pendingBannerRef = useRef<PendingBannerState | null>(null)
  const pendingBannerRemoveRef = useRef(false)
  const auth = getAuth()

  pendingBannerRef.current = pendingBanner
  pendingBannerRemoveRef.current = pendingBannerRemove

  useEffect(() => {
    setDisplayName(user?.displayName || '')
  }, [user?.uid, user?.displayName])

  useEffect(() => {
    const nameChanged = displayName.trim() !== (user?.displayName || '')
    const bannerDirty = pendingBanner !== null || pendingBannerRemove
    onChangesPending?.(nameChanged || bannerDirty)
  }, [displayName, user?.displayName, pendingBanner, pendingBannerRemove, onChangesPending])

  useEffect(() => {
    const notifySaveComplete = (success: boolean) => {
      window.dispatchEvent(
        new CustomEvent<{ success: boolean }>('settings-save-complete', { detail: { success } })
      )
    }

    const handleSave = async () => {
      let closeDialog = false
      try {
        if (!auth.currentUser) {
          closeDialog = true
          return
        }
        const nameChanged = displayName.trim() !== (user?.displayName || '')
        const staged = pendingBannerRef.current
        const removeStaged = pendingBannerRemoveRef.current
        const bannerDirty = staged !== null || removeStaged
        if (!nameChanged && !bannerDirty) {
          closeDialog = true
          return
        }

        if (bannerDirty && !auth.currentUser) {
          setError('You must be signed in to save the banner.')
          return
        }

        setIsUpdating(true)
        setError(null)

        try {
          if (nameChanged) {
            await updateProfile(auth.currentUser, {
              displayName: displayName.trim(),
            })
          }

          const uid = auth.currentUser.uid

          if (staged) {
            const storage = getFirebaseStorage()
            const bannerRef = ref(storage, `profile-banners/${uid}`)
            await uploadBytes(bannerRef, staged.blob, {
              contentType: staged.blob.type || 'image/jpeg',
            })
            const bannerUrl = await getDownloadURL(bannerRef)
            await persistBannerUrlAfterUpload(auth.currentUser, bannerUrl)
            URL.revokeObjectURL(staged.previewUrl)
            setPendingBanner(null)
            setPendingBannerRemove(false)
            await refreshProfile()
            mergeProfilePatch({ bannerUrl })
          } else if (removeStaged) {
            try {
              await deleteObject(ref(getFirebaseStorage(), `profile-banners/${uid}`))
            } catch {
              /* object may not exist */
            }
            await persistBannerUrlAfterUpload(auth.currentUser, '')
            setPendingBannerRemove(false)
            await refreshProfile()
            mergeProfilePatch({ bannerUrl: '' })
          }
          closeDialog = true
        } catch (err) {
          console.error('Settings save failed:', err)
          if (staged || removeStaged) {
            setError(bannerUploadErrorMessage(err))
          } else {
            setError('Failed to update display name. Please try again.')
          }
        } finally {
          setIsUpdating(false)
        }
      } finally {
        notifySaveComplete(closeDialog)
      }
    }

    const handleCancel = () => {
      setDisplayName(user?.displayName || '')
      const staged = pendingBannerRef.current
      if (staged?.previewUrl) {
        URL.revokeObjectURL(staged.previewUrl)
      }
      setPendingBanner(null)
      setPendingBannerRemove(false)
    }

    window.addEventListener('settings-save', handleSave)
    window.addEventListener('settings-cancel', handleCancel)

    return () => {
      window.removeEventListener('settings-save', handleSave)
      window.removeEventListener('settings-cancel', handleCancel)
    }
  }, [displayName, user?.displayName, user?.uid, refreshProfile, mergeProfilePatch])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!auth.currentUser || !event.target.files?.[0]) return
    setIsUpdating(true)
    setError(null)

    try {
      const file = event.target.files[0]
      const storage = getFirebaseStorage()
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

  const handleBannerFileChosen = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !auth.currentUser) return
    setPendingBannerRemove(false)
    setPendingBannerFile(file)
    setBannerFocalOpen(true)
  }

  const handleBannerFocalConfirm = (focal: BannerFocalPoint) => {
    const file = pendingBannerFile
    setBannerFocalOpen(false)
    setPendingBannerFile(null)
    if (!file) return

    void (async () => {
      setIsUpdating(true)
      setError(null)
      try {
        const blob = await processBannerImageForUpload(file, focal)
        const previewUrl = URL.createObjectURL(blob)
        setPendingBanner((prev) => {
          if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl)
          return { blob, previewUrl }
        })
        setPendingBannerRemove(false)
      } catch (err) {
        console.error('Error preparing profile banner:', err)
        setError(bannerUploadErrorMessage(err))
      } finally {
        setIsUpdating(false)
      }
    })()
  }

  const handleBannerRemoveClick = () => {
    if (pendingBanner?.previewUrl) {
      URL.revokeObjectURL(pendingBanner.previewUrl)
    }
    setPendingBanner(null)
    setPendingBannerRemove(true)
  }

  const bannerPreviewSrc =
    pendingBanner?.previewUrl ??
    (!pendingBannerRemove && profile?.bannerUrl?.trim() ? profile.bannerUrl.trim() : null)

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

      {/* Profile banner — same persistence pattern as avatar: Storage + Firestore user_profiles */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <Label className="text-sm text-gray-700 dark:text-gray-300">Profile banner</Label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Shown at the top of your dashboard profile card. Choose a photo and crop position, then click{' '}
          <span className="font-medium text-gray-600 dark:text-gray-300">Save changes</span> in settings to apply it.
        </p>
        <div className="relative rounded-xl overflow-hidden h-24 sm:h-28 border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-slate-800 via-indigo-900/95 to-violet-900 dark:from-slate-900 dark:via-indigo-950 dark:to-violet-950">
          {bannerPreviewSrc ? (
            <img
              src={bannerPreviewSrc}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10 pointer-events-none"
            aria-hidden
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            {(profile?.bannerUrl?.trim() || pendingBanner) && !pendingBannerRemove ? (
              <button
                type="button"
                onClick={handleBannerRemoveClick}
                disabled={isUpdating}
                className="text-xs px-2.5 py-1 rounded-md bg-white/90 dark:bg-gray-900/90 text-gray-800 dark:text-gray-200 border border-gray-200/80 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Remove
              </button>
            ) : null}
            {pendingBannerRemove ? (
              <button
                type="button"
                onClick={() => setPendingBannerRemove(false)}
                disabled={isUpdating}
                className="text-xs px-2.5 py-1 rounded-md bg-white/90 dark:bg-gray-900/90 text-gray-800 dark:text-gray-200 border border-gray-200/80 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Undo remove
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={isUpdating}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-white/90 dark:bg-gray-900/90 text-gray-800 dark:text-gray-200 border border-gray-200/80 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              {profile?.bannerUrl?.trim() || pendingBanner ? 'Change' : 'Upload'}
            </button>
            <input
              type="file"
              ref={bannerInputRef}
              onChange={handleBannerFileChosen}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>
      </div>

      <BannerFocalDialog
        open={bannerFocalOpen}
        onOpenChange={(open) => {
          setBannerFocalOpen(open)
          if (!open) {
            setPendingBannerFile(null)
          }
        }}
        file={pendingBannerFile}
        onConfirm={handleBannerFocalConfirm}
      />

      {error && (
        <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </Card>
  )
} 