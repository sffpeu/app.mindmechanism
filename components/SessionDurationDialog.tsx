import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer, ChevronRight, InfinityIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SessionDurationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clockId: number
  clockColor: string
  onNext: (duration: number | null) => void
}

const timePresets = [15, 30, 45, 60, 120]

export function SessionDurationDialog({ 
  open, 
  onOpenChange, 
  clockId, 
  clockColor = 'text-gray-500 bg-gray-500',
  onNext 
}: SessionDurationDialogProps) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
  const [customDuration, setCustomDuration] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [isEndless, setIsEndless] = useState(false)
  const [hoveredPreset, setHoveredPreset] = useState<number | null>(null)
  const [rotationDegrees, setRotationDegrees] = useState(0)

  const textColorClass = clockColor?.split(' ')?.[0] || 'text-gray-500'
  const bgColorClass = clockColor?.split(' ')?.[1] || 'bg-gray-500'

  const calculateRotation = (minutes: number) => {
    return (minutes / 60) * 360
  }

  useEffect(() => {
    const duration = isCustom ? Number(customDuration) : selectedPreset || hoveredPreset || 0
    setRotationDegrees(calculateRotation(duration))
  }, [selectedPreset, customDuration, isCustom, hoveredPreset])

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = Number(customDuration)
    if (value > 0 && value <= 120) {
      setIsCustom(true)
      setSelectedPreset(null)
    }
  }

  const handleNext = () => {
    if (isEndless) {
      onNext(null)
    } else if (isCustom) {
      onNext(Number(customDuration))
    } else if (selectedPreset !== null) {
      onNext(selectedPreset)
    }
  }

  const canProceed = isEndless || selectedPreset !== null || (isCustom && Number(customDuration) > 0 && Number(customDuration) <= 120)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-black sm:max-w-[800px] border-0">
        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
          {/* Close Button */}
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute right-2 top-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="absolute left-6 top-6 flex items-center">
            <Timer className="w-5 h-5 mr-2" />
            <h2 className="text-xl font-medium">Set Duration</h2>
          </div>

          <div className="absolute inset-0 flex items-center">
            <div className="w-full grid grid-cols-[1fr_1.2fr] gap-12 px-6">
              {/* Timer Visualization */}
              <div className="flex items-center justify-center">
                <div className="relative w-[280px] h-[280px]">
                  {/* Background circle */}
                  <div className="absolute inset-0 rounded-full border border-gray-100 dark:border-gray-800" />
                  
                  {/* Progress arc */}
                  {!isEndless && (
                    <svg
                      className="absolute inset-0 w-full h-full -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        className="stroke-current"
                        cx="50"
                        cy="50"
                        r="49"
                        fill="none"
                        stroke={bgColorClass.split('-')[1]}
                        strokeWidth="0.5"
                        strokeDasharray={`${(rotationDegrees / 360) * 308} 308`}
                        style={{ opacity: 0.8 }}
                      />
                    </svg>
                  )}

                  {/* Center content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={isEndless ? 'endless' : 'timed'}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex flex-col items-center"
                      >
                        {isEndless ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          >
                            <InfinityIcon className={cn("w-12 h-12 opacity-20")} />
                          </motion.div>
                        ) : (
                          <>
                            <span className={cn("text-4xl font-light", textColorClass)}>
                              {rotationDegrees.toFixed(0)}°
                            </span>
                            <span className="text-sm text-gray-400 mt-1">
                              {isCustom ? customDuration : (selectedPreset || hoveredPreset || 0)}min
                            </span>
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col gap-6">
                {/* Endless Mode Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Endless Session</h3>
                    <p className="text-sm text-gray-400">No time limit</p>
                  </div>
                  <Switch
                    checked={isEndless}
                    onCheckedChange={(checked) => {
                      setIsEndless(checked)
                      if (checked) {
                        setSelectedPreset(null)
                        setIsCustom(false)
                      }
                    }}
                    className={isEndless ? bgColorClass : ''}
                  />
                </div>

                {/* Time Presets */}
                <div className="grid grid-cols-2 gap-3">
                  {timePresets.map((preset) => (
                    <motion.button
                      key={preset}
                      onClick={() => {
                        setSelectedPreset(preset)
                        setIsCustom(false)
                        setIsEndless(false)
                      }}
                      onHoverStart={() => setHoveredPreset(preset)}
                      onHoverEnd={() => setHoveredPreset(null)}
                      className={cn(
                        "h-12 rounded-lg text-sm transition-all",
                        "border border-gray-100 dark:border-gray-800",
                        selectedPreset === preset 
                          ? `${bgColorClass} text-white border-0` 
                          : `hover:${bgColorClass} hover:text-white hover:border-0`
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {preset}min
                    </motion.button>
                  ))}
                </div>

                {/* Custom Duration */}
                <div>
                  <div className="text-sm text-gray-400 mb-2">OR CUSTOM</div>
                  <Input
                    type="number"
                    min="1"
                    max="120"
                    value={customDuration}
                    onChange={(e) => {
                      setCustomDuration(e.target.value)
                      setIsCustom(true)
                      setSelectedPreset(null)
                      setIsEndless(false)
                    }}
                    placeholder="Enter duration"
                    className={cn(
                      "h-12",
                      "border-gray-100 dark:border-gray-800",
                      "hover:border-gray-200 dark:hover:border-gray-700",
                      isCustom && "ring-1",
                      isCustom && bgColorClass.replace('bg-', 'ring-')
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Next Button */}
          <div className="absolute bottom-6 right-6">
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className={cn(
                "h-12 px-6 text-white transition-all",
                bgColorClass,
                "hover:opacity-90 disabled:opacity-50"
              )}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 