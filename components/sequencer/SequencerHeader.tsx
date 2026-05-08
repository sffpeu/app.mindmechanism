'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronDown, Disc3, Plus, Save, Trash2 } from 'lucide-react'
import type { Sequence } from '@/lib/sequencer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

type Props = {
  title: string
  isDirty: boolean
  sequences: Sequence[]
  onTitleChange: (title: string) => void
  onSave: () => void
  onLoad: (sequence: Sequence) => void
  onNew: () => void
  onDelete: (id: string) => void
}

function fmt(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function SequencerHeader({
  title,
  isDirty,
  sequences,
  onTitleChange,
  onSave,
  onLoad,
  onNew,
  onDelete,
}: Props) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [saveFlash, setSaveFlash] = useState(false)

  const label = useMemo(() => (saveFlash ? 'Saved' : 'Save'), [saveFlash])

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-[220px] flex-1 items-center gap-2">
        <Disc3 className="h-4 w-4 opacity-80" />
        {editingTitle ? (
          <Input
            autoFocus
            value={title}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setEditingTitle(false)
              if (e.key === 'Escape') setEditingTitle(false)
            }}
            onChange={(e) => onTitleChange(e.target.value)}
            className="h-8 max-w-sm"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingTitle(true)}
            className="inline-flex items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-black/5 dark:hover:bg-white/10"
          >
            <span className="font-semibold">{title || 'Untitled sequence'}</span>
            {isDirty ? <span className="h-2 w-2 rounded-full bg-amber-500" /> : null}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="gap-1.5">
              Saved sequences
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-72 w-72 overflow-y-auto">
            {sequences.length === 0 ? (
              <DropdownMenuItem disabled>No saved sequences</DropdownMenuItem>
            ) : (
              sequences.map((seq) => (
                <div key={seq.id}>
                  <DropdownMenuItem onClick={() => onLoad(seq)}>
                    <div className="flex w-full items-center gap-2">
                      <span className="truncate">{seq.title}</span>
                      <span className="ml-auto text-[11px] opacity-70">{fmt(seq.updatedAt)}</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 dark:text-red-400"
                    onClick={() => {
                      if (window.confirm(`Delete "${seq.title}"?`)) onDelete(seq.id)
                    }}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </div>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          size="sm"
          variant={isDirty ? 'default' : 'outline'}
          disabled={!isDirty}
          onClick={() => {
            onSave()
            setSaveFlash(true)
            window.setTimeout(() => setSaveFlash(false), 1000)
          }}
          className={cn('gap-1.5', saveFlash && 'text-emerald-500')}
        >
          {saveFlash ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
          {label}
        </Button>

        <Button type="button" size="sm" variant="outline" onClick={onNew} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>
      </div>
    </div>
  )
}
