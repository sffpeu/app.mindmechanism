'use client'

import { useEffect, useState } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { Search, Plus, LayoutGrid, List, UserCircle2, Pencil, Layers, ChevronDown, ChevronUp } from 'lucide-react'
import { GlossaryWord } from '@/types/Glossary'
import { getAllWords, searchWords } from '@/lib/glossary'
import { clockTitles } from '@/lib/clockTitles'
import { AddWordDialog } from '@/components/AddWordDialog'
import { useAuth } from '@/lib/FirebaseAuthContext'

export default function GlossaryPage() {
  const { isDarkMode } = useTheme()
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
  const [isListView, setIsListView] = useState(false)
  const [isAddWordOpen, setIsAddWordOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<GlossaryWord | null>(null)
  const [editWord, setEditWord] = useState<GlossaryWord | null>(null)
  const [showAzFilter, setShowAzFilter] = useState(false)

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  // Per-clock colors for Default filter (selected state)
  const clockColorClasses: { selected: string; hover: string }[] = [
    { selected: 'bg-amber-100 dark:bg-amber-500/25 text-amber-800 dark:text-amber-200', hover: 'hover:bg-amber-50 dark:hover:bg-amber-500/10' },
    { selected: 'bg-orange-100 dark:bg-orange-500/25 text-orange-800 dark:text-orange-200', hover: 'hover:bg-orange-50 dark:hover:bg-orange-500/10' },
    { selected: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-200', hover: 'hover:bg-yellow-50 dark:hover:bg-yellow-500/10' },
    { selected: 'bg-rose-100 dark:bg-rose-500/25 text-rose-800 dark:text-rose-200', hover: 'hover:bg-rose-50 dark:hover:bg-rose-500/10' },
    { selected: 'bg-sky-100 dark:bg-sky-500/25 text-sky-800 dark:text-sky-200', hover: 'hover:bg-sky-50 dark:hover:bg-sky-500/10' },
    { selected: 'bg-violet-100 dark:bg-violet-500/25 text-violet-800 dark:text-violet-200', hover: 'hover:bg-violet-50 dark:hover:bg-violet-500/10' },
    { selected: 'bg-indigo-100 dark:bg-indigo-500/25 text-indigo-800 dark:text-indigo-200', hover: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10' },
    { selected: 'bg-fuchsia-100 dark:bg-fuchsia-500/25 text-fuchsia-800 dark:text-fuchsia-200', hover: 'hover:bg-fuchsia-50 dark:hover:bg-fuchsia-500/10' },
    { selected: 'bg-teal-100 dark:bg-teal-500/25 text-teal-800 dark:text-teal-200', hover: 'hover:bg-teal-50 dark:hover:bg-teal-500/10' },
  ]

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
      if (word.source !== 'system' && word.version !== 'Default') return false
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95">
      <Menu
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
        showSatellites={showSatellites}
        onSatellitesChange={setShowSatellites}
      />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold dark:text-white mb-2">Glossary</h1>
          <p className="text-gray-600 dark:text-gray-400">Browse and search through meditation focus words</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search words or definitions"
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <span className="absolute right-3 top-2.5 text-sm text-gray-400 dark:text-gray-500">
                {filteredWords.length} words
              </span>
            </div>
            <button
              onClick={() => setIsListView(!isListView)}
              className="p-2 rounded-lg bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all text-gray-900 dark:text-white"
            >
              {isListView ? <LayoutGrid className="h-5 w-5" /> : <List className="h-5 w-5" />}
            </button>
          </div>

          {/* Category + Mood in one compact block */}
          <div className="flex flex-wrap items-center gap-3">
            {/* All | Default | My Words */}
            {(['All', 'Default', 'My Words'] as const).map(scope => (
              <button
                key={scope}
                onClick={() => setScope(scope)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  scopeFilter === scope
                    ? scope === 'All'
                      ? 'bg-gray-200 dark:bg-white/15 text-gray-800 dark:text-gray-100'
                      : scope === 'Default'
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200'
                      : 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-200'
                    : 'bg-white dark:bg-black/30 border border-black/5 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {scope === 'Default' && <Layers className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />}
                {scope === 'My Words' && <UserCircle2 className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />}
                {scope}
              </button>
            ))}
            <span className="w-px h-4 bg-gray-200 dark:bg-white/10" aria-hidden />
            {/* Mood: always colored pills */}
            {[
              { value: null, label: 'All' },
              { value: '+' as const, label: 'Positive' },
              { value: '~' as const, label: 'Neutral' },
              { value: '-' as const, label: 'Negative' },
            ].map(({ value, label }) => (
              <button
                key={label}
                onClick={() => setSelectedSentiment(value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedSentiment === value
                    ? value === null
                      ? 'bg-gray-200 dark:bg-white/15 text-gray-800 dark:text-gray-100'
                      : value === '+'
                      ? 'bg-emerald-100 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-200 dark:ring-emerald-500/40'
                      : value === '-'
                      ? 'bg-rose-100 dark:bg-rose-500/25 text-rose-800 dark:text-rose-200 ring-1 ring-rose-200 dark:ring-rose-500/40'
                      : 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-200 ring-1 ring-slate-200 dark:ring-slate-500/30'
                    : value === '+'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                    : value === '-'
                    ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20'
                    : value === '~'
                    ? 'bg-slate-50 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-500/20'
                    : 'bg-white dark:bg-black/30 border border-black/5 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setIsAddWordOpen(true)}
              className="ml-auto px-3 py-1.5 rounded-lg text-sm bg-white dark:bg-black/30 border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
              aria-label="Add word"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {/* Default: clock filter with per-clock colors */}
          {scopeFilter === 'Default' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedClockId(null)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  selectedClockId === null
                    ? 'bg-gray-200 dark:bg-white/20 text-gray-800 dark:text-gray-100'
                    : 'bg-white dark:bg-black/30 border border-black/5 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                All
              </button>
              {clockTitles.map((title, id) => {
                const style = clockColorClasses[id]
                return (
                  <button
                    key={id}
                    onClick={() => setSelectedClockId(selectedClockId === id ? null : id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all border border-transparent ${
                      selectedClockId === id ? style.selected : `bg-white dark:bg-black/30 border-black/5 dark:border-white/10 text-gray-500 dark:text-gray-400 ${style.hover}`
                    }`}
                  >
                    {title}
                  </button>
                )
              })}
            </div>
          )}

          {/* A–Z: collapsible */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAzFilter(!showAzFilter)}
                className={`px-2.5 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
                  showAzFilter || selectedLetter
                    ? 'bg-black/10 dark:bg-white/10 text-gray-800 dark:text-gray-200'
                    : 'bg-white dark:bg-black/30 border border-black/5 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                aria-expanded={showAzFilter}
                aria-controls="az-filter"
              >
                {showAzFilter ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                A–Z
                {selectedLetter && <span className="text-xs opacity-80">({selectedLetter})</span>}
              </button>
              {showAzFilter && selectedLetter && (
                <button
                  onClick={() => setSelectedLetter(null)}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
                >
                  Clear
                </button>
              )}
            </div>
            {selectedCard && (
              <button
                type="button"
                onClick={() => { setEditWord(selectedCard); setIsAddWordOpen(true) }}
                className="p-2 rounded-lg bg-white dark:bg-black/40 border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 text-gray-700 dark:text-gray-300 flex items-center gap-2 text-sm"
                aria-label="Edit word"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            )}
          </div>
          {showAzFilter && (
            <div id="az-filter" className="flex flex-wrap gap-1" role="region" aria-label="Filter by letter">
              {alphabet.map(letter => (
                <button
                  key={letter}
                  onClick={() => setSelectedLetter(selectedLetter === letter ? null : letter)}
                  className={`w-7 h-7 rounded flex items-center justify-center text-sm font-medium transition-all ${
                    selectedLetter === letter
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'bg-white dark:bg-black/30 border border-black/5 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-black/50 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Word Grid/List */}
        <div>
          {isListView && (
            <div className="mb-2 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 grid grid-cols-[2fr,3fr,4rem,4rem,6rem] gap-4 items-center">
              <div>Word</div>
              <div>Definition</div>
              <div className="text-center">Grade</div>
              <div className="text-center">Rating</div>
              <div className="text-center">Icon</div>
            </div>
          )}
          <div className={`${isListView ? 'space-y-1' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
            {loading ? (
              <div className="col-span-full text-center py-8 text-gray-500">Loading words...</div>
            ) : filteredWords.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">No words found</div>
            ) :
              filteredWords.map((word) => (
                <div
                  key={word.id}
                  onClick={() => setSelectedCard(selectedCard?.id === word.id ? null : word)}
                  className={`glossary-item relative cursor-pointer ${isListView ? 'py-2 px-4' : 'p-4'} rounded-lg bg-white dark:bg-black/40 backdrop-blur-lg border transition-all ${
                    selectedCard?.id === word.id
                      ? 'border-black/20 dark:border-white/30 ring-2 ring-black/10 dark:ring-white/20'
                      : 'border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20'
                  } ${isListView ? 'grid grid-cols-[2fr,3fr,4rem,4rem,6rem] gap-4 items-center' : ''}`}
                >
                  {isListView ? (
                    <>
                      <div className="min-w-0">
                        <h3 className="text-base font-medium text-black dark:text-white truncate">{word.word}</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400 block">{word.phonetic_spelling}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{word.definition}</p>
                      <div className="flex items-center justify-center w-full">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                          ${word.rating === '+' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                            word.rating === '-' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                            'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}
                        >
                          {word.grade}
                        </div>
                      </div>
                      <div className="flex items-center justify-center w-full">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                          ${word.rating === '+' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                            word.rating === '-' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                            'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}
                        >
                          {word.rating}
                        </div>
                      </div>
                      <div className="flex items-center justify-center w-full">
                        {word.source === 'user' ? (
                          <UserCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 shrink-0">
                            D
                          </div>
                        )}
                      </div>
                    </>
                  ) :
                    <>
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-black dark:text-white mb-0.5 truncate">{word.word}</h3>
                          <span className="text-sm text-gray-500 dark:text-gray-400 block">{word.phonetic_spelling}</span>
                        </div>
                        <div className="flex items-center ml-4 space-x-1.5">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                            ${word.rating === '+' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                              word.rating === '-' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                              'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}
                          >
                            {word.grade}
                          </div>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                            ${word.rating === '+' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                              word.rating === '-' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                              'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}
                          >
                            {word.rating}
                          </div>
                          <div className="flex items-center">
                            {word.source === 'user' ? (
                              <UserCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                            ) : (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 shrink-0">
                                D
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-2">{word.definition}</p>
                    </>
                  }
                </div>
              ))
            }
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