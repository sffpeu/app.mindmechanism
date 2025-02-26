import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer, ChevronRight, InfinityIcon, X, Check, ArrowLeft, PenLine, Search, Tag, ThumbsUp, Shuffle, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { clockSettings } from '@/lib/clockSettings'
import { GlossaryWord } from '@/types/Glossary'
import { getClockWords } from '@/lib/glossary'
import { supabase } from '@/lib/supabase'
import { HintPopup } from '@/components/ui/hint-popup'
import { defaultClockWords } from '@/lib/defaultWords'

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
  const [hoveredWord, setHoveredWord] = useState<string | null>(null)
  const [showDurationHint, setShowDurationHint] = useState(false)
  const [showWordsHint, setShowWordsHint] = useState(false)

  const textColorClass = clockColor?.split(' ')?.[0] || 'text-gray-500'
  const bgColorClass = clockColor?.split(' ')?.[1] || 'bg-gray-500'

  useEffect(() => {
    if (step === 'duration') {
      const hasSeenDurationHint = localStorage.getItem('hasSeenDurationHint')
      if (!hasSeenDurationHint) {
        setShowDurationHint(true)
      }
    } else if (step === 'words') {
      const hasSeenWordsHint = localStorage.getItem('hasSeenWordsHint')
      if (!hasSeenWordsHint) {
        setShowWordsHint(true)
      }
    }
  }, [step])

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
      const { data, error } = await supabase
        .from('glossary')
        .select('*')
        .order('word')

      if (error) {
        console.error('Error loading glossary words:', error)
        return
      }
      setGlossaryWords(data || [])
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
      const hasAnyWord = words.some(word => word.trim() !== '')
      if (!hasAnyWord) {
        setWords(Array(words.length).fill(''))
      }
      if (isEndless) {
        onNext(null, words)
      } else if (isCustom && isCustomConfirmed) {
        onNext(Number(customDuration), words)
      } else if (selectedPreset !== null) {
        onNext(selectedPreset, words)
      }
      onOpenChange(false)
    }
  }

  const handleBack = () => {
    if (step === 'words') {
      setStep('duration')
    }
  }

  const canProceed = () => {
    if (step === 'duration') {
      return isEndless || selectedPreset !== null || (isCustom && isCustomConfirmed)
    } else if (step === 'words') {
      const hasAnyWord = words.some(word => word.trim() !== '')
      return !hasAnyWord || words.every(word => word.trim() !== '')
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
    // Themes for each clock
    const clockThemes = {
      0: ["Achievement", "Willingness", "Vitality", "Boldness", "Insight", "Command", "Reflection", "Illusion"],
      1: ["Union", "Sturdiness", "Insight", "Modesty", "Surprise", "Joy"],
      2: ["Rampant", "Cause", "Salvage", "Roar", "Aim", "Rebirth", "Exuberance", "Urge"],
      3: ["Balance", "Submerge", "Attract", "Curiosity", "Collide", "Concern", "Fate", "Life", "Protect", "Triumph"],
      4: ["Resonate", "Immerse", "Righteous", "Compulsion", "Yearn", "Adapt", "Foster", "Flaunt", "Beguile", "Repair", "Transform", "Suspend"],
      5: ["Child", "Unveil", "Flight", "Premonition"],
      6: ["Seek", "Ideal", "Surrender", "Bliss", "Spontaneous", "Discourse", "Empathy", "Prayer", "Praise", "Libation", "Atone", "Ceremony"],
      7: ["Infinity", "Love", "Vibrate", "Center", "Pure", "Stable", "Kind", "Transform", "Self", "Being", "Limitless", "Sensual", "Effort"],
      8: ["Infinity", "Love", "Vibrate"]
    };

    const themes = clockThemes[clockId] || [];
    if (themes.length === 0) return;

    // Filter glossary words that match our themes and are marked as default
    const matchingWords = glossaryWords.filter(word => {
      if (word.version !== 'Default') return false;
      
      // Check if the word or its definition matches any of our themes
      return themes.some(theme => 
        word.word.toLowerCase().includes(theme.toLowerCase()) ||
        word.definition.toLowerCase().includes(theme.toLowerCase())
      );
    });

    if (matchingWords.length === 0) return;

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

  const renderWordsStep = () => {
    const focusNodesCount = clockSettings[clockId]?.focusNodes || 0
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

    const filteredWords = glossaryWords.filter(word => {
      if (searchQuery) {
        return word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
               word.definition.toLowerCase().includes(searchQuery.toLowerCase())
      }
      if (selectedFilter === 'Positive') return word.rating === '+'
      if (selectedFilter === 'Neutral') return word.rating === '~'
      if (selectedFilter === 'Negative') return word.rating === '-'
      if (selectedFilter === 'Default') return word.version === 'Default'
      if (selectedLetter) return word.word.toUpperCase().startsWith(selectedLetter)
      return true
    }).sort((a, b) => a.word.localeCompare(b.word))

    return (
      <motion.div
        key="words"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="w-full h-[calc(100%-1rem)] px-6 overflow-hidden"
      >
        <div className="grid grid-cols-[280px_1fr] gap-4 h-full">
          {/* Left side: Focus Nodes and Selected Words */}
          <div className="space-y-3 overflow-y-auto pr-2 max-h-full scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
            {/* Focus Nodes Card */}
            <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-medium text-black/90 dark:text-white/90">Focus Nodes</h3>
                <p className="text-xs text-black/60 dark:text-white/60 mt-0.5">
                  {focusNodesCount} active node{focusNodesCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="aspect-square relative">
                <div className="absolute inset-4">
                  <div className="relative w-full h-full">
                    {/* Thin ring */}
                    <div className="absolute inset-[15%] rounded-full border border-gray-100 dark:border-gray-900" />
                    
                    {/* Focus Nodes */}
                    {Array.from({ length: focusNodesCount }).map((_, index) => {
                      const angle = ((360 / focusNodesCount) * index - 90) * (Math.PI / 180)
                      const radius = 45 // Reduced radius to bring nodes closer
                      const x = 50 + radius * Math.cos(angle)
                      const y = 50 + radius * Math.sin(angle)

                      return (
                        <motion.div
                          key={index}
                          className="absolute"
                          style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                        >
                          <div className={cn(
                            "relative w-4 h-4 rounded-full flex items-center justify-center", // Reduced size from w-5 h-5
                            bgColorClass,
                            words[index] ? 'opacity-100' : 'opacity-50'
                          )}>
                            <span className="text-[8px] font-medium text-white"> {/* Reduced text size */}
                              {index + 1}
                            </span>
                            <motion.div
                              className="absolute inset-0 rounded-full bg-white/10"
                              whileHover={{ scale: 1.5 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            />
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Words */}
            <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-black/90 dark:text-white/90">Selected Words</h3>
                  <p className="text-xs text-black/60 dark:text-white/60 mt-0.5">
                    {words.filter(w => w).length} of {focusNodesCount} words selected
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRandomWords}
                    disabled={words.every(word => word.trim() !== '')}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                      words.every(word => word.trim() !== '')
                        ? "bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                        : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                    )}
                    aria-label="Fill empty slots with random words"
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleRandomDefaultWords}
                    disabled={words.every(word => word.trim() !== '')}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all font-bold text-xs",
                      words.every(word => word.trim() !== '')
                        ? "bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                        : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                    )}
                    aria-label="Fill empty slots with random default words"
                  >
                    D
                  </button>
                  <button
                    onClick={handleResetAllWords}
                    disabled={words.every(word => !word)}
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center transition-all ml-1",
                      words.every(word => !word)
                        ? "bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                        : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                    )}
                    aria-label="Reset all words"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="p-2 pb-4 space-y-2">
                {Array.from({ length: focusNodesCount }).map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "px-3 py-2 rounded-lg flex items-center gap-2",
                      words[index]
                        ? "bg-gray-50 dark:bg-white/5"
                        : "border border-dashed border-gray-200 dark:border-gray-800"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium",
                      words[index]
                        ? `${bgColorClass} text-white`
                        : "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500"
                    )}>
                      {index + 1}
                    </div>
                    {words[index] ? (
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-base font-medium text-black/90 dark:text-white/90">
                          {words[index]}
                        </span>
                        <button
                          onClick={() => {
                            const newWords = [...words]
                            newWords[index] = ''
                            setWords(newWords)
                          }}
                          className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                          aria-label={`Remove word ${words[index]}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">
                        Empty slot
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right side: Word Selection */}
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden flex flex-col max-h-full">
            <div className="p-3 border-b border-gray-200 dark:border-gray-800 space-y-2">
              {/* Search */}
              <div className="flex items-center space-x-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search words or definitions"
                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search words or definitions"
                  />
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-1.5">
                {['All', 'Default', 'Positive', 'Neutral', 'Negative'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm transition-all shrink-0",
                      selectedFilter === filter
                        ? `${bgColorClass} text-white`
                        : 'bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                    )}
                    aria-pressed={selectedFilter === filter}
                    aria-label={`Filter by ${filter} words`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Alphabet */}
              <div className="flex flex-wrap gap-1">
                {alphabet.map(letter => (
                  <button
                    key={letter}
                    onClick={() => setSelectedLetter(selectedLetter === letter ? null : letter)}
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all shrink-0",
                      selectedLetter === letter
                        ? `${bgColorClass} text-white`
                        : 'bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                    )}
                    aria-pressed={selectedLetter === letter}
                    aria-label={`Filter by letter ${letter}`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>

            {/* Word Grid */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
              <div className="grid grid-cols-3 gap-2 p-2">
                {filteredWords.length === 0 ? (
                  <div className="col-span-3 py-6 text-center text-gray-500 dark:text-gray-400">
                    No words found
                  </div>
                ) : (
                  filteredWords.map((word) => (
                    <button
                      key={word.id}
                      onClick={() => {
                        const emptyIndex = words.findIndex(w => !w)
                        if (emptyIndex !== -1) {
                          const newWords = [...words]
                          newWords[emptyIndex] = word.word
                          setWords(newWords)
                        }
                      }}
                      onMouseEnter={() => setHoveredWord(word.word)}
                      onMouseLeave={() => setHoveredWord(null)}
                      disabled={words.includes(word.word)}
                      className={cn(
                        "p-2.5 rounded-lg text-left transition-all",
                        words.includes(word.word)
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-50 dark:hover:bg-white/5",
                        "bg-white dark:bg-black border",
                        hoveredWord === word.word ? `border-2 ${textColorClass}` : "border-gray-200 dark:border-gray-800"
                      )}
                      aria-label={`Select word ${word.word}${words.includes(word.word) ? ' (already selected)' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <div>
                          <h3 className="text-sm font-medium text-black dark:text-white">
                            {word.word}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {word.phonetic_spelling}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium",
                            word.rating === '+' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                            word.rating === '-' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                            'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          )}>
                            {word.grade}
                          </div>
                          <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium",
                            word.rating === '+' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                            word.rating === '-' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                            'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          )}>
                            {word.rating}
                          </div>
                          {word.version === 'Default' && (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300">
                              D
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {word.definition}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "bg-white dark:bg-black border-white/20 dark:border-white/10 overflow-hidden",
        step === 'words' ? "sm:max-w-[1200px] sm:h-[800px]" : "sm:max-w-[800px]",
        step === 'duration' && "sm:h-[500px]",
        step === 'confirm' && "sm:h-[500px]"
      )}>
        <div className={cn(
          "relative w-full h-full flex flex-col max-h-[800px]",
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
                          <h3 className="text-sm font-medium text-black dark:text-white">Endless Session</h3>
                          <p className="text-xs text-gray-400 dark:text-gray-300">No time limit</p>
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
                                : 'bg-gray-50/80 dark:bg-white/5 text-black dark:text-white hover:bg-gray-100/80 dark:hover:bg-white/10'
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
                </motion.div>
              )}

              {step === 'words' && (
                <>
                  {renderWordsStep()}
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        <HintPopup
          title="Set Your Session Duration"
          description="Setting the right duration for your session is crucial. A focused session typically lasts between 15-60 minutes. Choose a duration that matches your energy levels and the complexity of your task."
          storageKey="hasSeenDurationHint"
          open={showDurationHint}
          onOpenChange={setShowDurationHint}
        />

        <HintPopup
          title="Assign Words to Focus Nodes"
          description="Words help you maintain focus during your session. Each focus node represents a key concept or task you want to concentrate on. You can skip this step, but assigning words can make your session more meaningful and structured."
          storageKey="hasSeenWordsHint"
          open={showWordsHint}
          onOpenChange={setShowWordsHint}
        />

      </DialogContent>
    </Dialog>
  )
} 