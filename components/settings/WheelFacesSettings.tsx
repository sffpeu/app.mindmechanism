'use client'

import { useRef, useState } from 'react'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { db, getFirebaseStorage } from '@/lib/firebase'
import { doc, setDoc, Firestore } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { emptyWheelFaceOverlays, WHEEL_FACE_COUNT } from '@/lib/wheelFaceOverlays'
import { clockTitles } from '@/lib/clockTitles'

export function WheelFacesSettings() {
  const { user, profile, refreshProfile, mergeProfilePatch } = useAuth()
  const [busyIndex, setBusyIndex] = useState<number | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const overlays = profile?.wheelFaceOverlays ?? emptyWheelFaceOverlays()

  const persistOverlays = async (next: string[]) => {
    if (!user?.uid || !db) return
    await setDoc(
      doc(db as Firestore, 'users', user.uid),
      { wheelFaceOverlays: next },
      { merge: true }
    )
    await refreshProfile()
    mergeProfilePatch({ wheelFaceOverlays: next })
  }

  const handleFile = async (index: number, file: File | undefined) => {
    if (!file || !user?.uid) return
    setBusyIndex(index)
    try {
      const storage = getFirebaseStorage()
      const storageRef = ref(storage, `wheel-face-overlays/${user.uid}/${index}`)
      await uploadBytes(storageRef, file, {
        contentType: file.type.startsWith('image/') ? file.type : 'image/jpeg',
      })
      const url = await getDownloadURL(storageRef)
      const base = [...(profile?.wheelFaceOverlays ?? emptyWheelFaceOverlays())]
      base[index] = url
      await persistOverlays(base)
    } catch (e) {
      console.error('Wheel face upload failed:', e)
    } finally {
      setBusyIndex(null)
    }
  }

  const clearFace = async (index: number) => {
    if (!user?.uid) return
    setBusyIndex(index)
    try {
      const storage = getFirebaseStorage()
      try {
        await deleteObject(ref(storage, `wheel-face-overlays/${user.uid}/${index}`))
      } catch {
        /* file may not exist */
      }
      const base = [...(profile?.wheelFaceOverlays ?? emptyWheelFaceOverlays())]
      base[index] = ''
      await persistOverlays(base)
    } catch (e) {
      console.error('Wheel face clear failed:', e)
    } finally {
      setBusyIndex(null)
    }
  }

  return (
    <Card className="p-4 bg-white/50 dark:bg-black/50">
      <div className="space-y-1.5 mb-3">
        <Label className="text-sm text-gray-700 dark:text-gray-300">Wheel face overlays</Label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Optional images layered on each clock face on single-clock pages only. Built-in clock artwork is unchanged; multiview 1 and 2 are not affected.
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
        {Array.from({ length: WHEEL_FACE_COUNT }).map((_, index) => {
          const url = overlays[index]?.trim()
          const busy = busyIndex === index
          return (
            <div
              key={index}
              className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 p-2"
            >
              <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 truncate w-full text-center">
                {clockTitles[index] ?? `Face ${index + 1}`}
              </span>
              <div className="relative h-16 w-16 rounded-full overflow-hidden ring-1 ring-black/10 dark:ring-white/10 bg-gray-200 dark:bg-gray-800">
                <img
                  src={`/clock_${index + 1}.svg`}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover dark:invert"
                />
                {url ? (
                  <img
                    src={url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover dark:invert z-[1]"
                  />
                ) : null}
                {busy ? (
                  <div className="absolute inset-0 z-[2] flex items-center justify-center bg-black/30 rounded-full">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </div>
                ) : null}
              </div>
              <div className="flex w-full gap-1 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[10px] flex-1"
                  disabled={busy || !user}
                  onClick={() => inputRefs.current[index]?.click()}
                >
                  <ImagePlus className="h-3 w-3 mr-0.5 shrink-0" />
                  Add
                </Button>
                {url ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[10px]"
                    disabled={busy}
                    onClick={() => void clearFace(index)}
                    aria-label={`Remove overlay for face ${index + 1}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                ) : null}
                <input
                  ref={(el) => {
                    inputRefs.current[index] = el
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    e.target.value = ''
                    if (f) void handleFile(index, f)
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
