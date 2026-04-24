'use client'

import { useEffect, useState } from 'react'
import { X, Lock } from 'lucide-react'
import { clockTitles } from '@/lib/clockTitles'
import { cn } from '@/lib/utils'
import type { GlossaryWord, GlossaryDefinition } from '@/types/Glossary'
import { getWordDefinition } from '@/lib/glossary'
import { SUPPORTED_LANGUAGES } from '@/types/Glossary'

export type GlossaryVisualWordPanelProps = {
  word: GlossaryWord
  clockHexPalette: readonly string[]
  onClose: () => void
}

function languageName(code: string | undefined): string | null {
  if (!code || code === 'en') return null
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.name ?? code.toUpperCase()
}

export function GlossaryVisualWordPanel({ word, clockHexPalette, onClose }: GlossaryVisualWordPanelProps) {
  const cid = word.clock_id
  const hex = cid != null && cid >= 0 && cid < clockHexPalette.length ? clockHexPalette[cid] : '#6b7280'
  const [extDef, setExtDef] = useState<GlossaryDefinition | null>(null)
  const [loadingExt, setLoadingExt] = useState(false)
  const lang = languageName(word.language)

  useEffect(() => {
    setExtDef(null)
    if (!word.id) return
    setLoadingExt(true)
    getWordDefinition(word.id).then((d) => {
      setExtDef(d)
      setLoadingExt(false)
    })
  }, [word.id])

  return (
    <aside
      className={cn(
        'flex flex-col min-h-0 w-full sm:h-full sm:w-[min(100vw-1rem,22rem)] md:w-[24rem] shrink-0',
        'max-h-[min(50vh,28rem)] sm:max-h-none border-t sm:border-t-0 sm:border-l border-black/10 dark:border-white/10',
        'bg-white/95 dark:bg-black/80 backdrop-blur-md shadow-xl',
        'animate-in slide-in-from-bottom sm:slide-in-from-right duration-300 ease-out'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 p-4 border-b border-black/5 dark:border-white/10 shrink-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {cid != null && (
              <p
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: hex }}
              >
                {clockTitles[cid] ?? 'Glossary'}
              </p>
            )}
            {lang && (
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-black/10 dark:border-white/15 text-gray-500 dark:text-gray-400 font-medium">
                {lang}
              </span>
            )}
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-1 break-words">{word.word}</h2>
          {word.phonetic_spelling && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-mono">{word.phonetic_spelling}</p>
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

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-5">
        {/* Badges */}
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

        {/* Base definition */}
        <div>
          <h3 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
            Definition
          </h3>
          <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {word.definition || '—'}
          </p>
        </div>

        {/* Extended definitions — from glossary_definitions collection */}
        {loadingExt && (
          <p className="text-xs text-gray-400 dark:text-gray-500 animate-pulse">Loading extended definition…</p>
        )}

        {extDef?.standard && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: hex }}>
                Standard Definition
              </h3>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                style={{ backgroundColor: `${hex}18`, color: hex }}
              >
                Standard
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {extDef.standard}
            </p>
          </div>
        )}

        {extDef?.academic && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: hex }}>
                Sovereign Definition
              </h3>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                style={{ backgroundColor: `${hex}18`, color: hex }}
              >
                Sovereign
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {extDef.academic}
            </p>
          </div>
        )}

        {/* Tier prompts — shown when no extended content is available yet */}
        {!loadingExt && !extDef?.standard && (
          <div className="rounded-lg border border-black/5 dark:border-white/10 p-3 flex items-start gap-2.5">
            <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gray-400 dark:text-gray-500" />
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Standard Definition</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed">
                Extended definition available on the Standard tier.
              </p>
            </div>
          </div>
        )}

        {!loadingExt && !extDef?.academic && (
          <div className="rounded-lg border border-black/5 dark:border-white/10 p-3 flex items-start gap-2.5">
            <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5 text-gray-400 dark:text-gray-500" />
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Sovereign Definition</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed">
                Academic and clinical depth available on the Sovereign tier.
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
