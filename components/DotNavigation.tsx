'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Dock, DockIcon, DockItem, DockLabel } from '@/components/ui/dock'
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
    <Dock orientation="vertical" dockEdge="right" className="items-end">
      {DOT_HEX.map((hex, index) => (
        <Link
          key={index}
          href={`/${index}`}
          className="outline-none border-none no-underline"
          onMouseEnter={() => onDotHover?.(index)}
          onMouseLeave={() => onDotHover?.(null)}
          onTouchStart={() => onDotHover?.(index)}
          onTouchEnd={() => onDotHover?.(null)}
        >
          <DockItem
            className={`aspect-square rounded-full transition-colors ${
              isClockActive(index)
                ? 'bg-black dark:bg-white'
                : 'bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700'
            }`}
          >
            <DockLabel>{clockTitles[index] ?? index + 1}</DockLabel>
            <DockIcon>
              {isClockActive(index) ? (
                <div className="flex h-full w-full items-center justify-center">
                  <div
                    className="h-[55%] w-[55%] rounded-full"
                    style={{ backgroundColor: hex }}
                  />
                </div>
              ) : (
                <div className="h-full w-full rounded-full" style={{ backgroundColor: hex }} />
              )}
            </DockIcon>
          </DockItem>
        </Link>
      ))}

      <Link href="/multiview/1" className="outline-none border-none no-underline">
        <DockItem
          className={`aspect-square rounded-full ring-2 ring-inset ring-offset-0 transition-colors ${
            isM1Active
              ? 'bg-black dark:bg-white ring-white dark:ring-black'
              : 'bg-gray-200 ring-black dark:bg-neutral-800 dark:ring-white hover:bg-gray-300 dark:hover:bg-neutral-700'
          }`}
        >
          <DockLabel>M1</DockLabel>
          <DockIcon>
            <span
              className={`text-[10px] font-bold leading-none ${
                isM1Active ? 'text-white dark:text-black' : 'text-neutral-600 dark:text-neutral-300'
              }`}
            >
              M1
            </span>
          </DockIcon>
        </DockItem>
      </Link>

      <Link href="/multiview/2" className="outline-none border-none no-underline">
        <DockItem
          className={`aspect-square rounded-full ring-2 ring-inset ring-offset-0 transition-colors ${
            isM2Active
              ? 'bg-black dark:bg-white ring-white dark:ring-black'
              : 'bg-gray-200 ring-black dark:bg-neutral-800 dark:ring-white hover:bg-gray-300 dark:hover:bg-neutral-700'
          }`}
        >
          <DockLabel>M2</DockLabel>
          <DockIcon>
            <span
              className={`text-[10px] font-bold leading-none ${
                isM2Active ? 'text-white dark:text-black' : 'text-neutral-600 dark:text-neutral-300'
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
    <div className="fixed right-0 top-0 bottom-0 z-[999] flex items-center justify-end pointer-events-none pr-3">
      {isSessionsPage ? (
        <motion.div
          className="pointer-events-auto max-h-full overflow-y-auto overflow-x-visible"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: isVisible ? 0 : 50, opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {dock}
        </motion.div>
      ) : (
        <div className="pointer-events-auto max-h-full overflow-y-auto overflow-x-visible">{dock}</div>
      )}
    </div>
  )
}

export default DotNavigation
