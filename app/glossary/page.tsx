'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { GlossaryWord } from '@/types/Glossary'
import { getAllWords, searchWords } from '@/lib/glossary'
import { AddWordDialog } from '@/components/AddWordDialog'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { cn } from '@/lib/utils'
import { GlossaryRadialTree } from '@/components/GlossaryRadialTree'
import { GlossarySearchBar } from '@/components/glossary/GlossarySearchBar'
import { GlossaryAllMyScopeButtons } from '@/components/glossary/GlossaryAllMyScopeButtons'
import { GlossaryDefaultChakraDropdown } from '@/components/glossary/GlossaryDefaultChakraDropdown'
import { GlossarySentimentFilter } from '@/components/glossary/GlossarySentimentFilter'
import type { SentimentValue } from '@/components/glossary/GlossarySentimentFilter'
import { GlossaryAlphabetStrip } from '@/components/glossary/GlossaryAlphabetStrip'
import { GlossaryToolbarActions } from '@/components/glossary/GlossaryToolbarActions'
import { GlossaryWordScrollList } from '@/components/glossary/GlossaryWordScrollList'
import { GlossaryVisualWordPanel } from '@/components/glossary/GlossaryVisualWordPanel'

export default function GlossaryPage() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [scopeFilter, setScopeFilter] = useState<'All' | 'Default' | 'My Words'>('All')
  const [selectedClockId, setSelectedClockId] = useState<number | null>(null)
  const [selectedSentiment, setSelectedSentiment] = useState<SentimentValue | null>(null)
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [words, setWords] = useState<GlossaryWord[]>([])
  const [fullWordList, setFullWordList] = useState<GlossaryWord[]>([])
  const [loading, setLoading] = useState(true)
  const [visualMode, setVisualMode] = useState(false)
  const [diagramHoverClockId, setDiagramHoverClockId] = useState<number | null>(null)
  /** All view: null = ring of chakra titles only; number = show words for that clock. */
  const [visualExpandedClockId, setVisualExpandedClockId] = useState<number | null>(null)
  /** Second click on same wedge: rotate diagram so that clock faces 3 o’clock. */
  const [diagramRotationSnapClockId, setDiagramRotationSnapClockId] = useState<number | null>(null)
  const [isAddWordOpen, setIsAddWordOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<GlossaryWord | null>(null)
  const [editWord, setEditWord] = useState<GlossaryWord | null>(null)
  const sectionRefsMap = useRef<Record<string, HTMLDivElement | null>>({})
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const lettersListRef = useRef<string[]>([])

  const CLOCK_HEX = ['#fd290a', '#fba63b', '#f7da5f', '#6dc037', '#156fde', '#941952', '#541b96', '#ee5fa7', '#56c1ff']

  useEffect(() => {
    loadWords()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch()
      } else {
        loadWords()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadWords = async () => {
    setLoading(true)
    try {
      const allWords = await getAllWords()
      setWords(allWords)
      setFullWordList(allWords)
    } catch (error) {
      console.error('Error loading words:', error)
    }
    setLoading(false)
  }

  const handleSearch = async () => {
    setLoading(true)
    try {
      const results = await searchWords(searchQuery)
      setWords(results)
    } catch (error) {
      console.error('Error searching words:', error)
    }
    setLoading(false)
  }

  const glossaryFilterIncludes = useCallback(
    (word: GlossaryWord) => {
      if (scopeFilter === 'My Words') {
        if (word.source !== 'user' || word.user_id !== user?.uid) return false
      } else if (scopeFilter === 'Default') {
        if (word.clock_id == null || word.clock_id < 0 || word.clock_id > 8) return false
        if (selectedClockId !== null && word.clock_id !== selectedClockId) return false
      }
      if (selectedSentiment !== null && word.rating !== selectedSentiment) return false
      return true
    },
    [scopeFilter, selectedClockId, selectedSentiment, user?.uid]
  )

  const filteredWords = words.filter(glossaryFilterIncludes)

  const setScopeAllOrMy = useCallback((scope: 'All' | 'My Words') => {
    setSelectedClockId(null)
    setDiagramHoverClockId(null)
    setVisualExpandedClockId(null)
    setDiagramRotationSnapClockId(null)
    setScopeFilter(scope)
  }, [])

  const onSelectAllDefault = useCallback(() => {
    setDiagramHoverClockId(null)
    setVisualExpandedClockId(null)
    setDiagramRotationSnapClockId(null)
    setScopeFilter('Default')
    setSelectedClockId(null)
  }, [])

  const onSelectChakra = useCallback((clockId: number) => {
    setDiagramHoverClockId(null)
    setVisualExpandedClockId(null)
    setDiagramRotationSnapClockId(null)
    setScopeFilter('Default')
    setSelectedClockId(clockId)
  }, [])

  /** Segment / center click: rotate to readable (3 o’clock) like /layers focused clock; All view also drills into words. */
  const handleGlossarySegmentClick = useCallback((clockId: number | null) => {
    if (clockId === null) {
      setVisualExpandedClockId(null)
      setDiagramRotationSnapClockId(null)
      return
    }
    // All: second click on the same wedge returns to overview (ring of chakra titles only).
    if (
      scopeFilter === 'All' &&
      visualExpandedClockId === clockId &&
      diagramRotationSnapClockId === clockId
    ) {
      setVisualExpandedClockId(null)
      setDiagramRotationSnapClockId(null)
      return
    }
    setDiagramRotationSnapClockId(clockId)
    if (scopeFilter === 'All') {
      setVisualExpandedClockId(clockId)
    }
  }, [scopeFilter, visualExpandedClockId, diagramRotationSnapClockId])

  const onToggleSentiment = useCallback((value: SentimentValue) => {
    setSelectedSentiment((prev) => (prev === value ? null : value))
  }, [])

  const sortedWords = [...filteredWords].sort((a, b) => a.word.localeCompare(b.word))

  /**
   * Card list uses `words` (includes search). The radial always uses `fullWordList`, so in visual mode the count chip
   * uses the same scope/sentiment rules on the full list so it matches the diagram.
   */
  const searchBarWordCount = !visualMode ? sortedWords.length : fullWordList.filter(glossaryFilterIncludes).length

  const letterSections = (() => {
    const map: Record<string, GlossaryWord[]> = {}
    sortedWords.forEach((w) => {
      const letter = w.word[0]?.toUpperCase() || '#'
      if (!map[letter]) map[letter] = []
      map[letter].push(w)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  })()
  lettersListRef.current = letterSections.map(([letter]) => letter)

  const scrollToLetter = (letter: string) => {
    setSelectedLetter(letter)
    const el = sectionRefsMap.current[`letter-${letter}`] ?? document.getElementById(`letter-${letter}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    setDiagramHoverClockId(null)
    if (scopeFilter !== 'All') {
      setVisualExpandedClockId(null)
      setDiagramRotationSnapClockId(null)
    }
  }, [scopeFilter])

  /** Default scope + dropdown clock: snap diagram rotation like focusing a clock on /layers. */
  useEffect(() => {
    if (!visualMode || scopeFilter !== 'Default') return
    if (selectedClockId !== null) {
      setDiagramRotationSnapClockId(selectedClockId)
    } else {
      setDiagramRotationSnapClockId(null)
    }
  }, [visualMode, scopeFilter, selectedClockId])

  useEffect(() => {
    if (!visualMode) {
      setDiagramHoverClockId(null)
      setVisualExpandedClockId(null)
      setDiagramRotationSnapClockId(null)
    }
  }, [visualMode])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || visualMode) return
    const onScroll = () => {
      const letters = lettersListRef.current
      const scrollTop = container.scrollTop
      const threshold = 80
      let active: string | null = null
      for (let i = letters.length - 1; i >= 0; i--) {
        const el = sectionRefsMap.current[`letter-${letters[i]}`]
        if (el && el.offsetTop <= scrollTop + threshold) {
          active = letters[i]
          break
        }
      }
      if (active) setSelectedLetter(active)
    }
    container.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => container.removeEventListener('scroll', onScroll)
  }, [visualMode, letterSections.length])

  const bottomChromeInner = (
    <>
      <GlossarySearchBar value={searchQuery} onChange={setSearchQuery} wordCount={searchBarWordCount} />
      <div className="flex flex-wrap items-center gap-2 gap-y-2">
        <GlossaryAllMyScopeButtons scopeFilter={scopeFilter} onScope={setScopeAllOrMy} />
        <GlossaryDefaultChakraDropdown
          scopeFilter={scopeFilter}
          selectedClockId={selectedClockId}
          onSelectAllDefault={onSelectAllDefault}
          onSelectChakra={onSelectChakra}
        />
        <span className="w-px h-4 bg-gray-200 dark:bg-white/10 shrink-0" aria-hidden />
        <GlossarySentimentFilter selectedSentiment={selectedSentiment} onToggle={onToggleSentiment} />
        <div className="flex-1 min-w-2" aria-hidden />
        <GlossaryToolbarActions
          visualMode={visualMode}
          onToggleVisual={() => setVisualMode((v) => !v)}
          selectedCard={selectedCard}
          onEdit={() => {
            if (selectedCard) {
              setEditWord(selectedCard)
              setIsAddWordOpen(true)
            }
          }}
          onAdd={() => setIsAddWordOpen(true)}
        />
      </div>
      {!visualMode && <GlossaryAlphabetStrip selectedLetter={selectedLetter} onLetterClick={scrollToLetter} />}
    </>
  )

  const bottomChrome = (
    <div
      className={cn(
        'shrink-0 border-t border-black/10 dark:border-white/15 p-3 space-y-2 w-full',
        visualMode ? 'bg-white dark:bg-neutral-950 z-20' : 'bg-white dark:bg-neutral-950'
      )}
    >
      {bottomChromeInner}
    </div>
  )

  return (
    <div className="h-full overflow-hidden flex flex-col bg-transparent">
      {visualMode ? (
        <>
          <div className="flex flex-1 min-h-0 w-full flex-col sm:flex-row overflow-hidden">
            <div className="flex-1 min-w-0 min-h-0 relative">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  Loading words...
                </div>
              ) : (
                <GlossaryRadialTree
                  words={fullWordList}
                  selectedWordId={selectedCard?.id ?? null}
                  onSelectWord={(w) => setSelectedCard((prev) => (prev?.id === w.id ? null : w))}
                  className="absolute inset-0 h-full w-full min-h-[240px]"
                  variant="fullscreen"
                  diagramHoverClockId={diagramHoverClockId}
                  onDiagramClockHover={setDiagramHoverClockId}
                  expandedSegmentClockId={scopeFilter === 'All' ? visualExpandedClockId : null}
                  onExpandSegment={handleGlossarySegmentClick}
                  rotationSnapClockId={diagramRotationSnapClockId}
                  visualFilters={{
                    scopeFilter,
                    selectedClockId,
                    selectedSentiment,
                    userId: user?.uid ?? null,
                  }}
                />
              )}
            </div>
          </div>
          <div className="max-w-7xl mx-auto w-full pl-16 pr-4 shrink-0">{bottomChrome}</div>
        </>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col max-w-7xl mx-auto w-full pl-16 pr-4 py-6">
          <div className="mb-6 shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-1">The Mind Mechanism</p>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-2">Glossary</h1>
            <p className="text-gray-600 dark:text-gray-400">The vocabulary of the interior. Browse, search, and build your own word set.</p>
          </div>

          <div className="flex-1 min-h-0 flex flex-row overflow-hidden gap-0 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-950 shadow-sm">
            {/* Word list + toolbar */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white dark:bg-neutral-950">
              <div className="flex-1 min-h-0 relative">
                <GlossaryWordScrollList
                  loading={loading}
                  letterSections={letterSections}
                  scrollContainerRef={scrollContainerRef}
                  sectionRefsMap={sectionRefsMap}
                  selectedCard={selectedCard}
                  onSelectCard={setSelectedCard}
                  clockHexPalette={CLOCK_HEX}
                />
              </div>
              {bottomChrome}
            </div>

            {/* Detail panel — same component as visual mode */}
            {selectedCard && (
              <GlossaryVisualWordPanel
                word={selectedCard}
                clockHexPalette={CLOCK_HEX}
                onClose={() => setSelectedCard(null)}
              />
            )}
          </div>
        </div>
      )}

      <AddWordDialog
        open={isAddWordOpen}
        onOpenChange={(open) => {
          setIsAddWordOpen(open)
          if (!open) setEditWord(null)
        }}
        onWordAdded={loadWords}
        editWord={editWord}
      />
    </div>
  )
}
