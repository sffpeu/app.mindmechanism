'use client'

import { cn } from '@/lib/utils'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export type GlossaryAlphabetStripProps = {
  selectedLetter: string | null
  onLetterClick: (letter: string) => void
  className?: string
}

export function GlossaryAlphabetStrip({ selectedLetter, onLetterClick, className }: GlossaryAlphabetStripProps) {
  return (
    <div
      id="az-filter-glossary"
      className={cn('flex flex-wrap gap-1', className)}
      role="region"
      aria-label="Jump to letter"
    >
      {ALPHABET.map((letter) => (
        <button
          key={letter}
          type="button"
          onClick={() => onLetterClick(letter)}
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all shrink-0 border aspect-square',
            selectedLetter === letter
              ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
              : 'bg-white dark:bg-black/30 border-black/5 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-black/50 text-gray-700 dark:text-gray-300'
          )}
          aria-label={`Jump to ${letter}`}
          aria-current={selectedLetter === letter ? 'true' : undefined}
        >
          {letter}
        </button>
      ))}
    </div>
  )
}
