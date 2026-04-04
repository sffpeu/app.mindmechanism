'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Dock, DockIcon, DockItem } from '@/components/ui/dock'
import { clockTitles } from '@/lib/clockTitles'

interface DotNavigationProps {
  activeDot: number
  isSmallMultiView?: boolean
  onOutlinedDotClick?: () => void
  onDotHover?: (index: number | null) => void
}

// Clock 1–9 hex palette (match Clock.tsx, glossary, sessions)
const DOT_HEX = [
  '#fd290a',
  '#fba63b',
  '#f7da5f',
  '#6dc037',
  '#156fde',
  '#941952',
  '#541b96',
  '#ee5fa7',
  '#56c1ff',
] as const

const DotNavigation: React.FC<DotNavigationProps> = ({ activeDot, onDotHover }) => {
  const [isVisible, setIsVisible] = useState(false)
  const pathname = usePathname()
  const isSessionsPage = pathname === '/sessions'

  useEffect(() => {
    if (isSessionsPage) {
      const timer = setTimeout(() => setIsVisible(true), 500)
      return () => clearTimeout(timer)
    }
    setIsVisible(true)
  }, [isSessionsPage])

  const clockMatch = pathname?.match(/^\/(\d)$/)
  const activeClockFromPath =
    clockMatch !== null && clockMatch !== undefined ? parseInt(clockMatch[1], 10) : null

  const isClockActive = (index: number) => {
    if (activeClockFromPath !== null) return activeClockFromPath === index
    return activeDot === index && activeDot >= 0 && activeDot <= 8
  }

  const isM1Active = Boolean(pathname?.startsWith('/multiview/1'))
  const isM2Active = Boolean(pathname?.startsWith('/multiview/2'))

  const dock = (
    <Dock
      orientation="vertical"
      dockEdge="right"
      className="items-end gap-2 py-2 px-2"
      panelHeight={32}
      magnification={40}
      minItemSize={20}
      distance={72}
    >
      {DOT_HEX.map((hex, index) => (
        <Link
          key={index}
          href={`/${index}`}
          className="outline-none border-none no-underline"
          aria-label={clockTitles[index] ?? `Clock ${index + 1}`}
          onMouseEnter={() => onDotHover?.(index)}
          onMouseLeave={() => onDotHover?.(null)}
          onTouchStart={() => onDotHover?.(index)}
          onTouchEnd={() => onDotHover?.(null)}
        >
          <DockItem
            className={`aspect-square rounded-full transition-shadow ring-2 ring-inset ${
              isClockActive(index)
                ? 'ring-white/95 shadow-md dark:ring-neutral-950 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.35)]'
                : 'ring-black/25 hover:brightness-110 dark:ring-white/30'
            }`}
            style={{ backgroundColor: hex }}
          >
            <DockIcon>
              {isClockActive(index) ? (
                <div
                  className="h-[42%] w-[42%] rounded-full bg-white/95 shadow-sm dark:bg-neutral-950/90"
                  aria-hidden
                />
              ) : (
                <div
                  className="h-[38%] w-[38%] rounded-full bg-black/20 dark:bg-white/25"
                  aria-hidden
                />
              )}
            </DockIcon>
          </DockItem>
        </Link>
      ))}

      <Link href="/multiview/1" className="outline-none border-none no-underline" aria-label="Multiview 1">
        <DockItem
          className={`aspect-square rounded-full bg-slate-400/90 ring-2 ring-inset transition-shadow dark:bg-slate-600/90 ${
            isM1Active
              ? 'ring-white/95 shadow-md dark:ring-neutral-950'
              : 'ring-black/25 hover:brightness-110 dark:ring-white/30'
          }`}
        >
          <DockIcon>
            <span
              className={`text-[9px] font-bold leading-none text-white drop-shadow-sm dark:text-white ${
                isM1Active ? 'opacity-100' : 'opacity-90'
              }`}
            >
              M1
            </span>
          </DockIcon>
        </DockItem>
      </Link>

      <Link href="/multiview/2" className="outline-none border-none no-underline" aria-label="Multiview 2">
        <DockItem
          className={`aspect-square rounded-full bg-slate-500/90 ring-2 ring-inset transition-shadow dark:bg-slate-500/90 ${
            isM2Active
              ? 'ring-white/95 shadow-md dark:ring-neutral-950'
              : 'ring-black/25 hover:brightness-110 dark:ring-white/30'
          }`}
        >
          <DockIcon>
            <span
              className={`text-[9px] font-bold leading-none text-white drop-shadow-sm dark:text-white ${
                isM2Active ? 'opacity-100' : 'opacity-90'
              }`}
            >
              M2
            </span>
          </DockIcon>
        </DockItem>
      </Link>
    </Dock>
  )

  return (
    <div className="fixed right-0 top-0 bottom-0 z-[10000] flex items-center justify-end pointer-events-none pr-2">
      {isSessionsPage ? (
        <motion.div
          className="pointer-events-auto max-h-full overflow-visible"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: isVisible ? 0 : 50, opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {dock}
        </motion.div>
      ) : (
        <div className="pointer-events-auto max-h-full overflow-visible">{dock}</div>
      )}
    </div>
  )
}

export default DotNavigation
