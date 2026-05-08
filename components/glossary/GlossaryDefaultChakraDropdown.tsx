'use client'

import type { CSSProperties } from 'react'
import { ChevronDown, Layers } from 'lucide-react'
import { clockTitles } from '@/lib/clockTitles'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const CLOCK_HEX = ['#fd290a', '#fba63b', '#f7da5f', '#6dc037', '#156fde', '#941952', '#541b96', '#ee5fa7', '#56c1ff']

export type GlossaryDefaultChakraDropdownProps = {
  scopeFilter: 'All' | 'Default' | 'Mine' | 'My Words'
  selectedClockId: number | null
  onSelectAllDefault: () => void
  onSelectChakra: (clockId: number) => void
}

export function GlossaryDefaultChakraDropdown({
  scopeFilter,
  selectedClockId,
  onSelectAllDefault,
  onSelectChakra,
}: GlossaryDefaultChakraDropdownProps) {
  const isDefault = scopeFilter === 'Default'
  const clockHex =
    isDefault && selectedClockId != null ? (CLOCK_HEX[selectedClockId] ?? '#6b7280') : '#6b7280'

  const label =
    isDefault && selectedClockId != null ? clockTitles[selectedClockId] ?? 'Default' : 'Default'

  const chakraHover =
    isDefault && selectedClockId != null
      ? 'hover:border-[color:var(--chakra-hover)] hover:text-[color:var(--chakra-hover)] hover:bg-[color:color-mix(in_srgb,var(--chakra-hover)_14%,transparent)] dark:hover:bg-[color:color-mix(in_srgb,var(--chakra-hover)_20%,transparent)]'
      : 'hover:border-black/20 dark:hover:border-white/20'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'px-2.5 py-1 rounded-md text-xs font-medium transition-all shrink-0 inline-flex items-center gap-1 border min-h-[1.75rem]',
            'bg-white dark:bg-black/30 border-black/5 dark:border-white/10 text-gray-600 dark:text-gray-400',
            chakraHover
          )}
          style={
            isDefault && selectedClockId != null
              ? ({ ['--chakra-hover' as string]: clockHex } as CSSProperties)
              : undefined
          }
          aria-label="Default glossary scope and chakra filter"
        >
          <Layers className="w-3 h-3 shrink-0" />
          <span className="max-w-[10rem] sm:max-w-[14rem] truncate">{label}</span>
          <ChevronDown className="w-3 h-3 shrink-0 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-[min(70vh,24rem)] overflow-y-auto bg-white dark:bg-neutral-950 border-zinc-200 dark:border-zinc-800 shadow-lg"
      >
        <DropdownMenuItem
          onClick={() => onSelectAllDefault()}
          className={cn(isDefault && selectedClockId === null && 'bg-accent')}
        >
          All default words
        </DropdownMenuItem>
        {clockTitles.map((title, id) => {
          const hex = CLOCK_HEX[id]
          return (
            <DropdownMenuItem
              key={id}
              onClick={() => onSelectChakra(id)}
              style={{ ['--clock-hex' as string]: hex } as CSSProperties}
              className={cn(
                'transition-colors',
                'hover:bg-[color:color-mix(in_srgb,var(--clock-hex)_14%,transparent)] hover:text-[color:var(--clock-hex)]',
                'focus:bg-[color:color-mix(in_srgb,var(--clock-hex)_14%,transparent)] focus:text-[color:var(--clock-hex)]',
                'dark:hover:bg-[color:color-mix(in_srgb,var(--clock-hex)_20%,transparent)] dark:focus:bg-[color:color-mix(in_srgb,var(--clock-hex)_20%,transparent)]',
                isDefault && selectedClockId === id && 'bg-accent text-accent-foreground'
              )}
            >
              {title}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
