import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer, ChevronRight, InfinityIcon, X, Check, ArrowLeft, PenLine } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SessionDurationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clockId: number
  clockColor: string
  onNext: (duration: number | null) => void
}

const timePresets = [15, 30, 45, 60, 120]

type Step = 'duration' | 'words' | 'confirm'

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
  const [step, setStep] = useState<Step>('duration')
  const [words, setWords] = useState<string[]>(['', '', ''])

  const textColorClass = clockColor?.split(' ')?.[0] || 'text-gray-500'
  const bgColorClass = clockColor?.split(' ')?.[1] || 'bg-gray-500'

  const calculateRotation = (minutes: number) => {
    const rotationTimes = {
      0: 11 * 60,
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
    if (step === 'duration') {
      setStep('words')
    } else if (step === 'words') {
      setStep('confirm')
    } else {
      if (isEndless) {
        onNext(null)
      } else if (isCustom && isCustomConfirmed) {
        onNext(Number(customDuration))
      } else if (selectedPreset !== null) {
        onNext(selectedPreset)
      }
      onOpenChange(false)
    }
  }

  const handleBack = () => {
    if (step === 'words') {
      setStep('duration')
    } else if (step === 'confirm') {
      setStep('words')
    }
  }

  const canProceed = () => {
    if (step === 'duration') {
      return isEndless || selectedPreset !== null || (isCustom && isCustomConfirmed)
    } else if (step === 'words') {
      return words.filter(word => word.trim() !== '').length >= 1
    }
    return true
  }

  const renderWordsStep = () => (
    <motion.div
      key="words"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full px-6"
    >
      <div className="max-w-md mx-auto">
        <div className="space-y-6">
          <div className="space-y-4">
            {words.map((word, index) => (
              <div key={index} className="space-y-2">
                <label className="text-sm font-medium">
                  Word {index + 1}
                  {index === 0 && <span className="text-red-500 ml-1">*</span>}
                </label>
                <Input
                  value={word}
                  onChange={(e) => {
                    const newWords = [...words]
                    newWords[index] = e.target.value
                    setWords(newWords)
                  }}
                  placeholder={`Enter word ${index + 1}`}
                  className={cn(
                    "h-10 text-base",
                    "border-gray-100 dark:border-gray-800",
                    "hover:border-gray-200 dark:hover:border-gray-700",
                    word.trim() !== '' && "ring-1",
                    word.trim() !== '' && bgColorClass.replace('bg-', 'ring-')
                  )}
                />
              </div>
            ))}
          </div>

          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className={cn(
              "w-full h-12 text-white text-lg transition-all",
              bgColorClass,
              "hover:opacity-90 disabled:opacity-50"
            )}
          >
            Next
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </motion.div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-black sm:max-w-[800px] border-0">
        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
          {/* Close Button */}
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute right-2 top-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="absolute left-6 top-4 flex items-center">
            {step !== 'duration' && (
              <button
                onClick={handleBack}
                className="mr-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            {step === 'duration' && <Timer className="w-4 h-4 mr-2" />}
            {step === 'words' && <PenLine className="w-4 h-4 mr-2" />}
            {step === 'confirm' && <Check className="w-4 h-4 mr-2" />}
            <h2 className="text-base font-medium">
              {step === 'duration' && 'Set Duration'}
              {step === 'words' && 'Assign Words'}
              {step === 'confirm' && 'Confirm Session'}
            </h2>
          </div>

          <div className="absolute inset-0 flex items-center">
            <AnimatePresence mode="wait">
              {step === 'duration' && (
                <motion.div
                  key="duration"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="w-full grid grid-cols-[1fr_1fr] gap-12 px-6"
                >
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
                          {/* First arc (clockwise) */}
                          <circle
                            className={cn(
                              "transition-all duration-300",
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
                          {/* Second arc (counterclockwise) */}
                          <circle
                            className={cn(
                              "transition-all duration-300",
                              hoveredPreset !== null && "filter blur-[1px]"
                            )}
                            cx="50"
                            cy="50"
                            r="48"
                            fill="none"
                            stroke={bgColorClass.split('-')[1]}
                            strokeWidth={hoveredPreset !== null ? "2" : "1.5"}
                            strokeDasharray={`${(rotationDegrees / 360) * 302} 302`}
                            transform="rotate(180 50 50)"
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
                  <div className="flex flex-col gap-4 pt-4">
                    {/* Endless Mode Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium">Endless Session</h3>
                        <p className="text-xs text-gray-400">No time limit</p>
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
                    <div className="grid grid-cols-2 gap-2">
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
                            "relative h-10 rounded-lg text-sm font-medium transition-all",
                            selectedPreset === preset 
                              ? `${bgColorClass} text-white shadow-sm` 
                              : 'bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
                          )}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-base">{preset}</span>
                            <span className="text-xs ml-0.5">min</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    {/* Custom Duration */}
                    <div>
                      <div className="text-xs text-gray-400 mb-1.5">OR CUSTOM</div>
                      <form onSubmit={handleCustomSubmit} className="flex gap-2">
                        <Input
                          type="number"
                          min="1"
                          max="120"
                          value={customDuration}
                          onChange={(e) => {
                            setCustomDuration(e.target.value)
                            setIsCustom(true)
                            setIsCustomConfirmed(false)
                          }}
                          placeholder="Enter duration"
                          className={cn(
                            "h-10 text-base",
                            "border-gray-100 dark:border-gray-800",
                            "hover:border-gray-200 dark:hover:border-gray-700",
                            isCustom && isCustomConfirmed && "ring-1",
                            isCustom && isCustomConfirmed && bgColorClass.replace('bg-', 'ring-')
                          )}
                        />
                        <Button
                          type="submit"
                          className={cn(
                            "h-10 w-10 p-0",
                            isCustom && isCustomConfirmed ? `${bgColorClass} text-white` : 'bg-gray-50 dark:bg-white/5'
                          )}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </form>
                    </div>

                    {/* Next Button */}
                    <Button
                      onClick={handleNext}
                      disabled={!canProceed()}
                      className={cn(
                        "h-10 mt-2 text-white transition-all",
                        bgColorClass,
                        "hover:opacity-90 disabled:opacity-50"
                      )}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 'words' && renderWordsStep()}

              {step === 'confirm' && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full px-6"
                >
                  <div className="max-w-md mx-auto">
                    <div className="space-y-6">
                      {/* Session Summary */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-white/5">
                          <div>
                            <div className="text-sm font-medium">Duration</div>
                            <div className={cn("text-2xl font-medium mt-1", textColorClass)}>
                              {isEndless ? 'Endless' : `${isCustom ? customDuration : selectedPreset} minutes`}
                            </div>
                          </div>
                          <Timer className={cn("w-6 h-6", textColorClass)} />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-white/5">
                          <div>
                            <div className="text-sm font-medium">Words</div>
                            <div className="space-y-1 mt-1">
                              {words.filter(word => word.trim() !== '').map((word, index) => (
                                <div key={index} className={cn("text-lg font-medium", textColorClass)}>
                                  {word}
                                </div>
                              ))}
                            </div>
                          </div>
                          <PenLine className={cn("w-6 h-6", textColorClass)} />
                        </div>
                      </div>

                      {/* Start Button */}
                      <Button
                        onClick={handleNext}
                        className={cn(
                          "w-full h-12 text-white text-lg transition-all",
                          bgColorClass,
                          "hover:opacity-90"
                        )}
                      >
                        Start Session
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 