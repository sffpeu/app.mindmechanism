'use client'

import { useState, useEffect } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { Logo } from '@/components/Logo'
import { Search, Plus, ThumbsUp, ThumbsDown, Minus } from 'lucide-react'
import DotNavigation from '@/components/DotNavigation'
import { Word, loadWords } from '@/lib/words'

export default function GlossaryPage() {
  const { isDarkMode } = useTheme()
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [words, setWords] = useState<Word[]>([])

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  useEffect(() => {
    // Load words when component mounts
    async function fetchWords() {
      const loadedWords = await loadWords();
      setWords(loadedWords);
    }
    fetchWords();
  }, []);

  const filteredWords = words.filter(word => {
    const matchesSearch = word.word.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = selectedFilter === 'All' || word.type === selectedFilter
    const matchesLetter = !selectedLetter || word.word.charAt(0).toUpperCase() === selectedLetter
    return matchesSearch && matchesFilter && matchesLetter
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95">
      <Logo />
      {showElements && (
        <DotNavigation
          activeDot={1}
          isSmallMultiView={false}
        />
      )}
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
            <span className="text-sm text-gray-500 dark:text-gray-400">{filteredWords.length}</span>
          </div>
          
          <div className="flex space-x-2">
            {['All', 'Positive', 'Neutral', 'Negative'].map(filter => (
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

        {/* Word Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredWords.map((word, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border ${
                word.type === 'Neutral' 
                  ? 'border-blue-200 dark:border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)] dark:shadow-[0_0_15px_rgba(59,130,246,0.07)]' 
                  : 'border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20'
              } transition-all`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{word.word}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{word.phonetic}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    word.rating >= 4 ? 'bg-green-100/50 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                    word.rating >= 2 ? 'bg-blue-100/50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                    'bg-red-100/50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                  }`}>
                    {word.rating}
                  </span>
                  <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors">
                    {word.rating >= 4 ? <ThumbsUp className="h-4 w-4" /> : 
                     word.rating >= 2 ? <Minus className="h-4 w-4" /> : 
                     <ThumbsDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{word.definition}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 