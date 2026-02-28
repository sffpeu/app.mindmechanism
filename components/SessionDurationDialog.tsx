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

  const renderWordsStep = () => {
    const focusNodesCount = clockSettings[clockId]?.focusNodes || 0
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

    const filteredWords = glossaryWords.filter(word => {
      if (scopeFilter === 'My Words') {
        if (word.source !== 'user' || word.user_id !== user?.uid) return false
      } else if (scopeFilter === 'Default') {
        if (word.clock_id == null || word.clock_id < 0 || word.clock_id > 8) return false
        if (selectedClockId !== null && word.clock_id !== selectedClockId) return false
      }
      if (selectedSentiment !== null && word.rating !== selectedSentiment) return false
      if (selectedLetter && !word.word.toUpperCase().startsWith(selectedLetter)) return false
      if (searchQuery) {
        return word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
               word.definition.toLowerCase().includes(searchQuery.toLowerCase())
      }
      return true
    }).sort((a, b) => a.word.localeCompare(b.word))

    return (
      <div className="w-full h-[calc(100%-1rem)] px-6 overflow-hidden">
        <Motion.div
          key="words"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full h-full"
        >
        <div className="flex gap-6 h-full min-w-0">
          {/* Left: Glossary (takes remaining space, scrolls internally) */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <div className="min-w-0 bg-white dark:bg-black/40 border border-black/5 dark:border-white/10 rounded-xl overflow-hidden flex flex-col h-full backdrop-blur-lg">
              <div className="p-3 border-b border-black/5 dark:border-white/10 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search words or definitions"
                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 border border-black/5 dark:border-white/10 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search words or definitions"
                  />
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <span className="text-sm text-gray-400 dark:text-gray-500 shrink-0">{filteredWords.length} words</span>
              </div>
              {/* Scope: All | Default | My Words (match /glossary) */}
              <div className="flex flex-wrap gap-1.5">
                {(['All', 'Default', 'My Words'] as const).map(scope => (
                  <button
                    key={scope}
                    onClick={() => setScope(scope)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all shrink-0 flex items-center gap-1",
                      scopeFilter === scope
                        ? scope === 'All'
                          ? 'bg-gray-200 dark:bg-white/15 text-gray-800 dark:text-gray-100'
                          : scope === 'Default'
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200'
                          : 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-200'
                        : 'bg-white dark:bg-black/30 border border-black/5 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    )}
                  >
                    {scope === 'Default' && <Layers className="w-3.5 h-3.5 shrink-0" />}
                    {scope === 'My Words' && <UserCircle2 className="w-3.5 h-3.5 shrink-0" />}
                    {scope}
                  </button>
                ))}
              </div>
              {/* Sentiment: Positive | Neutral | Negative (match /glossary) */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: '+' as const, label: 'Positive' },
                  { value: '~' as const, label: 'Neutral' },
                  { value: '-' as const, label: 'Negative' },
                ].map(({ value, label }) => (
                  <button
                    key={label}
                    onClick={() => setSelectedSentiment(selectedSentiment === value ? null : value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all shrink-0",
                      selectedSentiment === value
                        ? value === '+'
                          ? 'bg-emerald-100 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-200 dark:ring-emerald-500/40'
                          : value === '-'
                          ? 'bg-rose-100 dark:bg-rose-500/25 text-rose-800 dark:text-rose-200 ring-1 ring-rose-200 dark:ring-rose-500/40'
                          : 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-200 ring-1 ring-slate-500/30'
                        : value === '+'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                        : value === '-'
                        ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20'
                        : 'bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-500/20'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {/* Default: clock filter (match /glossary) */}
              {scopeFilter === 'Default' && (
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedClockId(null)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all shrink-0",
                      selectedClockId === null
                        ? 'bg-gray-200 dark:bg-white/20 text-gray-800 dark:text-gray-100'
                        : 'bg-white dark:bg-black/30 border border-black/5 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    )}
                  >
                    All
                  </button>
                  {clockTitles.map((title, id) => {
                    const hex = CLOCK_HEX[id]
                    const selected = selectedClockId === id
                    return (
                      <button
                        key={id}
                        onClick={() => setSelectedClockId(selected ? null : id)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all border bg-white dark:bg-black/30 border-black/5 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-opacity-100"
                        style={selected && hex ? { borderColor: hex, color: hex } : undefined}
                        onMouseEnter={(e) => {
                          if (hex) { e.currentTarget.style.borderColor = hex; e.currentTarget.style.color = hex }
                        }}
                        onMouseLeave={(e) => {
                          if (!hex) return
                          if (selectedClockId === id) { e.currentTarget.style.borderColor = hex; e.currentTarget.style.color = hex }
                          else { e.currentTarget.style.borderColor = ''; e.currentTarget.style.color = '' }
                        }}
                      >
                        {title}
                      </button>
                    )
                  })}
                </div>
              )}
              {/* A–Z collapsible (match /glossary) */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowAzFilter(!showAzFilter)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all",
                    showAzFilter || selectedLetter
                      ? 'bg-black/10 dark:bg-white/10 text-gray-800 dark:text-gray-200'
                      : 'bg-white dark:bg-black/30 border border-black/5 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  )}
                  aria-expanded={showAzFilter}
                >
                  {showAzFilter ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  A–Z
                  {selectedLetter && <span className="text-xs opacity-80">({selectedLetter})</span>}
                </button>
                {showAzFilter && selectedLetter && (
                  <button onClick={() => setSelectedLetter(null)} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline">
                    Clear
                  </button>
                )}
              </div>
              {showAzFilter && (
                <div className="flex flex-wrap gap-1">
                  {alphabet.map(letter => (
                    <button
                      key={letter}
                      onClick={() => setSelectedLetter(selectedLetter === letter ? null : letter)}
                      className={cn(
                        "w-7 h-7 rounded flex items-center justify-center text-sm font-medium transition-all shrink-0",
                        selectedLetter === letter
                          ? 'bg-black text-white dark:bg-white dark:text-black'
                          : 'bg-white dark:bg-black/30 border border-black/5 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-black/50 text-gray-700 dark:text-gray-300'
                      )}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              )}
              </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
              <div className="grid grid-cols-2 gap-2 p-2">
                {isLoadingWords ? (
                  <div className="col-span-2 py-6 text-center text-gray-500 dark:text-gray-400">Loading words...</div>
                ) : loadError ? (
                  <div className="col-span-2 py-6 text-center">
                    <p className="text-amber-500 dark:text-amber-400">{loadError}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Please try again later</p>
                  </div>
                ) : filteredWords.length === 0 ? (
                  <div className="col-span-2 py-6 text-center text-gray-500 dark:text-gray-400">No words found. Try adjusting filters or search.</div>
                ) : (
                  filteredWords.map((word) => {
                    const isAssigned = words.includes(word.word)
                    const canAssign = isAssigned || words.filter(w => w).length < focusNodesCount
                    return (
                      <button
                        key={word.id}
                        onClick={() => {
                          if (isAssigned) {
                            const idx = words.indexOf(word.word)
                            if (idx >= 0) {
                              const newWords = [...words]
                              newWords[idx] = ''
                              setWords(newWords)
                            }
                          } else if (canAssign) {
                            const emptyIdx = words.findIndex(w => !w)
                            if (emptyIdx >= 0) {
                              const newWords = [...words]
                              newWords[emptyIdx] = word.word
                              setWords(newWords)
                            }
                          }
                        }}
                        disabled={!canAssign && !isAssigned}
                        className={cn(
                          "p-3 rounded-lg text-left transition-all border",
                          isAssigned
                            ? 'border-black/20 dark:border-white/30 ring-2 ring-black/10 dark:ring-white/20 bg-gray-50 dark:bg-white/5'
                            : 'bg-white dark:bg-black/40 border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20',
                          !canAssign && !isAssigned && 'opacity-60 cursor-not-allowed'
                        )}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-black dark:text-white truncate">{word.word}</h3>
                            {word.phonetic_spelling && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 block">{word.phonetic_spelling}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium",
                              word.rating === '+' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                              word.rating === '-' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                              'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            )}>
                              {word.grade}
                            </div>
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium",
                              word.rating === '+' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                              word.rating === '-' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                              'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            )}>
                              {word.rating}
                            </div>
                            {word.source === 'user' ? (
                              <UserCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            ) : (
                              <div
                                className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium", getDefaultIconStyle(word.clock_id) ? '' : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300')}
                                style={getDefaultIconStyle(word.clock_id) ?? undefined}
                              >
                                D
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 line-clamp-2">{word.definition}</p>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right: Clock - fixed width, always visible regardless of glossary */}
          <div className="flex-shrink-0 w-[360px] flex flex-col items-center justify-center gap-4">
            <div className="relative w-[280px] h-[280px]">
              <div className="absolute inset-0 rounded-full border border-gray-200 dark:border-gray-800" />
              <div className="absolute inset-[8%] rounded-full border border-gray-100 dark:border-gray-900" />
              {Array.from({ length: focusNodesCount }).map((_, index) => {
                const angle = ((360 / focusNodesCount) * index - 90) * (Math.PI / 180)
                const radius = 42
                const x = 50 + radius * Math.cos(angle)
                const y = 50 + radius * Math.sin(angle)
                return (
                  <Motion.button
                    key={index}
                    type="button"
                    className="absolute focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 rounded-full"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    onClick={() => {
                      if (words[index]) {
                        const newWords = [...words]
                        newWords[index] = ''
                        setWords(newWords)
                      }
                    }}
                    aria-label={words[index] ? `Clear ${words[index]}` : `Slot ${index + 1}`}
                  >
                    <div className={cn(
                      "relative w-10 h-10 rounded-full flex items-center justify-center shadow-sm",
                      bgColorClass,
                      words[index] ? 'opacity-100 ring-2 ring-white/30 dark:ring-black/20' : 'opacity-60'
                    )}>
                      <span className="text-xs font-semibold text-white">{index + 1}</span>
                    </div>
                    {words[index] && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-20 text-center pointer-events-none">
                        <span className="text-[10px] font-medium text-black/80 dark:text-white/80 truncate block">
                          {words[index]}
                        </span>
                      </div>
                    )}
                  </Motion.button>
                )
              })}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {words.filter(w => w).length} of {focusNodesCount} — click node to clear
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRandomWords}
                disabled={words.every(word => word.trim() !== '')}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center transition-all",
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
                  "w-9 h-9 rounded-full flex items-center justify-center transition-all font-bold text-xs",
                  words.every(word => word.trim() !== '')
                    ? "bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                    : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                )}
                aria-label="Fill empty slots with default words"
              >
                D
              </button>
              <button
                onClick={handleResetAllWords}
                disabled={words.every(word => !word)}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                  words.every(word => !word)
                    ? "bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                    : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                )}
                aria-label="Reset all words"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        </Motion.div>
      </div>
    )
  }

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