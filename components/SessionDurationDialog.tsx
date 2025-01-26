import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer, ChevronRight, InfinityIcon, X, Check } from 'lucide-react'
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
  const [isCustomConfirmed, setIsCustomConfirmed] = useState(false)

  const textColorClass = clockColor?.split(' ')?.[0] || 'text-gray-500'
  const bgColorClass = clockColor?.split(' ')?.[1] || 'bg-gray-500'

  const calculateRotation = (minutes: number) => {
    // Calculate based on clock's rotation time
    const rotationTimes = {
      0: 11 * 60, // 11 hours in minutes
      1: 16 * 60,
      2: 25 * 60,
      3: 243 * 60,
      4: 17 * 60,
      5: 58 * 60,
      6: 10 * 60,
      7: 10 * 60,
      8: 24 * 60
    }
    const clockRotationTime = rotationTimes[clockId as keyof typeof rotationTimes] || 60
    return (minutes / clockRotationTime) * 360
  }

  useEffect(() => {
    const duration = isCustom ? Number(customDuration) : selectedPreset || hoveredPreset || 0
    setRotationDegrees(calculateRotation(duration))
  }, [selectedPreset, customDuration, isCustom, hoveredPreset, clockId])

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = Number(customDuration)
    if (value > 0 && value <= 120) {
      setIsCustomConfirmed(true)
      setIsCustom(true)
      setSelectedPreset(null)
    }
  }

  const handleNext = () => {
    if (isEndless) {
      onNext(null)
    } else if (isCustom && isCustomConfirmed) {
      onNext(Number(customDuration))
    } else if (selectedPreset !== null) {
      onNext(selectedPreset)
    }
  }

  const canProceed = isEndless || selectedPreset !== null || (isCustom && isCustomConfirmed)

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
                        className={cn(
                          "stroke-current transition-all duration-300",
                          hoveredPreset !== null && "filter blur-[1px]"
                        )}
                        cx="50"
                        cy="50"
                        r="48"
                        fill="none"
                        stroke={bgColorClass.split('-')[1]}
                        strokeWidth={hoveredPreset !== null ? "2" : "1.5"}
                        strokeDasharray={`${(rotationDegrees / 360) * 302} 302`}
                        style={{ opacity: hoveredPreset !== null ? 0.9 : 0.8 }}
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
                          <div className="opacity-20">
                            <InfinityIcon className="w-12 h-12" />
                          </div>
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
                        setIsCustomConfirmed(false)
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
                        setIsCustomConfirmed(false)
                        setIsEndless(false)
                      }}
                      onHoverStart={() => setHoveredPreset(preset)}
                      onHoverEnd={() => setHoveredPreset(null)}
                      className={cn(
                        "relative h-14 rounded-xl text-sm font-medium transition-all",
                        selectedPreset === preset 
                          ? `${bgColorClass} text-white shadow-lg` 
                          : 'bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg">{preset}</span>
                        <span className="text-sm ml-1">min</span>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Custom Duration */}
                <div>
                  <div className="text-sm text-gray-400 mb-2">OR CUSTOM</div>
                  <form onSubmit={handleCustomSubmit} className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="120"
                      value={customDuration}
                      onChange={(e) => {
                        setCustomDuration(e.target.value)
                        setIsCustomConfirmed(false)
                      }}
                      placeholder="Enter duration"
                      className={cn(
                        "h-14 text-lg",
                        "border-gray-100 dark:border-gray-800",
                        "hover:border-gray-200 dark:hover:border-gray-700",
                        isCustom && isCustomConfirmed && "ring-1",
                        isCustom && isCustomConfirmed && bgColorClass.replace('bg-', 'ring-')
                      )}
                    />
                    <Button
                      type="submit"
                      className={cn(
                        "h-14 px-4",
                        isCustom && isCustomConfirmed ? `${bgColorClass} text-white` : 'bg-gray-50 dark:bg-white/5'
                      )}
                    >
                      <Check className="w-5 h-5" />
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Next Button */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className={cn(
                "h-14 px-8 text-white transition-all text-lg",
                bgColorClass,
                "hover:opacity-90 disabled:opacity-50"
              )}
            >
              Start Session
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 