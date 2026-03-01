'use client'

import { useEffect, useState } from 'react'
import { Menu } from '@/components/Menu'
import { Search, Plus, UserCircle2, Pencil, Layers, ChevronDown, ChevronUp } from 'lucide-react'
import { GlossaryWord } from '@/types/Glossary'
import { getAllWords, searchWords } from '@/lib/glossary'
import { clockTitles } from '@/lib/clockTitles'
import { AddWordDialog } from '@/components/AddWordDialog'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { cn } from '@/lib/utils'

export default function GlossaryPage() {
  const { user } = useAuth()
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scopeFilter, setScopeFilter] = useState<'All' | 'Default' | 'My Words'>('All')
  const [selectedClockId, setSelectedClockId] = useState<number | null>(null)
  const [selectedSentiment, setSelectedSentiment] = useState<'+' | '~' | '-' | null>(null)
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [words, setWords] = useState<GlossaryWord[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddWordOpen, setIsAddWordOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<GlossaryWord | null>(null)
  const [editWord, setEditWord] = useState<GlossaryWord | null>(null)
  const [showAzFilter, setShowAzFilter] = useState(false)

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  // Clock 1–9 colors from Clock.tsx (ROOT → ETHERAL HEART)
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
      console.log('Fetching words...')
      const allWords = await getAllWords()
      console.log('Fetched words:', allWords.length)
      setWords(allWords)
    } catch (error) {
      console.error('Error loading words:', error)
    }
    setLoading(false)
  }

  const handleSearch = async () => {
    setLoading(true)
    try {
      console.log('Searching words with query:', searchQuery)
      const results = await searchWords(searchQuery)
      console.log('Search results:', results.length)
      setWords(results)
    } catch (error) {
      console.error('Error searching words:', error)
    }
    setLoading(false)
  }

  const filteredWords = words.filter(word => {
    // Scope: All | Default | My Words
    if (scopeFilter === 'My Words') {
      if (word.source !== 'user' || word.user_id !== user?.uid) return false
    } else if (scopeFilter === 'Default') {
      // Only words belonging to a clock (ROOT, SACROL, …) are Default words
      if (word.clock_id == null || word.clock_id < 0 || word.clock_id > 8) return false
      if (selectedClockId !== null && word.clock_id !== selectedClockId) return false
    }
    // Sentiment (Positive / Neutral / Negative)
    if (selectedSentiment !== null && word.rating !== selectedSentiment) return false
    return true
  }).filter(word => {
    if (!selectedLetter) return true
    return word.word.toUpperCase().startsWith(selectedLetter)
  })

  // When switching away from Default, clear clock selection
  const setScope = (scope: 'All' | 'Default' | 'My Words') => {
    if (scope !== 'Default') setSelectedClockId(null)
    setScopeFilter(scope)
  }

  // Default scope pill uses selected clock color when a clock is selected (match Assign Words popup)
  const clockHex = selectedClockId != null ? (CLOCK_HEX[selectedClockId] ?? '#6b7280') : '#6b7280'

  const sortedWords = [...filteredWords].sort((a, b) => a.word.localeCompare(b.word))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95">
      <Menu
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
        showSatellites={showSatellites}
        onSatellitesChange={setShowSatellites}
      />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold dark:text-white mb-2">Glossary</h1>
          <p className="text-gray-600 dark:text-gray-400">Browse and search through meditation focus words</p>
        </div>

        {/* Single card: same look as Assign Words popup glossary */}
        <div className="rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-black/40 backdrop-blur-lg overflow-hidden flex flex-col min-h-[60vh]">
          {/* Header: search + filters */}
          <div className="p-3 border-b border-black/5 dark:border-white/10 space-y-2 shrink-0 flex-shrink-0">
            <div className="flex-1 relative flex items-center gap-3">
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
                  {sortedWords.length} words
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {selectedCard && (
                  <button
                    type="button"
                    onClick={() => { setEditWord(selectedCard); setIsAddWordOpen(true) }}
                    className="px-3 py-1.5 rounded-lg text-sm bg-white dark:bg-black/30 border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
                    aria-label="Edit word"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsAddWordOpen(true)}
                  className="px-3 py-1.5 rounded-lg text-sm bg-white dark:bg-black/30 border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
                  aria-label="Add word"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
            {/* Scope + Sentiment — match Assign Words popup; Default uses clock color when selected */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-1.5">
                {(['All', 'Default', 'My Words'] as const).map(scope => (
                  <button
                    key={scope}
                    type="button"
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
            {/* Default: clock sub-filter — same pill style as popup context */}
            {scopeFilter === 'Default' && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedClockId(null)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                    selectedClockId === null
                      ? 'bg-gray-200 dark:bg-white/20 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-white/20'
                      : 'bg-white dark:bg-black/30 border-black/5 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
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
                      type="button"
                      onClick={() => setSelectedClockId(selected ? null : id)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-all border shrink-0',
                        'bg-white dark:bg-black/30 border-black/5 dark:border-white/10 text-gray-500 dark:text-gray-400'
                      )}
                      style={selected && hex ? { borderColor: hex, color: hex, backgroundColor: `${hex}15` } : undefined}
                      onMouseEnter={(e) => {
                        if (hex) {
                          e.currentTarget.style.borderColor = hex
                          e.currentTarget.style.color = hex
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!hex) return
                        if (selectedClockId === id) {
                          e.currentTarget.style.borderColor = hex
                          e.currentTarget.style.color = hex
                          e.currentTarget.style.backgroundColor = `${hex}15`
                        } else {
                          e.currentTarget.style.borderColor = ''
                          e.currentTarget.style.color = ''
                          e.currentTarget.style.backgroundColor = ''
                        }
                      }}
                    >
                      {title}
                    </button>
                  )
                })}
              </div>
            )}
            {/* A–Z collapsible — match Assign Words popup */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAzFilter(!showAzFilter)}
                className={cn(
                  'px-2.5 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all',
                  showAzFilter || selectedLetter
                    ? 'bg-black/10 dark:bg-white/10 text-gray-800 dark:text-gray-200'
                    : 'bg-white dark:bg-black/30 border border-black/5 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                )}
                aria-expanded={showAzFilter}
                aria-controls="az-filter-glossary"
              >
                {showAzFilter ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                A–Z
                {selectedLetter && <span className="text-xs opacity-80">({selectedLetter})</span>}
              </button>
              {showAzFilter && selectedLetter && (
                <button
                  type="button"
                  onClick={() => setSelectedLetter(null)}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
                >
                  Clear
                </button>
              )}
            </div>
            {showAzFilter && (
              <div id="az-filter-glossary" className="flex flex-wrap gap-1" role="region" aria-label="Filter by letter">
                {alphabet.map(letter => (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => setSelectedLetter(selectedLetter === letter ? null : letter)}
                    className={cn(
                      'w-7 h-7 rounded flex items-center justify-center text-sm font-medium transition-all shrink-0',
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
          {/* Scrollable word grid — same card style as popup */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 touch-pan-y" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {loading ? (
                <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">Loading words...</div>
              ) : sortedWords.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">No words found</div>
              ) : (
                sortedWords.map(word => (
                  <button
                    key={word.id}
                    type="button"
                    onClick={() => setSelectedCard(selectedCard?.id === word.id ? null : word)}
                    className={cn(
                      'rounded-lg text-left transition-all border p-4 backdrop-blur-lg',
                      selectedCard?.id === word.id
                        ? 'border-black/20 dark:border-white/30 ring-2 ring-black/10 dark:ring-white/20 bg-gray-50 dark:bg-white/5'
                        : 'bg-white dark:bg-black/40 border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20'
                    )}
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
                        ) : (
                          <div
                            className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0', getDefaultIconStyle(word.clock_id) ? '' : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300')}
                            style={getDefaultIconStyle(word.clock_id) ?? undefined}
                          >
                            D
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-2">{word.definition}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

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