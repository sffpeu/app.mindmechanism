'use client'

import { useState } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'

interface WordCard {
  word: string;
  phonetic: string;
  definition: string;
  rating: number;
  type: 'Positive' | 'Neutral' | 'Negative';
}

const initialWords: WordCard[] = [
  {
    word: 'A cut above',
    phonetic: '/ə kʌt əˈbʌv/',
    definition: 'Significantly better than others.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Absolute',
    phonetic: '/æbsəluːt/',
    definition: 'Not qualified or diminished in any way',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Absurdity',
    phonetic: '/əbsɜːrdɪti/',
    definition: 'The quality or state of being ridiculous or wildly unreasonable.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Abuse',
    phonetic: '/əbjuːs/',
    definition: 'The improper use of something.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Abusiveness',
    phonetic: '/əbjuːsɪvnəs/',
    definition: 'The bad quality of being abusive towards someone or something.',
    rating: 1,
    type: 'Negative'
  },
  {
    word: 'Acceptance',
    phonetic: '/əkseptəns/',
    definition: 'The action of consenting to receive or undertake something offered.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Accurate',
    phonetic: '/ækjʊrət/',
    definition: 'Correct in all details',
    rating: 3,
    type: 'Neutral'
  },
  {
    word: 'Achievement',
    phonetic: '/ətʃiːvmənt/',
    definition: 'A successful result gained through effort.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Adaptability',
    phonetic: '/əˌdæptəˈbɪlɪti/',
    definition: 'The quality of being able to adjust to new conditions.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Adapting',
    phonetic: '/əˈdæptɪŋ/',
    definition: 'The act of making something suitable for a new use or purpose.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Adequacy',
    phonetic: '/ædɪkwəsi/',
    definition: 'The state of being sufficient for the purpose concerned.',
    rating: 5,
    type: 'Positive'
  },
  {
    word: 'Advantage',
    phonetic: '/ədvæntɪdʒ/',
    definition: 'A condition or circumstance that puts one in a favorable or superior position.',
    rating: 5,
    type: 'Positive'
  }
]

export default function GlossaryPage() {
  const { isDarkMode } = useTheme()
  const [showElements, setShowElements] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('All')
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  const filteredWords = initialWords.filter(word => {
    const matchesSearch = word.word.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = selectedFilter === 'All' || word.type === selectedFilter
    const matchesLetter = !selectedLetter || word.word.charAt(0).toUpperCase() === selectedLetter
    return matchesSearch && matchesFilter && matchesLetter
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95">
      <Menu
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
      />
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-2">Glossary</h1>
          <p className="text-gray-600 dark:text-gray-400">Browse and search through meditation focus words</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search words or definitions"
              className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="text-sm text-gray-500">{filteredWords.length}</span>
          </div>
          
          <div className="flex space-x-2">
            {['All', 'Positive', 'Neutral', 'Negative'].map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  selectedFilter === filter
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                {filter}
              </button>
            ))}
            <button className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800">
              +
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
                    : 'bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>

        {/* Word Cards */}
        <div className="grid gap-4">
          {filteredWords.map((word, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-medium">{word.word}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{word.phonetic}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    word.rating >= 4 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                    word.rating >= 2 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                  }`}>
                    {word.rating}
                  </span>
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    {word.rating >= 4 ? '👍' : word.rating >= 2 ? '😐' : '👎'}
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