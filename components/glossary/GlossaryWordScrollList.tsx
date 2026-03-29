'use client'

import { RefObject, MutableRefObject } from 'react'
import { UserCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { clockTitles } from '@/lib/clockTitles'
import type { GlossaryWord } from '@/types/Glossary'

export type LetterSection = [string, GlossaryWord[]]

export type GlossaryWordScrollListProps = {
  loading: boolean
  letterSections: LetterSection[]
  scrollContainerRef: RefObject<HTMLDivElement | null>
  sectionRefsMap: MutableRefObject<Record<string, HTMLDivElement | null>>
  selectedCard: GlossaryWord | null
  onSelectCard: (word: GlossaryWord | null) => void
  getDefaultIconStyle: (clockId: number | undefined) => { backgroundColor: string; color: string } | undefined
}

export function GlossaryWordScrollList({
  loading,
  letterSections,
  scrollContainerRef,
  sectionRefsMap,
  selectedCard,
  onSelectCard,
  getDefaultIconStyle,
}: GlossaryWordScrollListProps) {
  return (
    <div
      ref={scrollContainerRef}
      className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 touch-pan-y"
      style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
    >
      <div className="p-4 space-y-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading words...</div>
        ) : letterSections.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">No words found</div>
        ) : (
          letterSections.map(([letter, sectionWords]) => (
            <div
              key={letter}
              id={`letter-${letter}`}
              ref={(el) => {
                sectionRefsMap.current[`letter-${letter}`] = el
              }}
            >
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 pt-2 first:pt-0 sticky top-0 bg-white/95 dark:bg-black/95 py-1 z-10 backdrop-blur-sm">
                {letter}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectionWords.map((word) => (
                  <button
                    key={word.id}
                    type="button"
                    onClick={() => onSelectCard(selectedCard?.id === word.id ? null : word)}
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
                        <div
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                            word.rating === '+'
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                              : word.rating === '-'
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          )}
                        >
                          {word.grade}
                        </div>
                        <div
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                            word.rating === '+'
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                              : word.rating === '-'
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          )}
                        >
                          {word.rating}
                        </div>
                        {word.source === 'user' ? (
                          <UserCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        ) : getDefaultIconStyle(word.clock_id) ? (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
                            style={getDefaultIconStyle(word.clock_id)}
                          >
                            {word.clock_id != null ? (clockTitles[word.clock_id]?.[0] ?? '') : ''}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 line-clamp-2">{word.definition}</p>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
