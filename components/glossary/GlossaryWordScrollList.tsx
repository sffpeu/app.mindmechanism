'use client'

import type { MutableRefObject, Ref } from 'react'
import { UserCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { clockTitles } from '@/lib/clockTitles'
import type { GlossaryWord } from '@/types/Glossary'
import { SpeakButton } from '@/components/glossary/SpeakButton'

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
  clockHexPalette: readonly string[]
  hasVoiceNoteWordIds: Set<string>
  emptyMessage?: string
}

export function GlossaryWordScrollList({
  loading,
  letterSections,
  scrollContainerRef,
  sectionRefsMap,
  selectedCard,
  onSelectCard,
  clockHexPalette,
  hasVoiceNoteWordIds,
  emptyMessage = 'No words found',
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
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">{emptyMessage}</div>
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
                  const isPersonal = word.personal === true
                  const useClockCard = tint != null && !isUserOnly
                  const displayDefinition = isPersonal ? (word.own_definition || word.definition) : word.definition

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
                          : isPersonal
                            ? {
                                borderLeftWidth: '4px',
                                borderLeftColor: tint?.hex ?? '#6b7280',
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
                      {/* Wheel title row */}
                      <div className="flex items-center justify-between mb-1">
                        {useClockCard && word.clock_id != null ? (
                          <p
                            className="text-[10px] font-semibold uppercase tracking-widest truncate"
                            style={{ color: tint.hex }}
                          >
                            {clockTitles[word.clock_id]}
                          </p>
                        ) : word.source === 'user' ? (
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-purple-500 dark:text-purple-400">
                            {isPersonal ? '◆ My Word' : 'My Word'}
                          </span>
                        ) : (
                          <span />
                        )}
                        {/* Badges: grade + rating */}
                        <div className="flex items-center ml-2 space-x-1.5 shrink-0">
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
                          {word.source === 'user' && (
                            <UserCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          )}
                        </div>
                      </div>

                      {/* Word + phonetic */}
                      <div className="flex items-center gap-1.5">
                        <h3
                          className={cn(
                            'text-lg font-medium truncate',
                            useClockCard ? 'text-gray-900 dark:text-white' : 'text-black dark:text-white'
                          )}
                        >
                          {word.word}
                        </h3>
                        <SpeakButton
                          word={word.word}
                          language={word.language}
                          audioUrl={word.audio_url}
                          hex={tint?.hex}
                        />
                        {hasVoiceNoteWordIds.has(word.id) && (
                          <span
                            title="Has voice notes"
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: tint?.hex ?? '#9ca3af' }}
                          />
                        )}
                      </div>
                      {word.phonetic_spelling && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono block mb-1">
                          {word.phonetic_spelling}
                        </span>
                      )}

                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">{displayDefinition}</p>
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
