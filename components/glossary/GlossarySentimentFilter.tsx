'use client'

import { Plus, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SentimentValue = '+' | '~' | '-'

export type GlossarySentimentFilterProps = {
  selectedSentiment: SentimentValue | null
  onToggle: (value: SentimentValue) => void
}

const ITEMS = [
  { value: '+' as const, icon: 'plus' as const, label: 'Positive' },
  { value: '~' as const, icon: 'tilde' as const, label: 'Neutral' },
  { value: '-' as const, icon: 'minus' as const, label: 'Negative' },
] as const

export function GlossarySentimentFilter({ selectedSentiment, onToggle }: GlossarySentimentFilterProps) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      {ITEMS.map(({ value, icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => onToggle(value)}
          title={label}
          aria-label={`${label} sentiment`}
          aria-pressed={selectedSentiment === value}
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all shrink-0 border aspect-square',
            selectedSentiment === value
              ? value === '+'
                ? 'bg-emerald-100 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-500/40'
                : value === '-'
                  ? 'bg-rose-100 dark:bg-rose-500/25 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-500/40'
                  : 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-500/40'
              : value === '+'
                ? 'bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                : value === '-'
                  ? 'bg-rose-50/80 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20'
                  : 'bg-slate-50/80 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-500/20 hover:bg-slate-100 dark:hover:bg-slate-500/20'
          )}
        >
          {icon === 'plus' ? (
            <Plus className="w-4 h-4" strokeWidth={2.5} />
          ) : icon === 'minus' ? (
            <Minus className="w-4 h-4" strokeWidth={2.5} />
          ) : (
            <span className="text-base leading-none">~</span>
          )}
        </button>
      ))}
    </div>
  )
}
