'use client'

import { useEffect, useState } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { Search, Plus, ThumbsUp, ThumbsDown, Minus, LayoutGrid, List, UserCircle2, Pencil, Layers, Smile } from 'lucide-react'
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

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

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

          {/* Main categories: All | Default | My Words */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-1">Category:</span>
            {(['All', 'Default', 'My Words'] as const).map(scope => (
              <button
                key={scope}
                onClick={() => setScope(scope)}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                  scopeFilter === scope
                    ? scope === 'All'
                      ? 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-medium border border-gray-200 dark:border-white/20 shadow-sm'
                      : scope === 'Default'
                      ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 font-medium border border-amber-200 dark:border-amber-500/30 shadow-sm'
                      : 'bg-purple-100/50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-medium border border-purple-200 dark:border-purple-500/30 shadow-sm'
                    : 'bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 text-gray-900 dark:text-white'
                }`}
              >
                {scope === 'Default' && <Layers className="w-4 h-4 shrink-0" />}
                {scope === 'My Words' && <UserCircle2 className="w-4 h-4 shrink-0" />}
                {scope}
              </button>
            ))}
            <button
              onClick={() => setIsAddWordOpen(true)}
              className="ml-2 px-4 py-2 rounded-xl bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all text-gray-900 dark:text-white flex items-center gap-2"
              aria-label="Add word"
            >
              <Plus className="h-5 w-5" />
              Add
            </button>
          </div>

          {/* Default: filter by clock (only when Default category is selected) */}
          {scopeFilter === 'Default' && (
            <div className="flex flex-wrap items-center gap-2 pl-1">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Clock:</span>
              <button
                onClick={() => setSelectedClockId(null)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  selectedClockId === null
                    ? 'bg-gray-200 dark:bg-white/20 text-gray-800 dark:text-gray-200 font-medium'
                    : 'bg-white dark:bg-black/40 border border-black/5 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-black/60 text-gray-700 dark:text-gray-300'
                }`}
              >
                All clocks
              </button>
              {clockTitles.map((title, id) => (
                <button
                  key={id}
                  onClick={() => setSelectedClockId(selectedClockId === id ? null : id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    selectedClockId === id
                      ? 'bg-amber-100 dark:bg-amber-500/25 text-amber-800 dark:text-amber-300 font-medium border border-amber-300/50 dark:border-amber-500/40'
                      : 'bg-white dark:bg-black/40 border border-black/5 dark:border-white/10 hover:bg-amber-50/50 dark:hover:bg-amber-500/10 hover:border-amber-200 dark:hover:border-amber-500/20 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {title}
                </button>
              ))}
            </div>
          )}

          {/* Mood / Sentiment: Positive, Neutral, Negative — inviting pill row */}
          <div className="flex flex-wrap items-center gap-2 pl-1">
            <Smile className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" aria-hidden />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Mood:</span>
            {[
              { value: null, label: 'All', icon: null },
              { value: '+' as const, label: 'Positive', icon: ThumbsUp },
              { value: '~' as const, label: 'Neutral', icon: Minus },
              { value: '-' as const, label: 'Negative', icon: ThumbsDown },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => setSelectedSentiment(value)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedSentiment === value
                    ? value === null
                      ? 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/20'
                      : value === '+'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shadow-sm'
                      : value === '-'
                      ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-500/30 shadow-sm'
                    : 'bg-white/80 dark:bg-black/30 border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {Icon && <Icon className="w-4 h-4 shrink-0" />}
                {label}
              </button>
            ))}
          </div>

          {/* Alphabet Filter + Edit (when card selected) */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {alphabet.map(letter => (
                <button
                  key={letter}
                  onClick={() => setSelectedLetter(selectedLetter === letter ? null : letter)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    selectedLetter === letter
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 text-gray-900 dark:text-white'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
            {selectedCard && (
              <button
                type="button"
                onClick={() => {
                  setEditWord(selectedCard)
                  setIsAddWordOpen(true)
                }}
                className="p-2 rounded-lg bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all text-gray-900 dark:text-white flex items-center gap-2"
                aria-label="Edit word"
              >
                <Pencil className="h-5 w-5" />
                Edit
              </button>
            )}
          </div>
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