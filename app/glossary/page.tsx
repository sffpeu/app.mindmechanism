'use client'

import { useEffect, useState } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { Logo } from '@/components/Logo'
import { Search, Plus } from 'lucide-react'
import { GlossaryWord } from '@/types/Glossary'
import { getAllWords, searchWords } from '@/lib/glossary'

export default function GlossaryPage() {
  const { isDarkMode } = useTheme()
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [words, setWords] = useState<GlossaryWord[]>([])
  const [loading, setLoading] = useState(true)

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
      const allWords = await getAllWords()
      setWords(allWords)
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

  const filteredWords = words.filter(word => {
    if (selectedFilter === 'All') return true
    if (selectedFilter === 'Positive') return word.rating === '+'
    if (selectedFilter === 'Neutral') return word.rating === '~'
    if (selectedFilter === 'Negative') return word.rating === '-'
    if (selectedFilter === 'Default') return word.version === 'Default'
    return true
  }).filter(word => {
    if (!selectedLetter) return true
    return word.word.toUpperCase().startsWith(selectedLetter)
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95">
      <Logo />
      <Menu
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
        showSatellites={showSatellites}
        onSatellitesChange={setShowSatellites}
      />
      <div className="max-w-6xl mx-auto p-4 md:p-6 pt-24">
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
            </div>
          </div>
          
          <div className="flex space-x-2">
            {['All', 'Default', 'Positive', 'Neutral', 'Negative'].map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  selectedFilter === filter
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 text-gray-900 dark:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
            <button className="px-4 py-2 rounded-lg bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all text-gray-900 dark:text-white">
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Alphabet Filter */}
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
        </div>

        {/* Word Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-8 text-gray-500">Loading words...</div>
          ) : filteredWords.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">No words found</div>
          ) : (
            filteredWords.map((word) => (
              <div
                key={word.id}
                className="p-4 rounded-lg bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-black dark:text-white">{word.word}</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{word.phonetic_spelling}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{word.definition}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Grade: {word.grade}</span>
                  <span className={`text-sm ${
                    word.rating === '+' ? 'text-green-500' :
                    word.rating === '-' ? 'text-red-500' :
                    'text-yellow-500'
                  }`}>
                    {word.rating === '+' ? 'Positive' :
                     word.rating === '-' ? 'Negative' :
                     'Neutral'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 