'use client'

import { UserCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type GlossaryAllMyScopeButtonsProps = {
  scopeFilter: 'All' | 'Default' | 'Mine' | 'My Words'
  onScope: (scope: 'All' | 'Mine' | 'My Words') => void
}

export function GlossaryAllMyScopeButtons({ scopeFilter, onScope }: GlossaryAllMyScopeButtonsProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {(['All', 'Mine', 'My Words'] as const).map((scope) => (
        <button
          key={scope}
          type="button"
          onClick={() => onScope(scope)}
          className={cn(
            'px-2.5 py-1 rounded-md text-xs font-medium transition-all shrink-0 flex items-center gap-1 border',
            scopeFilter === scope
              ? scope === 'All'
                ? 'bg-gray-200 dark:bg-white/15 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-white/20'
                : scope === 'Mine'
                  ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-500/40'
                  : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-500/40'
              : 'bg-white dark:bg-black/30 border-black/5 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-black/20 dark:hover:border-white/20'
          )}
        >
          {(scope === 'Mine' || scope === 'My Words') && <UserCircle2 className="w-3 h-3 shrink-0" />}
          {scope}
        </button>
      ))}
    </div>
  )
}
