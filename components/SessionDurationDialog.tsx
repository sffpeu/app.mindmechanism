import React, { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer, ChevronRight, InfinityIcon, X, Check, ArrowLeft, PenLine, Search, Tag, ThumbsUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { clockSettings } from '@/lib/clockSettings'
import { GlossaryWord } from '@/types/Glossary'
import { getClockWords } from '@/lib/glossary'

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
  const [words, setWords] = useState<string[]>([])
  const [glossaryWords, setGlossaryWords] = useState<GlossaryWord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)

  const textColorClass = clockColor?.split(' ')?.[0] || 'text-gray-500'
  const bgColorClass = clockColor?.split(' ')?.[1] || 'bg-gray-500'

  useEffect(() => {
    if (step === 'words') {
      loadGlossaryWords()
    }
  }, [step])

  useEffect(() => {
    if (step === 'words') {
      const focusNodesCount = clockSettings[clockId]?.focusNodes || 0
      setWords(Array(focusNodesCount).fill(''))
    }
  }, [step, clockId])

  const loadGlossaryWords = async () => {
    try {
      console.log('Loading glossary words...')
      const words = await getClockWords()
      console.log(`Loaded ${words.length} words`)
      setGlossaryWords(words)
    } catch (error) {
      console.error('Error loading glossary words:', error)
    }
  }

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

  const handleStepClick = (newStep: Step) => {
    if (newStep === 'duration' || 
        (newStep === 'words' && step !== 'duration') || 
        (newStep === 'confirm' && step === 'confirm')) {
      setStep(newStep)
    }
  }

  const renderStepIndicator = () => (
    <div className="absolute top-0 left-0 right-0 flex justify-center">
      <div className="flex items-center gap-1 py-2 px-3 rounded-full bg-gray-100/80 dark:bg-white/5 backdrop-blur-sm">
        {(['duration', 'words', 'confirm'] as Step[]).map((s, index) => (
          <React.Fragment key={s}>
            <button
              onClick={() => handleStepClick(s)}
              className={cn(
                "w-2 h-2 rounded-full transition-all hover:scale-125",
                step === s ? bgColorClass : 'bg-gray-300 dark:bg-gray-700',
                s === 'words' && step === 'duration' && 'cursor-not-allowed opacity-50',
                s === 'confirm' && step !== 'confirm' && 'cursor-not-allowed opacity-50'
              )}
              disabled={
                (s === 'words' && step === 'duration') ||
                (s === 'confirm' && step !== 'confirm')
              }
              aria-label={`Go to ${s} step`}
            />
            {index < 2 && (
              <div className="w-12 h-[1px] bg-gray-200 dark:bg-gray-700" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )

  const filteredWords = useMemo(() => {
    let filtered = glossaryWords

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(word => 
        word.word.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply letter filter
    if (selectedLetter && selectedLetter !== 'All') {
      filtered = filtered.filter(word => 
        word.word.toLowerCase().startsWith(selectedLetter.toLowerCase())
      )
    }

    // Apply rating filter
    if (selectedFilter !== 'All') {
      filtered = filtered.filter(word => {
        switch (selectedFilter) {
          case 'Positive':
            return word.rating === '+'
          case 'Neutral': 
            return word.rating === '~'
          case 'Negative':
            return word.rating === '-'
          default:
            return true
        }
      })
    }

    return filtered
  }, [glossaryWords, searchQuery, selectedLetter, selectedFilter])

  const handleFilterClick = (filter: string) => {
    setSelectedFilter(filter)
    setSelectedLetter('All') // Reset letter when filter changes
  }

  const handleLetterClick = (letter: string) => {
    setSelectedLetter(letter)
    setSelectedFilter('All') // Reset filter when letter changes
  }

  const renderWordsStep = () => {
    const focusNodesCount = clockSettings[clockId]?.focusNodes || 0
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

    return (
      <div className="grid grid-cols-[300px_1fr] gap-6 h-[700px]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold">Focus Nodes</h3>
            <p className="text-sm text-muted-foreground">
              {focusNodesCount} nodes to assign words to
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: focusNodesCount }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "aspect-square rounded-full flex items-center justify-center text-sm font-medium",
                  "bg-background hover:bg-accent transition-colors",
                  "dark:bg-secondary"
                )}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold">Word Selection</h3>
            <p className="text-sm text-muted-foreground">
              {filteredWords.length} words available
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Search words..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-background border"
            />

            <div className="flex gap-2 overflow-x-auto pb-2">
              {['All', 'Positive', 'Neutral', 'Negative'].map(filter => (
                <button
                  key={filter}
                  onClick={() => handleFilterClick(filter)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm transition-all shrink-0",
                    selectedFilter === filter
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="flex gap-1 overflow-x-auto pb-2">
              <button
                onClick={() => handleLetterClick('All')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm transition-all shrink-0",
                  selectedLetter === 'All'
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                )}
              >
                All
              </button>
              {alphabet.map(letter => (
                <button
                  key={letter}
                  onClick={() => handleLetterClick(letter)}
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all shrink-0",
                    selectedLetter === letter
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80"
                  )}
                >
                  {letter}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 overflow-y-auto">
              {filteredWords.map((word) => (
                <div
                  key={word.id}
                  className="p-3 rounded-lg bg-background border hover:border-primary transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{word.word}</span>
                    <div className="flex gap-1">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-xs font-medium",
                        "bg-secondary"
                      )}>
                        {word.grade}
                      </span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-xs font-medium",
                        word.rating === '+' && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
                        word.rating === '~' && "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
                        word.rating === '-' && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      )}>
                        {word.rating}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "bg-white dark:bg-black border-white/20 dark:border-white/10",
        step === 'words' ? "sm:max-w-[1200px] sm:h-[800px]" : "sm:max-w-[800px]",
        step === 'duration' && "sm:h-[500px]",
        step === 'confirm' && "sm:h-[500px]"
      )}>
        <div className={cn(
          "relative w-full h-full flex flex-col max-h-[800px]",
          step === 'duration' && "justify-center"
        )}>
          {/* Step indicator */}
          {renderStepIndicator()}

          {/* Top Navigation */}
          <div className="absolute right-6 top-4 flex items-center gap-2">
            {step !== 'duration' && (
              <button
                onClick={handleBack}
                className="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center justify-center group"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4 text-black/70 dark:text-white/70 group-hover:-translate-x-0.5 transition-transform" />
              </button>
            )}
            {step !== 'confirm' && (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={cn(
                  "h-8 px-4 rounded-full flex items-center text-sm font-medium transition-all",
                  bgColorClass,
                  "text-white hover:opacity-90 disabled:opacity-50",
                  "disabled:cursor-not-allowed"
                )}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            )}
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center justify-center"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4 text-black/70 dark:text-white/70" />
            </button>
          </div>

          {/* Header */}
          <div className="absolute left-6 top-4 flex items-center">
            {step === 'duration' && <Timer className="w-4 h-4 mr-2 text-black/70 dark:text-white/70" />}
            {step === 'words' && <PenLine className="w-4 h-4 mr-2 text-black/70 dark:text-white/70" />}
            {step === 'confirm' && <Check className="w-4 h-4 mr-2 text-black/70 dark:text-white/70" />}
            <h2 className="text-base font-medium text-black/90 dark:text-white/90">
              {step === 'duration' && 'Set Duration'}
              {step === 'words' && 'Assign Words'}
              {step === 'confirm' && 'Confirm Session'}
            </h2>
          </div>

          {/* Main Content */}
          <div className={cn(
            "flex-1 overflow-hidden",
            step === 'duration' ? "mt-0" : "mt-14"
          )}>
            <AnimatePresence mode="wait">
              {step === 'duration' && (
                <motion.div
                  key="duration"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="w-full h-full flex items-center justify-center px-6"
                >
                  <div className="w-full grid grid-cols-[1fr_1fr] gap-8 bg-white dark:bg-black rounded-xl mx-auto max-w-3xl">
                    {/* Timer Visualization */}
                    <div className="flex items-center justify-center py-8">
                      <div className="relative w-[220px] h-[220px]">
                        {/* Background circle */}
                        <div className="absolute inset-0 rounded-full border border-gray-200 dark:border-gray-800" />
                        
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
                    <div className="flex flex-col gap-3 py-8">
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
                                : 'bg-gray-50/80 dark:bg-white/5 hover:bg-gray-100/80 dark:hover:bg-white/10'
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
                              "border-gray-200 dark:border-gray-800",
                              "hover:border-gray-300 dark:hover:border-gray-700",
                              isCustom && isCustomConfirmed && "ring-1",
                              isCustom && isCustomConfirmed && bgColorClass.replace('bg-', 'ring-')
                            )}
                          />
                          <Button
                            type="submit"
                            className={cn(
                              "h-10 w-10 p-0",
                              isCustom && isCustomConfirmed ? `${bgColorClass} text-white` : 'bg-gray-50/80 dark:bg-white/5'
                            )}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
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
                  className="w-full px-6 py-6 bg-white dark:bg-black rounded-xl mx-auto max-w-2xl"
                >
                  <div className="max-w-md mx-auto">
                    <div className="space-y-6">
                      {/* Session Summary */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50/80 dark:bg-white/5">
                          <div>
                            <div className="text-sm font-medium">Duration</div>
                            <div className={cn("text-2xl font-medium mt-1", textColorClass)}>
                              {isEndless ? 'Endless' : `${isCustom ? customDuration : selectedPreset} minutes`}
                            </div>
                          </div>
                          <Timer className={cn("w-6 h-6", textColorClass)} />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50/80 dark:bg-white/5">
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

          {/* Footer Navigation */}
          <div className="px-6 py-3 mt-auto border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-end">
              {step === 'confirm' && (
                <Button
                  onClick={handleNext}
                  className={cn(
                    "text-white transition-all",
                    bgColorClass,
                    "hover:opacity-90"
                  )}
                >
                  Start Session
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 