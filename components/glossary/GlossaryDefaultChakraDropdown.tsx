'use client'

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
  scopeFilter: 'All' | 'Default' | 'My Words'
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'px-2.5 py-1 rounded-md text-xs font-medium transition-all shrink-0 inline-flex items-center gap-1 border min-h-[1.75rem]',
            isDefault
              ? 'border-transparent'
              : 'bg-white dark:bg-black/30 border-black/5 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-black/20 dark:hover:border-white/20'
          )}
          style={
            isDefault
              ? {
                  backgroundColor: `${clockHex}20`,
                  color: clockHex,
                  borderColor: clockHex,
                }
              : undefined
          }
          aria-label="Default glossary scope and chakra filter"
        >
          <Layers className="w-3 h-3 shrink-0" />
          <span className="max-w-[10rem] sm:max-w-[14rem] truncate">{label}</span>
          <ChevronDown className="w-3 h-3 shrink-0 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[min(70vh,24rem)] overflow-y-auto">
        <DropdownMenuItem
          onClick={() => onSelectAllDefault()}
          className={cn(isDefault && selectedClockId === null && 'bg-accent')}
        >
          All default words
        </DropdownMenuItem>
        {clockTitles.map((title, id) => (
          <DropdownMenuItem
            key={id}
            onClick={() => onSelectChakra(id)}
            className={cn(isDefault && selectedClockId === id && 'bg-accent')}
          >
            <span className="mr-2 inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: CLOCK_HEX[id] }} />
            {title}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
