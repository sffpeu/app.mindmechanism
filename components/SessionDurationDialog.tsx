import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, InfinityIcon, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-black sm:max-w-[425px] border-0">
        <div className="grid gap-8 p-6">
          {/* Timer Visualization */}
          <div className="flex justify-center">
            <div className="relative">
              <motion.div 
                className={cn(
                  "w-40 h-40 rounded-full flex items-center justify-center",
                  "bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800",
                  "shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]",
                  "dark:shadow-[inset_0_1px_1px_rgba(0,0,0,0.2)]"
                )}
              >
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={isEndless ? 'endless' : 'timed'}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    {isEndless ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="relative"
                      >
                        <InfinityIcon className={cn("w-14 h-14", textColorClass)} />
                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center space-y-1">
                        <span className={cn("text-3xl font-semibold tracking-tight", textColorClass)}>
                          {isCustom ? customDuration : (selectedPreset || hoveredPreset || 0)}
                        </span>
                        <span className={cn("text-sm font-medium", textColorClass)}>minutes</span>
                        <span className={cn("text-xs", textColorClass)}>
                          {rotationDegrees.toFixed(0)}° rotation
                        </span>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {!isEndless && (
                  <motion.div 
                    className="absolute inset-2"
                    style={{
                      borderRadius: '100%',
                      background: `conic-gradient(${bgColorClass.split('-')[1]} ${rotationDegrees}deg, transparent 0deg)`,
                      opacity: 0.15,
                    }}
                    animate={{
                      rotate: [0, 360]
                    }}
                    transition={{
                      duration: 120,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                )}
              </motion.div>
            </div>
          </div>

          {/* Time Presets */}
          <div className="grid grid-cols-3 gap-2">
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
                  "relative px-4 h-10 rounded-md text-sm font-medium transition-all",
                  "hover:shadow-[0_0_0_1px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.1)]",
                  selectedPreset === preset 
                    ? `${bgColorClass} text-white shadow-lg` 
                    : 'bg-gray-50/50 dark:bg-white/5'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {preset}m
              </motion.button>
            ))}
          </div>

          {/* Custom Duration Input */}
          <form onSubmit={handleCustomSubmit} className="flex gap-2">
            <Input
              type="number"
              min="1"
              max="120"
              value={customDuration}
              onChange={(e) => setCustomDuration(e.target.value)}
              placeholder="Custom (1-120)"
              className={cn(
                "h-10",
                isCustom && "ring-2 ring-offset-2",
                isCustom && bgColorClass.replace('bg-', 'ring-')
              )}
            />
            <Button
              type="submit"
              variant="outline"
              className={cn(
                "h-10 px-4",
                isCustom && bgColorClass,
                isCustom && "text-white border-0"
              )}
            >
              Set
            </Button>
          </form>

          {/* Endless Mode Toggle */}
          <div className={cn(
            "flex items-center justify-between p-4 rounded-lg",
            "bg-gray-50/50 dark:bg-white/5",
            "hover:shadow-[0_0_0_1px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.1)]",
            "transition-all"
          )}>
            <span className="text-sm font-medium">Endless Session</span>
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

          {/* Start Button */}
          <Button
            className={cn(
              "h-10 font-medium transition-all",
              bgColorClass,
              "hover:opacity-90 text-white"
            )}
            onClick={handleNext}
            disabled={!isEndless && selectedPreset === null && !isCustom}
          >
            Start Session
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 