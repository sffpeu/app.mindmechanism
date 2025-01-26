import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, InfinityIcon } from 'lucide-react'

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

  // Calculate rotation based on duration (assuming 60 minutes = 360 degrees)
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
      <DialogContent className="bg-white dark:bg-black border-0 p-0 max-w-md mx-auto overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-black/5 dark:border-white/10">
          <h2 className="text-xl font-medium text-gray-900 dark:text-white">
            Session Duration
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Timer Display */}
          <div className="flex justify-center">
            <motion.div 
              className="relative w-32 h-32 flex items-center justify-center rounded-full"
              style={{
                background: 'linear-gradient(to right, rgba(0,0,0,0.03), rgba(0,0,0,0.05))',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div 
                  key={isEndless ? 'endless' : 'timed'}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {isEndless ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <InfinityIcon className={`w-12 h-12 ${textColorClass}`} />
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className={`text-2xl font-medium ${textColorClass}`}>
                        {isCustom ? customDuration : (selectedPreset || hoveredPreset || 0)}m
                      </span>
                      <span className={`text-sm mt-1 ${textColorClass}`}>
                        {rotationDegrees.toFixed(0)}° rotation
                      </span>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
              
              {!isEndless && (
                <motion.div 
                  className={`absolute inset-0 rounded-full ${bgColorClass}`}
                  style={{
                    clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%)',
                    opacity: 0.1,
                  }}
                  animate={{
                    rotate: rotationDegrees
                  }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.div>
          </div>

          {/* Time Presets */}
          <div className="grid grid-cols-3 gap-2">
            {timePresets.map((preset) => (
              <motion.button
                key={preset}
                onClick={() => {
                  setSelectedPreset(preset)
                  setIsCustom(false)
                }}
                onHoverStart={() => setHoveredPreset(preset)}
                onHoverEnd={() => setHoveredPreset(null)}
                className={`relative h-12 rounded-lg font-medium transition-all overflow-hidden
                  ${selectedPreset === preset 
                    ? `${bgColorClass} text-white` 
                    : 'bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
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
              placeholder="Custom duration (1-120)"
              className="flex-1 h-12"
            />
            <Button
              type="submit"
              variant="outline"
              className={`h-12 px-6 ${
                isCustom ? `${bgColorClass} text-white` : ''
              }`}
            >
              Set
            </Button>
          </form>

          {/* Endless Mode Toggle */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-white/5 p-4 rounded-lg">
            <span className="text-sm font-medium">Endless Mode</span>
            <Switch
              checked={isEndless}
              onCheckedChange={setIsEndless}
              className={`${isEndless ? bgColorClass : ''}`}
            />
          </div>
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