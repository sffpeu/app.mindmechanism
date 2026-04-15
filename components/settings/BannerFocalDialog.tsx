'use client'

import { useEffect, useLayoutEffect, useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  computeBannerCropRect,
  type BannerFocalPoint,
} from '@/lib/cropBannerImage'
import { cn } from '@/lib/utils'

const PREVIEW_W = 360
const PREVIEW_H = 120

type BannerFocalDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: File | null
  onConfirm: (focal: BannerFocalPoint) => void
}

export function BannerFocalDialog({
  open,
  onOpenChange,
  file,
  onConfirm,
}: BannerFocalDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [hx, setHx] = useState([50])
  const [vy, setVy] = useState([50])

  useEffect(() => {
    if (!open || !file) {
      setBitmap((prev) => {
        prev?.close()
        return null
      })
      setLoadError(null)
      return
    }

    let cancelled = false
    setLoadError(null)
    setHx([50])
    setVy([50])

    createImageBitmap(file)
      .then((bmp) => {
        if (cancelled) {
          bmp.close()
          return
        }
        setBitmap((prev) => {
          prev?.close()
          return bmp
        })
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError('Could not preview this image. Try JPG or PNG.')
          setBitmap((prev) => {
            prev?.close()
            return null
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [open, file])

  const focal: BannerFocalPoint = {
    x: (hx[0] ?? 50) / 100,
    y: (vy[0] ?? 50) / 100,
  }

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    const bmp = bitmap
    if (!canvas || !bmp) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { sx, sy, sw, sh } = computeBannerCropRect(bmp.width, bmp.height, focal)
    ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bmp, sx, sy, sw, sh, 0, 0, PREVIEW_W, PREVIEW_H)
  }, [bitmap, focal.x, focal.y])

  const handleConfirm = () => {
    onConfirm(focal)
    onOpenChange(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setBitmap((prev) => {
        prev?.close()
        return null
      })
      setLoadError(null)
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-gray-200 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">Position banner crop</DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-left font-normal">
            Drag the sliders to choose what stays centered in the 3:1 banner. The preview matches what will be saved.
          </p>
        </DialogHeader>

        {loadError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
        ) : (
          <div className="space-y-4">
            <div
              className={cn(
                'rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 flex justify-center',
                !bitmap && 'min-h-[120px] items-center'
              )}
            >
              {bitmap ? (
                <canvas
                  ref={canvasRef}
                  width={PREVIEW_W}
                  height={PREVIEW_H}
                  className="w-full max-w-full h-auto"
                  aria-hidden
                />
              ) : (
                <span className="text-xs text-gray-500 py-8">Loading preview…</span>
              )}
            </div>

            <div className="space-y-4 pt-1">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Left</span>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Horizontal focus
                  </Label>
                  <span>Right</span>
                </div>
                <Slider
                  value={hx}
                  onValueChange={setHx}
                  min={0}
                  max={100}
                  step={1}
                  className="py-1"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Top</span>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Vertical focus
                  </Label>
                  <span>Bottom</span>
                </div>
                <Slider
                  value={vy}
                  onValueChange={setVy}
                  min={0}
                  max={100}
                  step={1}
                  className="py-1"
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!bitmap || !!loadError}>
            Use this crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
