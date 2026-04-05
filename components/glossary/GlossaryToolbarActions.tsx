'use client'

import { Plus, Pencil, Network } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GlossaryWord } from '@/types/Glossary'

export type GlossaryToolbarActionsProps = {
  visualMode: boolean
  onToggleVisual: () => void
  selectedCard: GlossaryWord | null
  onEdit: () => void
  onAdd: () => void
}

export function GlossaryToolbarActions({
  visualMode,
  onToggleVisual,
  selectedCard,
  onEdit,
  onAdd,
}: GlossaryToolbarActionsProps) {
  return (
    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
      <button
        type="button"
        onClick={onToggleVisual}
        className={cn(
          'px-2.5 py-1.5 rounded-full text-xs border flex items-center gap-1 shrink-0 transition-all',
          visualMode
            ? 'bg-slate-900 text-white dark:bg-white dark:text-black border-transparent'
            : 'bg-white dark:bg-black/30 border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 text-gray-700 dark:text-gray-300'
        )}
        aria-pressed={visualMode}
        aria-label={visualMode ? 'Switch to list view' : 'Switch to radial tree view'}
      >
        <Network className="w-3.5 h-3.5" />
        {visualMode ? 'List' : 'Visual'}
      </button>
      {selectedCard && (
        <button
          type="button"
          onClick={onEdit}
          className="px-2.5 py-1.5 rounded-full text-xs bg-white dark:bg-black/30 border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 text-gray-700 dark:text-gray-300 flex items-center gap-1"
          aria-label="Edit word"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
      )}
      <button
        type="button"
        onClick={onAdd}
        className="px-2.5 py-1.5 rounded-full text-xs bg-white dark:bg-black/30 border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 text-gray-700 dark:text-gray-300 flex items-center gap-1"
        aria-label="Add word"
      >
        <Plus className="w-3.5 h-3.5" />
        Add
      </button>
    </div>
  )
}
