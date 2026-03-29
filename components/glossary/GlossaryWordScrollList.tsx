'use client'

import type { MutableRefObject, Ref } from 'react'
import { UserCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { clockTitles } from '@/lib/clockTitles'
import type { GlossaryWord } from '@/types/Glossary'

export type LetterSection = [string, GlossaryWord[]]

function clockTint(
  clockId: number | undefined | null,
  palette: readonly string[]
): { hex: string; bg: string; border: string; borderHover: string } | null {
  if (clockId == null || clockId < 0 || clockId >= palette.length) return null
  const hex = palette[clockId]
  return {
    hex,
    bg: `${hex}1a`,
    border: `${hex}40`,
    borderHover: `${hex}70`,
  }
}

export type GlossaryWordScrollListProps = {
  loading: boolean
  letterSections: LetterSection[]
  scrollContainerRef: Ref<HTMLDivElement>
  sectionRefsMap: MutableRefObject<Record<string, HTMLDivElement | null>>
  selectedCard: GlossaryWord | null
  onSelectCard: (word: GlossaryWord | null) => void
  getDefaultIconStyle: (clockId: number | undefined) => { backgroundColor: string; color: string } | undefined
  clockHexPalette: readonly string[]
}

export function GlossaryWordScrollList({
  loading,
  letterSections,
  scrollContainerRef,
  sectionRefsMap,
  selectedCard,
  onSelectCard,
  getDefaultIconStyle,
  clockHexPalette,
}: GlossaryWordScrollListProps) {
  return (
    <div
      ref={scrollContainerRef}
      className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 touch-pan-y"
      style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
    >
      <div className="pb-2 pt-1 space-y-6">
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
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 pt-2 first:pt-0 sticky top-0 z-10 py-1 backdrop-blur-sm bg-gray-50/90 dark:bg-black/90">
                {letter}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectionWords.map((word) => {
                  const tint = clockTint(word.clock_id, clockHexPalette)
                  const isUserOnly = word.source === 'user'
                  const useClockCard = tint != null && !isUserOnly

                  return (
                    <button
                      key={word.id}
                      type="button"
                      onClick={() => onSelectCard(selectedCard?.id === word.id ? null : word)}
                      className={cn(
                        'rounded-lg text-left transition-all border p-4',
                        useClockCard
                          ? 'backdrop-blur-sm'
                          : 'border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/[0.06] hover:border-black/20 dark:hover:border-white/20',
                        !useClockCard && selectedCard?.id === word.id && 'ring-2 ring-black/20 dark:ring-white/30'
                      )}
                      style={
                        useClockCard
                          ? {
                              backgroundColor: tint.bg,
                              borderColor: selectedCard?.id === word.id ? tint.hex : tint.border,
                              boxShadow:
                                selectedCard?.id === word.id ? `0 0 0 2px ${tint.hex}` : undefined,
                            }
                          : undefined
                      }
                      onMouseEnter={(e) => {
                        if (!useClockCard) return
                        if (selectedCard?.id !== word.id) {
                          e.currentTarget.style.borderColor = tint.borderHover
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!useClockCard) return
                        if (selectedCard?.id !== word.id) {
                          e.currentTarget.style.borderColor = tint.border
                        }
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3
                            className={cn(
                              'text-lg font-medium mb-0.5 truncate',
                              useClockCard ? 'text-gray-900 dark:text-white' : 'text-black dark:text-white'
                            )}
                          >
                            {word.word}
                          </h3>
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
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
