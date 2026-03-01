import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { Timer, ChevronRight, InfinityIcon, X, Check, ArrowLeft, PenLine, Search, Shuffle, Trash2, Layers, UserCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { clockSettings } from '@/lib/clockSettings'
import { GlossaryWord } from '@/types/Glossary'
import { getAllWords, searchWords } from '@/lib/glossary'
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

// Clock 1–9 colors (match /glossary)
const CLOCK_HEX = ['#fd290a', '#fba63b', '#f7da5f', '#6dc037', '#156fde', '#941952', '#541b96', '#ee5fa7', '#56c1ff']

const getDefaultIconStyle = (clockId: number | undefined) => {
  if (clockId == null || clockId < 0 || clockId >= CLOCK_HEX.length) return undefined
  const hex = CLOCK_HEX[clockId]
  return { backgroundColor: `${hex}20`, color: hex }
}

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
  const [scopeFilter, setScopeFilter] = useState<'All' | 'Default' | 'My Words'>('All')
  const [selectedSentiment, setSelectedSentiment] = useState<'+' | '~' | '-' | null>(null)
  const [selectedClockId, setSelectedClockId] = useState<number | null>(null)
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const wordsScrollRef = useRef<HTMLDivElement>(null)
  const [hoveredWord, setHoveredWord] = useState<string | null>(null)
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false)
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null)
  const [selectedFocusNodeIndex, setSelectedFocusNodeIndex] = useState<number | null>(null)
  const [scrollLetter, setScrollLetter] = useState<string | null>(null)
  const sectionRefsMap = useRef<Record<string, HTMLDivElement | null>>({})
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

  // Debounced search (in sync with /glossary)
  useEffect(() => {
    if (step !== 'words') return
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        loadGlossaryWords()
      } else {
        searchWords(searchQuery).then(setGlossaryWords).catch(() => setGlossaryWords([]))
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [step, searchQuery])

  useEffect(() => {
    if (step === 'words') {
      const focusNodesCount = clockSettings[clockId]?.focusNodes || 0
      setWords(Array(focusNodesCount).fill(''))
      setSelectedFocusNodeIndex(0)
      setLoadError(null)
      // Reset filters to default when entering Assign Words
      setScopeFilter('All')
      setSelectedSentiment(null)
      setSelectedClockId(null)
      setSelectedLetter(null)
      setSearchQuery('')
    } else {
      setScrollLetter(null)
    }
  }, [step, clockId])

  useEffect(() => {
    if (open) {
      playClick()
    }
  }, [open, playClick])

  // Scroll-linked A–Z: highlight letter whose section is in view
  useEffect(() => {
    if (step !== 'words' || !wordsScrollRef.current) return
    const container = wordsScrollRef.current
    const sections = container.querySelectorAll('[id^="letter-"]')
    if (sections.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting && e.intersectionRatio >= 0.05)
        if (visible.length === 0) return
        const byTop = [...visible].sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        const letter = byTop[0].target.id.replace('letter-', '')
        setScrollLetter(letter)
      },
      { root: container, rootMargin: '-10% 0px -70% 0px', threshold: [0, 0.05, 0.2, 0.5, 1] }
    )
    sections.forEach((el) => observer.observe(el))
    return () => {
      sections.forEach((el) => observer.unobserve(el))
      observer.disconnect()
    }
  }, [step, glossaryWords.length, searchQuery, scopeFilter, selectedSentiment, selectedLetter])


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
      const focusNodesCount = clockSettings[clockId]?.focusNodes || 0
      const allAssigned = words.length === focusNodesCount && words.every(w => w.trim() !== '')
      if (!allAssigned) {
        setLoadError('Assign a word to every focus node to continue.')
        return
      }
      onNext(
        isEndless ? null : (isCustom ? parseInt(customDuration) : selectedPreset),
        words
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
      const focusNodesCount = clockSettings[clockId]?.focusNodes || 0
      return words.length === focusNodesCount && words.every(w => w.trim() !== '')
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

  /** Fill all slots at once with default words for the current clock. */
  const handleFillAllDefaultWords = () => {
    const defaultWords = glossaryWords.filter(
      (word) => word.clock_id != null && word.clock_id >= 0 && word.clock_id <= 8 && word.clock_id === clockId
    )
    if (defaultWords.length === 0) return
    const focusNodesCount = clockSettings[clockId]?.focusNodes ?? 0
    const newWords = Array(focusNodesCount)
      .fill('')
      .map((_, i) => defaultWords[i]?.word ?? '')
    setWords(newWords)
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
    const clock = clockId != null ? clockSettings[clockId] : null
    if (!clock) return null
    const focusNodesCount = clock.focusNodes
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    const clockHex = CLOCK_HEX[clockId] ?? '#6b7280'
    // Filter: scope + sentiment + letter (match /glossary)
    const filteredWords = glossaryWords
      .filter(word => {
        if (scopeFilter === 'My Words') {
          if (word.source !== 'user' || word.user_id !== user?.uid) return false
        } else if (scopeFilter === 'Default') {
          if (word.clock_id == null || word.clock_id < 0 || word.clock_id > 8) return false
          if (word.clock_id !== clockId) return false
        }
        if (selectedSentiment !== null && word.rating !== selectedSentiment) return false
        if (selectedLetter && !word.word.toUpperCase().startsWith(selectedLetter)) return false
        return true
      })
      .sort((a, b) => a.word.localeCompare(b.word))

    const letterSections = (() => {
      const map: Record<string, GlossaryWord[]> = {}
      filteredWords.forEach(w => {
        const letter = w.word[0]?.toUpperCase() || '#'
        if (!map[letter]) map[letter] = []
        map[letter].push(w)
      })
      return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
    })()

    const scrollToLetter = (letter: string) => {
      const el = sectionRefsMap.current[`letter-${letter}`] ?? document.getElementById(`letter-${letter}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    // Count assigned words by sentiment (look up rating from glossary)
    const wordToRating = (() => {
      const m: Record<string, '+' | '~' | '-'> = {}
      glossaryWords.forEach(w => { m[w.word] = w.rating })
      return m
    })()
    const assignedPositive = words.filter(w => w.trim() && wordToRating[w.trim()] === '+').length
    // Sentiment colors for cards and clock labels (positive=green, negative=red, neutral=gray)
    const getSentimentStyle = (rating: '+' | '~' | '-' | undefined) => {
      if (rating === '+') return { bg: '#10b981', border: '#059669', shadow: '#34d399' }   // emerald
      if (rating === '-') return { bg: '#f43f5e', border: '#e11d48', shadow: '#fb7185' }   // rose
      return { bg: '#94a3b8', border: '#64748b', shadow: '#cbd5e1' }                        // slate/neutral
    }
    const assignedNeutral = words.filter(w => w.trim() && wordToRating[w.trim()] === '~').length
    const assignedNegative = words.filter(w => w.trim() && wordToRating[w.trim()] === '-').length

    const handleWordClick = (word: GlossaryWord) => {
      const focusNodesCount = clock.focusNodes
      const isAssigned = words.includes(word.word)
      if (isAssigned) {
        const idx = words.indexOf(word.word)
        if (idx >= 0) {
          const next = [...words]
          next[idx] = ''
          setWords(next)
          setSelectedFocusNodeIndex(idx)
        }
      } else {
        const targetIndex = selectedFocusNodeIndex ?? words.findIndex(w => !w)
        if (targetIndex >= 0 && targetIndex < focusNodesCount) {
          const next = [...words]
          next[targetIndex] = word.word
          setWords(next)
          const nextEmpty = next.findIndex((w, i) => i > targetIndex && !w)
          const nextEmptyFromStart = next.findIndex(w => !w)
          setSelectedFocusNodeIndex(nextEmpty >= 0 ? nextEmpty : (nextEmptyFromStart >= 0 ? nextEmptyFromStart : null))
          // Update A–Z filter to match the selected word's first letter (no scroll — keep list position)
          const letter = word.word.trim()[0]?.toUpperCase()
          if (letter && alphabet.includes(letter)) {
            setSelectedLetter(letter)
          }
        }
      }
    }

    return (
      <div className="w-full flex-1 min-h-0 min-w-0 px-6 overflow-hidden grid grid-cols-[2fr_3fr] gap-6">
        {/* Left half: glossary — fixed-height scroll region so only this area scrolls */}
        <Motion.div
          key="words"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="min-w-0 min-h-0 flex flex-col overflow-hidden rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black/40 backdrop-blur-lg relative"
        >
            <div className="p-3 border-b border-black/5 dark:border-white/10 space-y-2 shrink-0 flex-shrink-0">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search words or definitions"
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search words or definitions"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <span className="absolute right-3 top-2.5 text-sm text-gray-400 dark:text-gray-500">
                  {filteredWords.length} words
                </span>
              </div>
              {/* Scope + Sentiment — match /glossary layout; Default uses clock color */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {(['All', 'Default', 'My Words'] as const).map(scope => (
                    <button
                      key={scope}
                      onClick={() => setScope(scope)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all shrink-0 flex items-center gap-1 border',
                        scopeFilter === scope
                          ? scope === 'All'
                            ? 'bg-gray-200 dark:bg-white/15 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-white/20'
                            : scope === 'Default'
                              ? 'border-transparent'
                              : 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-500/40'
                          : 'bg-white dark:bg-black/30 border-black/5 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-black/20 dark:hover:border-white/20'
                      )}
                      style={scope === 'Default' && scopeFilter === scope ? { backgroundColor: `${clockHex}20`, color: clockHex, borderColor: clockHex } : undefined}
                      onMouseEnter={(e) => {
                        if (scope !== 'Default') return
                        if (scopeFilter !== scope) {
                          e.currentTarget.style.borderColor = clockHex
                          e.currentTarget.style.color = clockHex
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (scope !== 'Default') return
                        if (scopeFilter !== scope) {
                          e.currentTarget.style.borderColor = ''
                          e.currentTarget.style.color = ''
                        }
                      }}
                    >
                      {scope === 'Default' && <Layers className="w-3.5 h-3.5 shrink-0" />}
                      {scope === 'My Words' && <UserCircle2 className="w-3.5 h-3.5 shrink-0" />}
                      {scope}
                    </button>
                  ))}
                </div>
                <span className="w-px h-4 bg-gray-200 dark:bg-white/10" aria-hidden />
                {[
                  { value: '+' as const, label: 'Positive' },
                  { value: '~' as const, label: 'Neutral' },
                  { value: '-' as const, label: 'Negative' },
                ].map(({ value, label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setSelectedSentiment(selectedSentiment === value ? null : value)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all shrink-0',
                      selectedSentiment === value
                        ? value === '+'
                          ? 'bg-emerald-100 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-200 dark:ring-emerald-500/40'
                          : value === '-'
                            ? 'bg-rose-100 dark:bg-rose-500/25 text-rose-800 dark:text-rose-200 ring-1 ring-rose-200 dark:ring-rose-500/40'
                            : 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-200 ring-1 ring-slate-200 dark:ring-slate-500/30'
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
              {/* Letter filter — round buttons, scroll-linked highlight in clock color; click letter again to clear */}
              <div className="flex flex-wrap items-center gap-2">
                <div id="az-filter-words" className="flex flex-wrap gap-1.5" role="region" aria-label="Filter by letter">
                  {alphabet.map(letter => {
                    const isActive = selectedLetter === letter || (!selectedLetter && scrollLetter === letter)
                    return (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => {
                          const next = selectedLetter === letter ? null : letter
                          setSelectedLetter(next)
                          if (next) scrollToLetter(next)
                        }}
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all shrink-0 border',
                          isActive
                            ? 'text-white border-transparent'
                            : 'bg-white dark:bg-black/30 border-black/5 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-black/50 text-gray-700 dark:text-gray-300'
                        )}
                        style={isActive ? { backgroundColor: clockHex, color: '#fff' } : undefined}
                      >
                        {letter}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            {/* Wrapper gets remaining height; scroll div fills it so scrollbar reflects limited space */}
            <div className="flex-1 min-h-0 relative flex flex-col">
              <div
                ref={wordsScrollRef}
                className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 touch-pan-y"
                style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
                onWheel={(e) => e.stopPropagation()}
              >
              <div className="p-4 space-y-6">
                    {isLoadingWords ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading words...</div>
                    ) : loadError ? (
                      <div className="text-center py-8">
                        <p className="text-amber-500 dark:text-amber-400">{loadError}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Please try again later</p>
                      </div>
                    ) : letterSections.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">No words found</div>
                    ) : (
                      letterSections.map(([letter, sectionWords]) => (
                        <div
                          key={letter}
                          id={`letter-${letter}`}
                          ref={(el) => { sectionRefsMap.current[`letter-${letter}`] = el }}
                        >
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 pt-2 first:pt-0 sticky top-0 bg-white/95 dark:bg-black/95 py-1 z-10 backdrop-blur-sm">
                            {letter}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {sectionWords.map(word => {
                              const isAssigned = words.includes(word.word)
                              const canAssign = isAssigned || selectedFocusNodeIndex !== null
                              return (
                                <button
                                  key={word.id}
                                  type="button"
                                  onClick={() => canAssign && handleWordClick(word)}
                                  disabled={!canAssign && !isAssigned}
                                  className={cn(
                                    'rounded-lg text-left transition-all border p-4 backdrop-blur-lg',
                                    !isAssigned && 'bg-white dark:bg-black/40 border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20',
                                    !canAssign && !isAssigned && 'opacity-60 cursor-not-allowed'
                                  )}
                                  style={isAssigned ? (() => {
                                    const s = getSentimentStyle(word.rating)
                                    return { backgroundColor: `${s.bg}18`, borderColor: `${s.border}80`, boxShadow: `0 0 0 2px ${s.shadow}50` }
                                  })() : undefined}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-lg font-medium text-black dark:text-white mb-0.5 truncate">{word.word}</h3>
                                      {word.phonetic_spelling && (
                                        <span className="text-sm text-gray-500 dark:text-gray-400 block">{word.phonetic_spelling}</span>
                                      )}
                                    </div>
                                    <div className="flex items-center ml-4 space-x-1.5 shrink-0">
                                      <div className={cn(
                                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                                        word.rating === '+' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                                        word.rating === '-' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                                        'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                      )}>
                                        {word.grade}
                                      </div>
                                      <div className={cn(
                                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                                        word.rating === '+' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                                        word.rating === '-' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                                        'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                      )}>
                                        {word.rating}
                                      </div>
                                      {word.source === 'user' ? (
                                        <UserCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                      ) : getDefaultIconStyle(word.clock_id) ? (
                                        <div
                                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
                                          style={getDefaultIconStyle(word.clock_id)}
                                        >
                                          {clockTitles[word.clock_id!]?.[0] ?? ''}
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-2">{word.definition}</p>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
              </div>
            </div>
        </Motion.div>
        {/* Right half: selected clock + sentiment counts below */}
        <div className="min-w-0 flex flex-col items-center justify-center min-h-0 overflow-hidden gap-4">
          <div className="w-[560px] h-[560px] relative flex items-center justify-center flex-shrink-0">
            <div className="w-[75%] h-[75%] relative rounded-full overflow-hidden">
              <div
                className="absolute inset-0"
                style={{ transform: `rotate(${clock.imageOrientation}deg)` }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    transform: `translate(${clock.imageX || 0}%, ${clock.imageY || 0}%) scale(${clock.imageScale})`,
                    transformOrigin: 'center',
                  }}
                >
                  <Image
                    src={clock.imageUrl}
                    alt={`Clock ${clockId + 1}`}
                    fill
                    className="object-cover rounded-full dark:invert [&_*]:fill-current [&_*]:stroke-none opacity-50"
                    priority
                    loading="eager"
                  />
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[90%] h-[90%] rounded-full relative pointer-events-none">
                {Array.from({ length: clock.focusNodes }).map((_, index) => {
                  const angleDeg = (index * 360) / clock.focusNodes
                  const angleRad = (angleDeg - 90) * (Math.PI / 180)
                  const radius = 48
                  const x = 50 + radius * Math.cos(angleRad)
                  const y = 50 + radius * Math.sin(angleRad)
                  const isSelected = selectedFocusNodeIndex === index
                  const wordLabel = words[index]?.trim() || ''
                  // Quadrants so right-half nodes (45°–135°) get word to the right, left-half (225°–315°) to the left; top/bottom only at 12 and 6
                  const pillPlacement = (() => {
                    const a = ((angleDeg % 360) + 360) % 360
                    if (a > 315 || a < 45) return 'top'   // 12 o'clock only
                    if (a >= 45 && a <= 135) return 'right'  // right half: like node 2
                    if (a > 135 && a < 225) return 'bottom'  // 6 o'clock
                    return 'left'   // left half (225–315): mirror of right, like node 8 like node 2 flipped
                  })()
                  return (
                    <React.Fragment key={index}>
                      <div
                        className={cn(
                          'absolute w-6 h-6 rounded-full cursor-pointer pointer-events-auto transition-all flex items-center justify-center',
                          bgColorClass,
                          isSelected && 'ring-offset-2 ring-offset-white dark:ring-offset-black scale-125'
                        )}
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          transform: 'translate(-50%, -50%)',
                          ...(isSelected && {
                            boxShadow: `0 0 0 2px var(--dialog-bg, white), 0 0 0 4px ${clockHex}`,
                          }),
                        }}
                        onClick={() => {
                          playClick()
                          setSelectedFocusNodeIndex(index)
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={wordLabel ? `Focus node ${index + 1}: ${wordLabel}` : `Focus node ${index + 1}, no word assigned`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            playClick()
                            setSelectedFocusNodeIndex(index)
                          }
                        }}
                      >
                        <span className="text-[10px] font-semibold text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.8)] select-none" aria-hidden>
                          {index + 1}
                        </span>
                      </div>
                      {wordLabel && (
                          <div
                            className="absolute pointer-events-none px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap outline outline-1 outline-black/10 dark:outline-white/20 bg-white/90 dark:bg-black/90 text-gray-800 dark:text-gray-200 shadow-sm"
                            style={{
                              left: `${x}%`,
                              top: `${y}%`,
                              transform: (() => {
                                const offsetPx = 36
                                if (pillPlacement === 'top') return `translate(-50%, -50%) translateY(-${offsetPx}px)`
                                if (pillPlacement === 'bottom') return `translate(-50%, -50%) translateY(${offsetPx}px)`
                                if (pillPlacement === 'left') return `translate(-100%, -50%) translateX(-${offsetPx}px)`
                                return `translate(0, -50%) translateX(${offsetPx}px)`
                              })(),
                            }}
                            title={wordLabel}
                          >
                            {wordLabel}
                          </div>
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            </div>
          </div>
          {/* Spacer to move counter and actions further down below clock */}
          <div className="min-h-[24px]" aria-hidden />
          {/* Sentiment counts — below clock, moved further down (no Glossary link) */}
          <div className="flex flex-col items-center gap-3 shrink-0 mt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{assignedPositive}</span>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Positive</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500" aria-hidden />
                <span className="text-gray-700 dark:text-gray-300 font-medium">{assignedNeutral}</span>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Neutral</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-500" aria-hidden />
                <span className="text-rose-600 dark:text-rose-400 font-medium">{assignedNegative}</span>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Negative</span>
              </div>
            </div>
            {/* Random, Default, Delete — round buttons; Random/Default overwrite all words */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { playClick(); handleRandomize(); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                title="Overwrite all slots with random words from the glossary"
              >
                <Shuffle className="w-4 h-4" />
                Random
              </button>
              <button
                type="button"
                onClick={() => { playClick(); handleFillAllDefaultWords(); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                title="Overwrite all slots with default words for this clock"
              >
                Default
              </button>
              <button
                type="button"
                onClick={() => { playClick(); handleResetAllWords(); }}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white transition-colors"
                title="Clear all assigned words"
                aria-label="Delete all words"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
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
          "relative w-full h-full min-h-0 flex flex-col overflow-hidden",
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
                <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                  {words.filter(w => w.trim()).length}/{clockSettings[clockId]?.focusNodes ?? 0} words
                </span>
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className={cn(
                    "h-8 px-4 rounded-full flex items-center text-sm font-medium transition-all",
                    canProceed()
                      ? [bgColorClass, "text-white hover:opacity-90"]
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed",
                    "disabled:cursor-not-allowed"
                  )}
                  title={!canProceed() ? `Assign a word to all ${clockSettings[clockId]?.focusNodes ?? 0} focus nodes to start` : 'Start session'}
                >
                  Start
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
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

          {/* Main Content - flex-1 min-h-0 so height is bounded and inner scroll works */}
          <div className={cn(
            "flex-1 min-h-0 overflow-hidden flex flex-col",
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