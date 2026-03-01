import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { Timer, ChevronRight, InfinityIcon, X, Check, ArrowLeft, PenLine, Search, Shuffle, Trash2, Layers, UserCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { clockSettings } from '@/lib/clockSettings'
import { GlossaryWord } from '@/types/Glossary'
import { getAllWords } from '@/lib/glossary'
import { clockTitles } from '@/lib/clockTitles'
import { useSoundEffects } from '@/lib/sounds'
import { useRouter } from 'next/navigation'
import { createSession } from '@/lib/sessions'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { testWords } from '@/lib/testWords'

interface SessionDurationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clockId: number
  clockColor: string
  onNext: (duration: number | null, words: string[]) => void
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
  const { user } = useAuth()
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
  const [scopeFilter, setScopeFilter] = useState<'All' | 'Default' | 'My Words'>('Default')
  const [selectedSentiment, setSelectedSentiment] = useState<'+' | '~' | '-' | null>(null)
  const [selectedClockId, setSelectedClockId] = useState<number | null>(null)
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [showAzFilter, setShowAzFilter] = useState(false)
  const [hoveredWord, setHoveredWord] = useState<string | null>(null)
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false)
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null)
  const { playClick } = useSoundEffects()
  const [hasInteracted, setHasInteracted] = useState(false)
  const router = useRouter()
  const [isLoadingWords, setIsLoadingWords] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const textColorClass = clockColor?.split(' ')?.[0] || 'text-gray-500'
  const bgColorClass = clockColor?.split(' ')?.[1] || 'bg-gray-500'

  const presets = [5, 10, 15, 20, 25, 30]

  useEffect(() => {
    if (!open) {
      setHasInteracted(false)
    }
  }, [open])

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

  useEffect(() => {
    if (open) {
      playClick()
    }
  }, [open, playClick])

  const loadGlossaryWords = async () => {
    try {
      setIsLoadingWords(true)
      setLoadError(null)
      const words = await getAllWords()
      if (!words || words.length === 0) {
        console.log('No words found in glossary')
        setLoadError('No words found in the glossary. Please try again later.')
        setGlossaryWords([])
      } else {
        setGlossaryWords(words)
      }
    } catch (error) {
      console.error('Error loading glossary words:', error)
      setLoadError('Failed to load words. Please try again later.')
      setGlossaryWords([])
    } finally {
      setIsLoadingWords(false)
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

  const handlePresetClick = (preset: number) => {
    playClick()
    setSelectedPreset(preset)
    setIsCustom(false)
    setIsCustomConfirmed(false)
    setIsEndless(false)
    setHasInteracted(true)
  }

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (customDuration && parseInt(customDuration) > 0) {
      setIsCustomConfirmed(true)
      setSelectedPreset(null)
      setIsEndless(false)
      setHasInteracted(true)
    }
  }

  const handleEndlessToggle = (checked: boolean) => {
    setIsEndless(checked)
    if (checked) {
      setSelectedPreset(null)
      setIsCustom(false)
      setIsCustomConfirmed(false)
    }
    setHasInteracted(true)
  }

  const handleNext = () => {
    playClick()
    if (step === 'duration') {
      setStep('words')
    } else if (step === 'words') {
      // Only proceed if at least one word is selected
      const selectedWords = words.filter(word => word.trim() !== '')
      
      if (selectedWords.length === 0) {
        // If no words are selected, show an error message
        setLoadError('Please select at least one word to continue.')
        return
      }
      
      onNext(
        isEndless ? null : (isCustom ? parseInt(customDuration) : selectedPreset),
        selectedWords
      )
      onOpenChange(false)
    }
  }

  const handleBack = () => {
    playClick()
    if (step === 'words') {
      setStep('duration')
    }
  }

  const canProceed = () => {
    if (step === 'duration') {
      return isEndless || selectedPreset !== null || (isCustom && isCustomConfirmed)
    } else if (step === 'words') {
      const hasAnyWord = words.some(word => word.trim() !== '')
      return hasAnyWord
    }
    return true
  }

  const handleStepClick = (newStep: Step) => {
    if (newStep === 'duration' || 
        (newStep === 'words' && step === 'words')) {
      setStep(newStep)
    }
  }

  const handleRandomWords = () => {
    const availableWords = glossaryWords.filter(word => !words.includes(word.word))
    if (availableWords.length === 0) return

    const emptySlots = words.map((word, index) => word ? null : index).filter(index => index !== null) as number[]
    if (emptySlots.length === 0) return

    const newWords = [...words]
    emptySlots.forEach(slotIndex => {
      const randomIndex = Math.floor(Math.random() * availableWords.length)
      const randomWord = availableWords[randomIndex]
      if (randomWord) {
        newWords[slotIndex] = randomWord.word
        availableWords.splice(randomIndex, 1)
      }
    })
    setWords(newWords)
  }

  const handleRandomDefaultWords = () => {
    // Default = words belonging to a clock (ROOT, SACROL, …); exclude words with no clock_id
    const defaultWords = glossaryWords.filter(word => word.clock_id != null && word.clock_id >= 0 && word.clock_id <= 8);
    if (defaultWords.length === 0) return;

    // Define themes for each clock
    const clockThemes = {
      0: ["achievement", "will", "vital", "bold", "insight", "command", "reflect", "illusion"],
      1: ["union", "sturdy", "insight", "modest", "surprise", "joy"],
      2: ["rampant", "cause", "salvage", "roar", "aim", "rebirth", "exuberant", "urge"],
      3: ["balance", "submerge", "attract", "curious", "collide", "concern", "fate", "life", "protect", "triumph"],
      4: ["resonate", "immerse", "righteous", "compel", "yearn", "adapt", "foster", "flaunt", "transform", "repair"],
      5: ["child", "unveil", "flight", "premonition"],
      6: ["seek", "ideal", "surrender", "bliss", "spontaneous", "discourse", "empathy", "righteous", "prayer", "majesty"],
      7: ["infinity", "love", "vibrate", "center", "pure", "stable", "kind", "transform", "self", "limit"],
      8: ["infinity", "love", "vibrate"]
    };

    // Get themes for current clock
    const currentThemes = clockThemes[clockId as keyof typeof clockThemes] || [];
    if (currentThemes.length === 0) return;

    // Find matching default words
    const matchingWords = defaultWords.filter(word => 
      currentThemes.some(theme => 
        word.word.toLowerCase().includes(theme) || 
        word.definition.toLowerCase().includes(theme)
      )
    );

    const emptySlots = words.map((word, index) => word ? null : index).filter(index => index !== null) as number[];
    if (emptySlots.length === 0) return;

    const newWords = [...words];
    emptySlots.forEach((slotIndex, index) => {
      if (index < matchingWords.length) {
        newWords[slotIndex] = matchingWords[index].word;
      }
    });
    setWords(newWords);
  };

  const handleResetAllWords = () => {
    setWords(Array(words.length).fill(''))
  }

  const handleWordSelect = (word: GlossaryWord) => {
    if (selectedWordIndex !== null) {
      const newWords = [...words]
      newWords[selectedWordIndex] = word.word
      setWords(newWords)
      setIsGlossaryOpen(false)
      setSelectedWordIndex(null)
      setSearchQuery('')
    }
  }

  const handleRandomize = () => {
    if (glossaryWords.length === 0) return

    const newWords = words.map(() => {
      const randomIndex = Math.floor(Math.random() * glossaryWords.length)
      return glossaryWords[randomIndex].word
    })
    setWords(newWords)
  }

  const renderStepIndicator = () => (
    <div className="absolute top-0 left-0 right-0 flex justify-center">
      <div className="flex items-center gap-1 py-2 px-3 rounded-full bg-gray-100/80 dark:bg-white/5 backdrop-blur-sm">
        {(['duration', 'words'] as Step[]).map((s, index) => (
          <React.Fragment key={s}>
            <button
              onClick={() => handleStepClick(s)}
              className={cn(
                "w-2 h-2 rounded-full transition-all hover:scale-125",
                step === s ? bgColorClass : 'bg-gray-300 dark:bg-gray-700',
                s === 'words' && step === 'duration' && 'cursor-not-allowed opacity-50'
              )}
              disabled={s === 'words' && step === 'duration'}
              aria-label={`Go to ${s} step`}
            />
            {index < 1 && (
              <div className="w-12 h-[1px] bg-gray-200 dark:bg-gray-700" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )

  // Clock colors for glossary sync (match /glossary page)
  const CLOCK_HEX = ['#fd290a', '#fba63b', '#f7da5f', '#6dc037', '#156fde', '#941952', '#541b96', '#ee5fa7', '#56c1ff']
  const getDefaultIconStyle = (clockId: number | undefined) => {
    if (clockId == null || clockId < 0 || clockId >= CLOCK_HEX.length) return undefined
    const hex = CLOCK_HEX[clockId]
    return { backgroundColor: `${hex}20`, color: hex }
  }

  const setScope = (scope: 'All' | 'Default' | 'My Words') => {
    if (scope !== 'Default') setSelectedClockId(null)
    setScopeFilter(scope)
  }

  const renderWordsStep = () => (
    <div className="w-full h-[calc(100%-1rem)] px-6 overflow-hidden">
      <Motion.div
        key="words"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="w-full h-full"
      />
    </div>
  )

  const handleDurationSelected = async (duration: number | null, words: string[]) => {
    if (clockId !== null && duration !== null && user?.uid) {
      try {
        // Convert minutes to milliseconds
        const durationMs = duration * 60 * 1000;
        
        // Create a new session
        const session = await createSession({
          user_id: user.uid,
          clock_id: clockId,
          duration: durationMs,
          words: words,
          moon_phase: '',
          moon_illumination: 0,
          moon_rise: '',
          moon_set: '',
          weather_condition: '',
          temperature: 0,
          humidity: 0,
          uv_index: 0,
          pressure: 0,
          wind_speed: 0,
          city: '',
          country: '',
          elevation: 0,
          sea_level: 0,
          latitude: 0,
          longitude: 0,
          progress: 0
        });

        // Navigate to the new page structure with the session ID
        const encodedWords = encodeURIComponent(JSON.stringify(words));
        router.push(`/${clockId}?duration=${durationMs}&words=${encodedWords}&sessionId=${session.id}`);
      } catch (error) {
        console.error('Error creating session:', error);
        // Still navigate to the page even if session creation fails
        const durationMs = duration * 60 * 1000;
        const encodedWords = encodeURIComponent(JSON.stringify(words));
        router.push(`/${clockId}?duration=${durationMs}&words=${encodedWords}`);
      }
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "bg-white dark:bg-black border-white/20 dark:border-white/10 overflow-hidden",
        step === 'words' ? "max-w-[95vw] w-[1560px] h-[90vh] max-h-[1040px]" : "sm:max-w-[800px]",
        step === 'duration' && "sm:h-[500px]",
        step === 'confirm' && "sm:h-[500px]"
      )}>
        <DialogTitle className="sr-only">
          {step === 'duration' && 'Set Session Duration'}
          {step === 'words' && 'Assign Words'}
          {step === 'confirm' && 'Confirm Session'}
        </DialogTitle>
        <div className={cn(
          "relative w-full h-full flex flex-col",
          step === 'duration' && "justify-center"
        )}>
          {/* Step indicator - Moved inside the dialog */}
          <div className="relative pt-2">
            {renderStepIndicator()}
          </div>

          {/* Top Navigation - Fixed positioning */}
          <div className="absolute right-6 top-4 flex items-center gap-2 z-10">
            {step !== 'duration' && (
              <button
                onClick={handleBack}
                className="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center justify-center group"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4 text-black/70 dark:text-white group-hover:-translate-x-0.5 transition-transform" />
              </button>
            )}
            {step === 'words' ? (
              <div className="flex items-center gap-2">
                {words.some(word => word.trim() !== '') ? (
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
                    Start
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleNext}
                      disabled={!canProceed()}
                      className={cn(
                        "h-8 px-4 rounded-full flex items-center text-sm font-medium transition-all",
                        "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400",
                        "hover:bg-gray-100 dark:hover:bg-white/10",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      Skip
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                    <button
                      className={cn(
                        "h-8 px-4 rounded-full flex items-center text-sm font-medium transition-all",
                        bgColorClass,
                        "text-white hover:opacity-90"
                      )}
                    >
                      {clockSettings[clockId]?.focusNodes || 0} words required
                    </button>
                  </>
                )}
              </div>
            ) : step === 'duration' && (
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
              <X className="w-4 h-4 text-black/70 dark:text-white" />
            </button>
          </div>

          {/* Header - Fixed positioning */}
          <div className="absolute left-6 top-4 flex items-center z-10">
            {step === 'duration' && <Timer className="w-4 h-4 mr-2 text-black/70 dark:text-white" />}
            {step === 'words' && <PenLine className="w-4 h-4 mr-2 text-black/70 dark:text-white" />}
            {step === 'confirm' && <Check className="w-4 h-4 mr-2 text-black/70 dark:text-white" />}
            <h2 className="text-base font-medium text-black/90 dark:text-white">
              {step === 'duration' && 'Set Duration'}
              {step === 'words' && 'Assign Words'}
              {step === 'confirm' && 'Confirm Session'}
            </h2>
          </div>

          {/* Main Content - Adjusted padding and overflow */}
          <div className={cn(
            "flex-1 overflow-hidden",
            step === 'duration' ? "mt-4" : "mt-14"
          )}>
            <AnimatePresence mode="wait">
              {step === 'duration' && (
                <Motion.div
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
                            <Motion.div
                              key={isEndless ? 'endless' : 'timed'}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="flex flex-col items-center"
                            >
                              {isEndless ? (
                                <div className="opacity-20 dark:opacity-40">
                                  <InfinityIcon className="w-12 h-12 dark:text-white" />
                                </div>
                              ) : (
                                <>
                                  <span className={cn("text-4xl font-light", textColorClass)}>
                                    {isEndless ? '∞' : `${rotationDegrees.toFixed(0)}°`}
                                  </span>
                                  <span className="text-sm text-gray-400 dark:text-gray-300 mt-1">
                                    {isEndless ? 'Endless' : (isCustom ? customDuration : (selectedPreset || hoveredPreset || 0)) + 'min'}
                                  </span>
                                </>
                              )}
                            </Motion.div>
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col gap-3 py-8">
                      {/* Endless Mode Toggle */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-black dark:text-white">Endless Session</h3>
                          <p className="text-xs text-gray-400 dark:text-gray-300">No time limit</p>
                        </div>
                        <Switch
                          checked={isEndless}
                          onCheckedChange={handleEndlessToggle}
                          className={isEndless ? bgColorClass : ''}
                        />
                      </div>

                      {/* Time Presets */}
                      <div className="grid grid-cols-2 gap-2">
                        {timePresets.map((preset) => (
                          <Motion.button
                            key={preset}
                            onClick={() => handlePresetClick(preset)}
                            onHoverStart={() => setHoveredPreset(preset)}
                            onHoverEnd={() => setHoveredPreset(null)}
                            className={cn(
                              "relative h-10 rounded-lg text-sm font-medium transition-all",
                              selectedPreset === preset
                                ? `${bgColorClass} text-white shadow-sm` 
                                : 'bg-gray-50/80 dark:bg-white/5 text-black dark:text-white hover:bg-gray-100/80 dark:hover:bg-white/10'
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-base">{preset}</span>
                              <span className="text-xs ml-0.5">min</span>
                            </div>
                          </Motion.button>
                        ))}
                      </div>

                      {/* Custom Duration */}
                      <div>
                        <div className="text-xs text-gray-400 dark:text-gray-300 mb-1.5">OR CUSTOM</div>
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
                              "border-gray-200 dark:border-gray-800 dark:text-white dark:bg-black",
                              "hover:border-gray-300 dark:hover:border-gray-700",
                              "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                              isCustom && isCustomConfirmed && "ring-1",
                              isCustom && isCustomConfirmed && bgColorClass.replace('bg-', 'ring-')
                            )}
                          />
                          <Button
                            type="submit"
                            className={cn(
                              "h-10 w-10 p-0",
                              isCustom && isCustomConfirmed 
                                ? `${bgColorClass} text-white` 
                                : 'bg-gray-50/80 dark:bg-white/5 text-black dark:text-white hover:bg-gray-100/80 dark:hover:bg-white/10'
                            )}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  </div>
                </Motion.div>
              )}

              {step === 'words' && (
                <>
                  {renderWordsStep()}
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
} 