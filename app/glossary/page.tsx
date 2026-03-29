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
  const [isAddWordOpen, setIsAddWordOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<GlossaryWord | null>(null)
  const [editWord, setEditWord] = useState<GlossaryWord | null>(null)
  const sectionRefsMap = useRef<Record<string, HTMLDivElement | null>>({})
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const lettersListRef = useRef<string[]>([])

  const CLOCK_HEX = ['#fd290a', '#fba63b', '#f7da5f', '#6dc037', '#156fde', '#941952', '#541b96', '#ee5fa7', '#56c1ff']

  const getDefaultIconStyle = (clockId: number | undefined) => {
    if (clockId == null || clockId < 0 || clockId >= CLOCK_HEX.length) return undefined
    const hex = CLOCK_HEX[clockId]
    return { backgroundColor: `${hex}20`, color: hex }
  }

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

  const filteredWords = words.filter((word) => {
    if (scopeFilter === 'My Words') {
      if (word.source !== 'user' || word.user_id !== user?.uid) return false
    } else if (scopeFilter === 'Default') {
      if (word.clock_id == null || word.clock_id < 0 || word.clock_id > 8) return false
      if (selectedClockId !== null && word.clock_id !== selectedClockId) return false
    }
    if (selectedSentiment !== null && word.rating !== selectedSentiment) return false
    return true
  })

  const setScopeAllOrMy = useCallback((scope: 'All' | 'My Words') => {
    setSelectedClockId(null)
    setScopeFilter(scope)
  }, [])

  const onSelectAllDefault = useCallback(() => {
    setScopeFilter('Default')
    setSelectedClockId(null)
  }, [])

  const onSelectChakra = useCallback((clockId: number) => {
    setScopeFilter('Default')
    setSelectedClockId(clockId)
  }, [])

  const onToggleSentiment = useCallback((value: SentimentValue) => {
    setSelectedSentiment((prev) => (prev === value ? null : value))
  }, [])

  const sortedWords = [...filteredWords].sort((a, b) => a.word.localeCompare(b.word))

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
      <GlossarySearchBar value={searchQuery} onChange={setSearchQuery} wordCount={sortedWords.length} />
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
        'shrink-0 border-t border-black/5 dark:border-white/10 p-3 space-y-2 w-full',
        visualMode ? 'bg-white/90 dark:bg-black/70 backdrop-blur-md z-20' : 'bg-white/90 dark:bg-black/50 backdrop-blur-sm'
      )}
    >
      {bottomChromeInner}
    </div>
  )

  return (
    <div className="h-full overflow-hidden flex flex-col bg-gray-50 dark:bg-black/95">
      {visualMode ? (
        <>
          <div className="flex-1 min-h-0 relative w-full">
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
                visualFilters={{
                  scopeFilter,
                  selectedClockId,
                  selectedSentiment,
                }}
              />
            )}
          </div>
          <div className="max-w-7xl mx-auto w-full px-4 shrink-0">{bottomChrome}</div>
        </>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col max-w-7xl mx-auto w-full px-4 py-6">
          <div className="mb-6 shrink-0">
            <h1 className="text-2xl font-semibold dark:text-white mb-2">Glossary</h1>
            <p className="text-gray-600 dark:text-gray-400">Browse and search through meditation focus words</p>
          </div>

          <div className="flex-1 min-h-0 flex flex-col min-h-[320px] overflow-hidden">
            <div className="flex-1 min-h-0 relative">
              <GlossaryWordScrollList
                loading={loading}
                letterSections={letterSections}
                scrollContainerRef={scrollContainerRef}
                sectionRefsMap={sectionRefsMap}
                selectedCard={selectedCard}
                onSelectCard={setSelectedCard}
                getDefaultIconStyle={getDefaultIconStyle}
                clockHexPalette={CLOCK_HEX}
              />
            </div>
            {bottomChrome}
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
