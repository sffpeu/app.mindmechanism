'use client'

import { X } from 'lucide-react'
import { clockTitles } from '@/lib/clockTitles'
import { cn } from '@/lib/utils'
import type { GlossaryWord } from '@/types/Glossary'

export type GlossaryVisualWordPanelProps = {
  word: GlossaryWord
  clockHexPalette: readonly string[]
  onClose: () => void
}

export function GlossaryVisualWordPanel({ word, clockHexPalette, onClose }: GlossaryVisualWordPanelProps) {
  const cid = word.clock_id
  const hex = cid != null && cid >= 0 && cid < clockHexPalette.length ? clockHexPalette[cid] : '#6b7280'

  return (
    <aside
      className={cn(
        'flex flex-col min-h-0 w-full sm:h-full sm:w-[min(100vw-1rem,22rem)] md:w-[24rem] shrink-0',
        'max-h-[min(50vh,28rem)] sm:max-h-none border-t sm:border-t-0 sm:border-l border-black/10 dark:border-white/10',
        'bg-white/95 dark:bg-black/80 backdrop-blur-md shadow-xl',
        'animate-in slide-in-from-bottom sm:slide-in-from-right duration-300 ease-out'
      )}
    >
      <div className="flex items-start justify-between gap-2 p-4 border-b border-black/5 dark:border-white/10 shrink-0">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {cid != null ? clockTitles[cid] ?? 'Glossary' : 'Glossary'}
          </p>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-0.5 break-words">{word.word}</h2>
          {word.phonetic_spelling && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{word.phonetic_spelling}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md p-2 text-gray-500 hover:bg-black/5 dark:hover:bg-white/10 dark:text-gray-400"
          aria-label="Close word details"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: `${hex}22`, color: hex }}
          >
            {word.rating === '+' ? 'Positive' : word.rating === '-' ? 'Negative' : 'Neutral'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Grade {word.grade}</span>
          {word.source === 'user' && (
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Your word</span>
          )}
        </div>
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Definition
          </h3>
          <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {word.definition || '—'}
          </p>
        </div>
      </div>
    </aside>
  )
}
