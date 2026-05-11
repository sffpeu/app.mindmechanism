'use client'

import { usePortal } from '@/contexts/PortalContext'
import type { Portal } from '@/lib/portalConfig'

const PORTALS: { id: Portal; label: string }[] = [
  { id: 'consumer', label: 'Consumer' },
  { id: 'academic', label: 'Academic' },
  { id: 'corporate', label: 'Corporate' },
]

export function DoormanBar() {
  const { isDoorman, viewingAs, setViewingAs } = usePortal()

  if (!isDoorman) return null

  return (
    <div className="w-full shrink-0 bg-gray-950 border-b border-gray-800 px-4 py-1.5 flex items-center gap-4">
      <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-500">
        Doorman
      </span>
      <div className="flex items-center gap-1">
        {PORTALS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setViewingAs(p.id)}
            className={`
              px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.15em] transition-colors
              ${viewingAs === p.id
                ? 'text-gray-100 bg-gray-800'
                : 'text-gray-500 hover:text-gray-300'
              }
            `}
          >
            {p.label}
          </button>
        ))}
      </div>
      <span className="text-[9px] text-gray-600 ml-auto">
        All nodes · All features
      </span>
    </div>
  )
}
