'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Dock, DockIcon, DockItem, DockLabel } from '@/components/ui/dock'
import { cn } from '@/lib/utils'

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

/** Smaller vertical dock (left AppDock uses defaults ~64 / 80). */
const CLOCK_DOCK_MAGNIFICATION = 52
const CLOCK_DOCK_PANEL = 40
const CLOCK_DOCK_DISTANCE = 100

const DotNavigation: React.FC<DotNavigationProps> = ({
  activeDot,
  onDotHover,
}) => {
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

  const Container = isSessionsPage ? motion.div : 'div'
  const Row = isSessionsPage ? motion.div : 'div'

  const rowMotion = (index: number) =>
    isSessionsPage
      ? {
          initial: { x: 25, opacity: 0 },
          animate: { x: isVisible ? 0 : 25, opacity: isVisible ? 1 : 0 },
          transition: {
            duration: 0.5,
            delay: 0.1 + index * 0.05,
            ease: [0.16, 1, 0.3, 1] as const,
          },
        }
      : {}

  return (
    <Container
      {...(isSessionsPage
        ? {
            initial: { x: 50, opacity: 0 },
            animate: { x: isVisible ? 0 : 50, opacity: isVisible ? 1 : 0 },
            transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
          }
        : {})}
      className="fixed right-8 top-[55%] -translate-y-1/2 z-[999] pointer-events-auto max-h-[85vh] overflow-y-auto overflow-x-visible pr-1"
    >
      <Dock
        orientation="vertical"
        magnification={CLOCK_DOCK_MAGNIFICATION}
        panelHeight={CLOCK_DOCK_PANEL}
        distance={CLOCK_DOCK_DISTANCE}
        className="items-end gap-2 py-2 px-2"
      >
        {DOT_HEX.map((hex, index) => (
          <Row key={index} {...rowMotion(index)} className="flex justify-end">
            <Link
              href={`/${index}`}
              className="outline-none"
              onMouseEnter={() => onDotHover?.(index)}
              onMouseLeave={() => onDotHover?.(null)}
              onTouchStart={() => onDotHover?.(index)}
              onTouchEnd={() => onDotHover?.(null)}
            >
              <DockItem
                className={cn(
                  'aspect-square rounded-full transition-colors border-2',
                  isClockActive(index)
                    ? 'border-black dark:border-white shadow-md'
                    : 'border-transparent hover:opacity-95'
                )}
                style={{ backgroundColor: hex }}
              >
                <DockLabel>{index + 1}</DockLabel>
                <DockIcon>
                  <div
                    className="h-full w-full rounded-full border-2 border-white/40 dark:border-black/20"
                    style={{ backgroundColor: hex }}
                  />
                </DockIcon>
              </DockItem>
            </Link>
          </Row>
        ))}

        <Row {...rowMotion(9)} className="flex justify-end">
          <Link
            href="/multiview/1"
            className="outline-none"
            onMouseEnter={() => onDotHover?.(null)}
            onMouseLeave={() => onDotHover?.(null)}
          >
            <DockItem
              className={cn(
                'aspect-square rounded-full transition-colors',
                isM1Active
                  ? 'bg-black dark:bg-white'
                  : 'bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700'
              )}
            >
              <DockLabel>M1</DockLabel>
              <DockIcon>
                <span
                  className={cn(
                    'text-[10px] font-bold leading-none',
                    isM1Active ? 'text-white dark:text-black' : 'text-neutral-600 dark:text-neutral-300'
                  )}
                >
                  M1
                </span>
              </DockIcon>
            </DockItem>
          </Link>
        </Row>

        <Row {...rowMotion(10)} className="flex justify-end">
          <Link
            href="/multiview/2"
            className="outline-none"
            onMouseEnter={() => onDotHover?.(null)}
            onMouseLeave={() => onDotHover?.(null)}
          >
            <DockItem
              className={cn(
                'aspect-square rounded-full transition-colors',
                isM2Active
                  ? 'bg-black dark:bg-white'
                  : 'bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700'
              )}
            >
              <DockLabel>M2</DockLabel>
              <DockIcon>
                <span
                  className={cn(
                    'text-[10px] font-bold leading-none',
                    isM2Active ? 'text-white dark:text-black' : 'text-neutral-600 dark:text-neutral-300'
                  )}
                >
                  M2
                </span>
              </DockIcon>
            </DockItem>
          </Link>
        </Row>
      </Dock>
    </Container>
  )
}

export default DotNavigation
