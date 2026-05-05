'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { GlossaryWord, GlossaryDefinition } from '@/types/Glossary'
import { SUPPORTED_LANGUAGES } from '@/types/Glossary'
import { getWordDefinition } from '@/lib/glossary'
import { cn } from '@/lib/utils'
import { SpeakButton } from '@/components/glossary/SpeakButton'

export type GlossaryVisualMagnifierProps = {
  word: GlossaryWord | null
  hex: string
  chakraTitle: string
  onDismiss: () => void
}

function languageName(code: string | undefined): string | null {
  if (!code || code === 'en') return null
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.name ?? code.toUpperCase()
}

/**
 * Fullscreen glossary visual: centered “loupe” with word + definitions.
 * Dismiss via backdrop, Escape, or tapping word / definition (same behaviour as second click on the radial label).
 */
export function GlossaryVisualMagnifier({ word, hex, chakraTitle, onDismiss }: GlossaryVisualMagnifierProps) {
  const [extDef, setExtDef] = useState<GlossaryDefinition | null>(null)
  const [loadingExt, setLoadingExt] = useState(false)
  const lang = word ? languageName(word.language) : null

  useEffect(() => {
    setExtDef(null)
    if (!word?.id) return
    setLoadingExt(true)
    getWordDefinition(word.id).then((d) => {
      setExtDef(d)
      setLoadingExt(false)
    })
  }, [word?.id])

  useEffect(() => {
    if (!word) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [word, onDismiss])

  return (
    <AnimatePresence mode="wait">
      {word && (
        <motion.div
          key={word.id}
          className="pointer-events-auto absolute inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            role="presentation"
            className="absolute inset-0 bg-black/30 dark:bg-black/55 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
            onWheel={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="glossary-magnifier-title"
            className={cn(
              'relative z-[101] flex max-h-[min(82vh,680px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl',
              'border-black/10 dark:border-white/15 bg-white/96 dark:bg-gray-950/96'
            )}
            initial={{ scale: 0.82, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="shrink-0 cursor-pointer border-b border-black/5 px-5 pb-4 pt-5 dark:border-white/10"
              onClick={onDismiss}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: hex }}
              >
                {chakraTitle}
              </p>
              {lang && (
                <span className="mt-1 inline-block text-[10px] font-medium text-gray-500 dark:text-gray-400">
                  {lang}
                </span>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <h2 id="glossary-magnifier-title" className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {word.word}
                </h2>
                <SpeakButton word={word.word} language={word.language} audioUrl={word.audio_url} hex={hex} />
              </div>
              {word.phonetic_spelling && (
                <p className="mt-1 font-mono text-sm text-gray-500 dark:text-gray-400">{word.phonetic_spelling}</p>
              )}
              <p className="mt-2 text-center text-[11px] text-gray-400 dark:text-gray-500">
                Tap word, definition, or outside to close
              </p>
            </div>

            <div
              className="min-h-0 flex-1 cursor-pointer overflow-y-auto overscroll-contain px-5 py-4"
              onClick={onDismiss}
            >
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Definition
              </h3>
              <p className="text-base leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {word.definition || '—'}
              </p>

              {loadingExt && (
                <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 animate-pulse">Loading extended definition…</p>
              )}

              {extDef?.standard && (
                <div className="mt-6">
                  <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: hex }}>
                    Standard definition
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {extDef.standard}
                  </p>
                </div>
              )}

              {extDef?.academic && (
                <div className="mt-6">
                  <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: hex }}>
                    Sovereign definition
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {extDef.academic}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
