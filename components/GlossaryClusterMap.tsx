'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import {
  forceSimulation,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
} from 'd3-force'
import type { SimulationNodeDatum } from 'd3-force'
import { GlossaryWord, WordRating } from '@/types/Glossary'
import { cn } from '@/lib/utils'

/** Match glossary sentiment pill colors (emerald / slate / rose). */
const RATING_FILL: Record<WordRating, string> = {
  '+': '#10b981',
  '~': '#64748b',
  '-': '#f43f5e',
}

const RATING_STROKE: Record<WordRating, string> = {
  '+': '#059669',
  '~': '#475569',
  '-': '#e11d48',
}

type MapNode = GlossaryWord &
  SimulationNodeDatum & {
    rating: WordRating
  }

function normalizeRating(r: GlossaryWord['rating'] | undefined): WordRating {
  if (r === '+' || r === '-' || r === '~') return r
  return '~'
}

function targetX(rating: WordRating, width: number): number {
  const pad = width * 0.12
  const usable = width - pad * 2
  if (rating === '+') return pad + usable * 0.15
  if (rating === '-') return pad + usable * 0.85
  return pad + usable * 0.5
}

export interface GlossaryClusterMapProps {
  words: GlossaryWord[]
  className?: string
}

export function GlossaryClusterMap({ words, className }: GlossaryClusterMapProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 640, h: 480 })
  const [nodes, setNodes] = useState<MapNode[]>([])
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [pinnedId, setPinnedId] = useState<string | null>(null)

  const measure = useCallback(() => {
    const el = wrapRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const w = Math.max(320, Math.floor(r.width))
    const h = Math.max(400, Math.min(720, Math.floor(Math.min(window.innerHeight * 0.7, r.height || window.innerHeight * 0.65))))
    setSize({ w, h })
  }, [])

  useEffect(() => {
    measure()
    const ro = new ResizeObserver(() => measure())
    const el = wrapRef.current
    if (el) ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  const wordKey = useMemo(
    () => words.map(w => `${w.id}:${w.word}`).join('|'),
    [words]
  )

  useEffect(() => {
    const { w, h } = size
    if (words.length === 0) {
      setNodes([])
      return
    }

    const seed = (): MapNode[] =>
      words.map(word => {
        const rating = normalizeRating(word.rating)
        const jitter = () => (Math.random() - 0.5) * Math.min(w, h) * 0.35
        return {
          ...word,
          rating,
          x: w / 2 + jitter(),
          y: h / 2 + jitter(),
          vx: 0,
          vy: 0,
        }
      })

    const n = seed()
    const cx = (d: MapNode) => targetX(d.rating, w)
    const sim = forceSimulation<MapNode>(n)
      .force(
        'charge',
        forceManyBody<MapNode>().strength(-12 - Math.min(20, words.length / 40))
      )
      .force(
        'collide',
        forceCollide<MapNode>()
          .radius(() => 4.2 + Math.min(2, words.length / 200))
          .iterations(2)
      )
      .force('x', forceX<MapNode>(cx).strength(0.14))
      .force('y', forceY<MapNode>(h / 2).strength(0.04))
      .alphaDecay(0.0228)
      .velocityDecay(0.35)

    let ticks = 0
    const maxTicks = 400
    while (sim.alpha() > sim.alphaMin() && ticks < maxTicks) {
      sim.tick()
      ticks++
      for (const d of n) {
        if (d.x != null) d.x = Math.max(6, Math.min(w - 6, d.x))
        if (d.y != null) d.y = Math.max(6, Math.min(h - 6, d.y))
      }
    }
    sim.stop()
    setNodes(n.map(d => ({ ...d })))
  }, [wordKey, size.w, size.h, words])

  const display = useMemo(() => {
    const id = hoveredId ?? pinnedId
    if (!id) return null
    return nodes.find(n => n.id === id) ?? null
  }, [hoveredId, pinnedId, nodes])

  const onCirclePointerDown = (id: string) => {
    setPinnedId(prev => (prev === id ? null : id))
  }

  return (
    <div ref={wrapRef} className={cn('flex flex-col min-h-0 min-w-0', className)}>
      <div
        className="relative flex-1 min-h-[min(70vh,600px)] w-full rounded-lg border border-black/5 dark:border-white/10 bg-gray-50/80 dark:bg-black/30 overflow-hidden"
        role="presentation"
      >
        <svg
          viewBox={`0 0 ${size.w} ${size.h}`}
          className="block w-full max-h-[min(70vh,600px)] touch-manipulation"
          style={{ aspectRatio: `${size.w} / ${size.h}` }}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Sentiment cluster map of ${words.length} glossary words. Dots are colored by positive, neutral, or negative rating.`}
        >
          <rect width={size.w} height={size.h} fill="transparent" />
          {nodes.map(d => {
            const x = d.x ?? 0
            const y = d.y ?? 0
            const r = d.rating
            const active = hoveredId === d.id || pinnedId === d.id
            return (
              <circle
                key={d.id}
                cx={x}
                cy={y}
                r={active ? 6 : 4.5}
                fill={RATING_FILL[r]}
                stroke={RATING_STROKE[r]}
                strokeWidth={active ? 1.5 : 0.75}
                className="cursor-pointer transition-[r] duration-75"
                aria-hidden
                onPointerEnter={() => setHoveredId(d.id)}
                onPointerLeave={e => {
                  if (e.pointerType === 'mouse') setHoveredId(null)
                }}
                onPointerDown={e => {
                  e.preventDefault()
                  onCirclePointerDown(d.id)
                }}
              />
            )
          })}
        </svg>
        {display && (
          <div
            className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-md border border-black/10 bg-white/95 px-3 py-1.5 text-sm font-medium text-gray-900 shadow-md dark:border-white/15 dark:bg-black/90 dark:text-white max-w-[min(90%,24rem)] truncate text-center"
            role="status"
            aria-live="polite"
          >
            {display.word}
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400 md:hidden">
        Tap a dot to pin its label. Tap again to clear.
      </p>
    </div>
  )
}
