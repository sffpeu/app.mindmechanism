'use client'

import { useEffect, useState } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { Search, Plus, ThumbsUp, ThumbsDown, Minus, Tag, LayoutGrid, List, Home, UserCircle2, Pencil } from 'lucide-react'
import { GlossaryWord } from '@/types/Glossary'
import { getAllWords, searchWords } from '@/lib/glossary'
import { AddWordDialog } from '@/components/AddWordDialog'
import { useAuth } from '@/lib/FirebaseAuthContext'

export default function GlossaryPage() {
  const { isDarkMode } = useTheme()
  const { user } = useAuth()
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [scopeFilter, setScopeFilter] = useState<'All' | 'My Words'>('All')
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
    // Scope: All vs My Words
    if (scopeFilter === 'My Words' && (word.source !== 'user' || word.user_id !== user?.uid)) {
      return false
    }
    // Then apply rating filters
    if (selectedFilter === 'All') return true
    if (selectedFilter === 'Default') return true
    if (selectedFilter === 'Positive') return word.rating === '+'
    if (selectedFilter === 'Neutral') return word.rating === '~'
    if (selectedFilter === 'Negative') return word.rating === '-'
    return true
  }).filter(word => {
    if (!selectedLetter) return true
    return word.word.toUpperCase().startsWith(selectedLetter)
  })

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

          <div className="flex flex-col space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {(['All', 'My Words'] as const).map(scope => (
                <button
                  key={scope}
                  onClick={() => setScopeFilter(scope)}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                    scopeFilter === scope
                      ? scope === 'All'
                        ? 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-medium border border-gray-200 dark:border-white/20'
                        : 'bg-purple-100/50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-medium border border-purple-200 dark:border-purple-500/30'
                      : `bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 ${
                          scope === 'All'
                            ? 'hover:bg-gray-50 dark:hover:bg-black/60 hover:border-gray-200 dark:hover:border-white/20 text-gray-900 dark:text-white'
                            : 'hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-500/30 text-gray-900 dark:text-white'
                        }`
                  }`}
                >
                  {scope === 'My Words' && <UserCircle2 className="w-4 h-4" />}
                  {scope}
                </button>
              ))}
              {['All', 'Default', 'Positive', 'Neutral', 'Negative'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                    selectedFilter === filter
                      ? filter === 'All' || filter === 'Default'
                        ? 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-medium border border-gray-200 dark:border-white/20'
                        : filter === 'Positive'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-medium border border-green-200 dark:border-green-500/30'
                        : filter === 'Negative'
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium border border-red-200 dark:border-red-500/30'
                          : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium border border-blue-200 dark:border-blue-500/30'
                      : `bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 text-gray-900 dark:text-white ${
                          filter === 'All' || filter === 'Default'
                            ? 'hover:bg-gray-50 dark:hover:bg-black/60 hover:border-gray-200 dark:hover:border-white/20'
                            : filter === 'Positive'
                            ? 'hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-500/30 hover:text-green-600 dark:hover:text-green-400'
                            : filter === 'Negative'
                              ? 'hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-500/30 hover:text-red-600 dark:hover:text-red-400'
                              : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-500/30 hover:text-blue-600 dark:hover:text-blue-400'
                          }`
                  }`}
                >
                  {filter === 'Default' ? (
                    <>
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 shrink-0">
                        D
                      </span>
                      Default
                    </>
                  ) : filter === 'All' ? (
                    'All'
                  ) : (
                    filter
                  )}
                </button>
              ))}
              <button 
                onClick={() => setIsAddWordOpen(true)}
                className="px-4 py-2 rounded-lg bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all text-gray-900 dark:text-white"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
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