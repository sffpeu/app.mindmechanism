import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Timer, Clock, ChevronRight, Infinity as InfinityIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface SessionDurationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clockId: number
  clockColor: string
  onNext: (duration: number | null) => void
}

const timePresets = [5, 10, 15, 30, 45, 60]

export function SessionDurationDialog({ 
  open, 
  onOpenChange, 
  clockId, 
  clockColor = 'text-gray-500 bg-gray-500',
  onNext 
}: SessionDurationDialogProps) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
  const [customDuration, setCustomDuration] = useState(30)
  const [isCustom, setIsCustom] = useState(false)
  const [isEndless, setIsEndless] = useState(false)
  const [remainingTime, setRemainingTime] = useState('00:00')

  useEffect(() => {
    const duration = isCustom ? customDuration : selectedPreset || 0
    const minutes = Math.floor(duration)
    const seconds = Math.round((duration % 1) * 60)
    setRemainingTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
  }, [selectedPreset, customDuration, isCustom])

  const handleNext = () => {
    if (isEndless) {
      onNext(null)
    } else if (isCustom) {
      onNext(customDuration)
    } else if (selectedPreset !== null) {
      onNext(selectedPreset)
    }
  }

  const textColorClass = clockColor?.split(' ')?.[0] || 'text-gray-500'
  const bgColorClass = clockColor?.split(' ')?.[1] || 'bg-gray-500'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-black border-0 p-0 max-w-md mx-auto overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-black/5 dark:border-white/10">
          <h2 className="text-xl font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Timer className="w-5 h-5" />
            Choose Duration
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Timer Display */}
          <div className="flex justify-center">
            <motion.div 
              className="relative w-32 h-32 flex items-center justify-center rounded-full bg-gray-50 dark:bg-white/5"
              animate={{ 
                rotate: isEndless ? 360 : 0 
              }}
              transition={{ 
                duration: isEndless ? 3 : 0.3, 
                repeat: isEndless ? Number.POSITIVE_INFINITY : 0, 
                ease: "linear" 
              }}
            >
              {isEndless ? (
                <InfinityIcon className={`w-12 h-12 ${textColorClass}`} />
              ) : (
                <div className="flex flex-col items-center">
                  <span className={`text-3xl font-medium tabular-nums ${textColorClass}`}>
                    {remainingTime}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">minutes</span>
                </div>
              )}
              {!isEndless && (
                <motion.div 
                  className={`absolute inset-0 rounded-full ${bgColorClass}`}
                  style={{
                    clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%)',
                    opacity: 0.1,
                    rotate: ((isCustom ? customDuration : (selectedPreset || 0)) / 60) * 360,
                    originX: 0.5,
                    originY: 0.5,
                  }}
                />
              )}
            </motion.div>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {timePresets.map((preset) => (
              <Button
                key={preset}
                variant="outline"
                onClick={() => {
                  setSelectedPreset(preset)
                  setIsCustom(false)
                  setIsEndless(false)
                }}
                className={`h-12 font-medium transition-all ${
                  selectedPreset === preset 
                    ? `${bgColorClass} hover:opacity-90 text-white border-0` 
                    : 'hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                {preset}m
              </Button>
            ))}
          </div>

          {/* Custom and Endless Options */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCustom(true)
                setSelectedPreset(null)
                setIsEndless(false)
              }}
              className={`flex-1 h-12 font-medium transition-all ${
                isCustom 
                  ? `${bgColorClass} hover:opacity-90 text-white border-0` 
                  : 'hover:bg-gray-50 dark:hover:bg-white/5'
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
              className={`flex-1 h-12 font-medium transition-all ${
                isEndless 
                  ? `${bgColorClass} hover:opacity-90 text-white border-0` 
                  : 'hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              Endless
            </Button>
          </div>

          {/* Custom Duration Slider */}
          {isCustom && (
            <div className="space-y-4 bg-gray-50 dark:bg-white/5 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Custom Duration
                </span>
                <span className={`text-lg font-medium ${textColorClass}`}>
                  {customDuration}m
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
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-black/5 dark:border-white/10">
          <Button
            className={`w-full h-12 ${bgColorClass} hover:opacity-90 text-white gap-2`}
            onClick={handleNext}
            disabled={!isEndless && selectedPreset === null && !isCustom}
          >
            Start Session
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 