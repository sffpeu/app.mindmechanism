import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { motion } from 'framer-motion'
import { Infinity } from 'lucide-react'

interface SessionDurationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clockId: number
  clockColor: string
  onNext: (duration: number | null) => void
}

const timePresets = [
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 }
]

export function SessionDurationDialog({ 
  open, 
  onOpenChange, 
  clockId, 
  clockColor = 'text-gray-500 bg-gray-500', // Default color if none provided
  onNext 
}: SessionDurationDialogProps) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
  const [customDuration, setCustomDuration] = useState(30)
  const [isCustom, setIsCustom] = useState(false)
  const [isEndless, setIsEndless] = useState(false)

  // Extract color class with safety check
  const colorClass = clockColor?.split(' ')?.[1] || 'bg-gray-500' // Default to gray if split fails

  // Calculate rotation preview based on duration
  const getRotationPreview = (duration: number) => {
    return (duration / 60) * 360 // 60 minutes = full rotation
  }

  const handleNext = () => {
    if (isEndless) {
      onNext(null) // null indicates endless session
    } else if (isCustom) {
      onNext(customDuration)
    } else if (selectedPreset !== null) {
      onNext(selectedPreset)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Choose Session Duration</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Visual Preview */}
          <div className="relative aspect-square w-40 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-black/10 dark:border-white/10" />
            {!isEndless ? (
              <motion.div
                className={`absolute inset-0 rounded-full border-2 ${colorClass?.replace('bg-', 'border-')}`}
                style={{
                  clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%)',
                  rotate: getRotationPreview(isCustom ? customDuration : (selectedPreset ?? 0)),
                  originX: 0.5,
                  originY: 0.5,
                }}
                transition={{ type: "spring", bounce: 0 }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Infinity className={`w-12 h-12 ${colorClass?.replace('bg-', 'text-')}`} />
              </div>
            )}
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {timePresets.map((preset) => (
              <Button
                key={preset.value}
                variant={selectedPreset === preset.value ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedPreset(preset.value)
                  setIsCustom(false)
                  setIsEndless(false)
                }}
                className={`relative overflow-hidden ${
                  selectedPreset === preset.value ? colorClass + ' text-white' : ''
                }`}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Custom Duration */}
          {isCustom && (
            <div className="space-y-4">
              <label className="text-sm font-medium">
                Duration: {customDuration} minutes
              </label>
              <Slider
                value={[customDuration]}
                onValueChange={([value]) => setCustomDuration(value)}
                max={120}
                min={1}
                step={1}
                className={colorClass?.replace('bg-', 'text-')}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCustom(true)
                setSelectedPreset(null)
                setIsEndless(false)
              }}
              className={isCustom ? colorClass + ' text-white' : ''}
            >
              Custom
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsEndless(true)
                setSelectedPreset(null)
                setIsCustom(false)
              }}
              className={isEndless ? colorClass + ' text-white' : ''}
            >
              Endless
            </Button>
            <Button
              className={`ml-auto ${colorClass} text-white`}
              onClick={handleNext}
              disabled={!isEndless && selectedPreset === null && !isCustom}
            >
              Next
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 