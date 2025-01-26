import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { motion } from 'framer-motion'
import { Timer, Infinity, Clock, ChevronRight } from 'lucide-react'

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
  const [remainingTime, setRemainingTime] = useState<string>('00:00')

  // Extract color class with safety check
  const colorClass = clockColor?.split(' ')?.[1] || 'bg-gray-500' // Default to gray if split fails
  const textColorClass = colorClass?.replace('bg-', 'text-')

  // Calculate rotation preview based on duration
  const getRotationPreview = (duration: number) => {
    return (duration / 60) * 360 // 60 minutes = full rotation
  }

  useEffect(() => {
    if (!selectedPreset) {
      setRemainingTime('00:00')
      return
    }

    const minutes = Math.floor(selectedPreset)
    const seconds = Math.round((selectedPreset - minutes) * 60)
    setRemainingTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
  }, [selectedPreset])

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
      <DialogContent className="sm:max-w-[425px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-8 py-6 bg-white dark:bg-black border-b border-black/5 dark:border-white/10">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Timer className="w-5 h-5" />
            Choose Duration
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 bg-gray-50/50 dark:bg-black/40 space-y-8">
          {/* Visual Preview */}
          <div className="relative aspect-square w-40 mx-auto">
            <div className="absolute inset-0 rounded-full bg-white dark:bg-black shadow-lg border border-black/5 dark:border-white/10" />
            {!isEndless ? (
              <>
                <motion.div
                  className={`absolute inset-0 rounded-full ${colorClass} opacity-10`}
                  style={{
                    clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%)',
                    rotate: getRotationPreview(isCustom ? customDuration : (selectedPreset ?? 0)),
                    originX: 0.5,
                    originY: 0.5,
                  }}
                  transition={{ type: "spring", bounce: 0 }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Clock className={`w-8 h-8 ${textColorClass}`} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-2xl font-medium ${textColorClass}`}>
                    {isCustom ? customDuration : (selectedPreset ?? 0)}
                  </span>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Infinity className={`w-12 h-12 ${textColorClass}`} />
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
                className={`h-12 relative overflow-hidden hover:border-black/20 dark:hover:border-white/20 ${
                  selectedPreset === preset.value 
                    ? `${colorClass} hover:opacity-90 text-white border-0` 
                    : 'hover:bg-white dark:hover:bg-black'
                }`}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Custom Duration */}
          {isCustom && (
            <div className="space-y-6 bg-white dark:bg-black p-4 rounded-lg border border-black/5 dark:border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Custom Duration
                </label>
                <span className={`text-lg font-medium ${textColorClass}`}>
                  {customDuration} min
                </span>
              </div>
              <Slider
                value={[customDuration]}
                onValueChange={([value]) => setCustomDuration(value)}
                max={120}
                min={1}
                step={1}
                className={textColorClass}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCustom(true)
                setSelectedPreset(null)
                setIsEndless(false)
              }}
              className={`h-12 hover:border-black/20 dark:hover:border-white/20 hover:bg-white dark:hover:bg-black ${
                isCustom ? `${colorClass} hover:opacity-90 text-white border-0` : ''
              }`}
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
              className={`h-12 hover:border-black/20 dark:hover:border-white/20 hover:bg-white dark:hover:bg-black ${
                isEndless ? `${colorClass} hover:opacity-90 text-white border-0` : ''
              }`}
            >
              Endless
            </Button>
            <Button
              className={`h-12 ml-auto ${colorClass} hover:opacity-90 text-white gap-2`}
              onClick={handleNext}
              disabled={!isEndless && selectedPreset === null && !isCustom}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 