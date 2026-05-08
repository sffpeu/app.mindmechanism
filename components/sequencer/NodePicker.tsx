'use client'

import { Check } from 'lucide-react'
import type { RefObject } from 'react'
import { NODE_META, type NodeIndex } from '@/lib/sequencer'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const NODE_COLORS: Record<NodeIndex, string> = {
  0: '#64748b',
  1: '#4f46e5',
  2: '#f59e0b',
  3: '#84cc16',
  4: '#0ea5e9',
  5: '#8b5cf6',
  6: '#facc15',
  7: '#ec4899',
  8: '#e5e7eb',
}

type Props = {
  currentNodeIndex: NodeIndex | null
  onSelect: (nodeIndex: NodeIndex | null) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  triggerRef: RefObject<HTMLElement>
}

export function NodePicker({
  currentNodeIndex,
  onSelect,
  open,
  onOpenChange,
  triggerRef,
}: Props) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef as unknown as RefObject<HTMLButtonElement>}
          type="button"
          className="absolute inset-0 opacity-0 pointer-events-none"
          aria-hidden
          tabIndex={-1}
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[270px] p-2">
        <button
          type="button"
          className={cn(
            'w-full rounded px-2 py-1.5 text-left text-xs hover:bg-black/5 dark:hover:bg-white/10',
            currentNodeIndex == null && 'font-semibold'
          )}
          onClick={() => {
            onSelect(null)
            onOpenChange(false)
          }}
        >
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full border border-black/20 dark:border-white/30" />
            Clear (rest)
            {currentNodeIndex == null ? <Check className="ml-auto h-3.5 w-3.5" /> : null}
          </span>
        </button>
        <div className="my-1 h-px bg-black/10 dark:bg-white/10" />
        <div className="max-h-64 overflow-y-auto space-y-1 pr-0.5">
          {NODE_META.map((node) => (
            <button
              key={node.index}
              type="button"
              className={cn(
                'w-full rounded px-2 py-1.5 text-left text-xs hover:bg-black/5 dark:hover:bg-white/10',
                currentNodeIndex === node.index && 'bg-black/5 dark:bg-white/10'
              )}
              onClick={() => {
                onSelect(node.index)
                onOpenChange(false)
              }}
            >
              <span className="inline-flex w-full items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full border border-black/15 dark:border-white/20"
                  style={{ backgroundColor: NODE_COLORS[node.index] }}
                />
                <span className="font-semibold">{node.title}</span>
                <span className="text-[11px] opacity-70">{node.planet}</span>
                <span className="ml-auto text-[11px] opacity-70">{node.audibleHz.toFixed(1)} Hz</span>
                {currentNodeIndex === node.index ? <Check className="h-3.5 w-3.5" /> : null}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { NODE_COLORS }
