'use client'

import { Search } from 'lucide-react'

export type GlossarySearchBarProps = {
  value: string
  onChange: (value: string) => void
  wordCount: number
  className?: string
}

export function GlossarySearchBar({ value, onChange, wordCount, className }: GlossarySearchBarProps) {
  return (
    <div className={className}>
      <div className="relative w-full">
        <input
          type="text"
          placeholder="Search words or definitions"
          className="w-full pl-10 pr-24 py-2 rounded-lg bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all text-sm text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Search words or definitions"
        />
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <span className="absolute right-3 top-2 text-xs text-gray-400 dark:text-gray-500 tabular-nums">
          {wordCount} words
        </span>
      </div>
    </div>
  )
}
