'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GlossaryWord } from '@/types/Glossary'
import { clockTitles } from '@/lib/clockTitles'
import { cn } from '@/lib/utils'

const TAU = Math.PI * 2
const NUM_CLOCKS = 9

/** Match glossary page clock colors */
const CLOCK_HEX = ['#fd290a', '#fba63b', '#f7da5f', '#6dc037', '#156fde', '#941952', '#541b96', '#ee5fa7', '#56c1ff']

const DEFAULT_LINK = '#cbd5e1'
const DEFAULT_NODE_STROKE = '#156fde'
const DEFAULT_NODE_FILL = '#ffffff'

type LayoutLink = {
  id: string
  fromId: string
  toId: string
  x1: number
  y1: number
  x2: number
  y2: number
  clockId: number
}

type LayoutLeaf = {
  id: string
  x: number
  y: number
  word: GlossaryWord
  clockId: number
  angle: number
}

type LayoutClock = {
  id: string
  x: number
  y: number
  clockId: number
}

function pointOnCircle(angle: number, r: number): [number, number] {
  return [r * Math.cos(angle - Math.PI / 2), r * Math.sin(angle - Math.PI / 2)]
}

function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const cx1 = x1 + (mx - x1) * 0.55
  const cy1 = y1 + (my - y1) * 0.55
  const cx2 = x2 + (mx - x2) * 0.55
  const cy2 = y2 + (my - y2) * 0.55
  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`
}

function buildLayout(defaultWords: GlossaryWord[], rClock: number, rWord: number) {
  const byClock: GlossaryWord[][] = Array.from({ length: NUM_CLOCKS }, () => [])
  for (const w of defaultWords) {
    const c = w.clock_id
    if (c == null || c < 0 || c >= NUM_CLOCKS) continue
    byClock[c].push(w)
  }
  for (const arr of byClock) {
    arr.sort((a, b) => a.word.localeCompare(b.word))
  }

  const links: LayoutLink[] = []
  const clocks: LayoutClock[] = []
  const leaves: LayoutLeaf[] = []

  for (let c = 0; c < NUM_CLOCKS; c++) {
    const sectorStart = -Math.PI / 2 + (TAU * c) / NUM_CLOCKS
    const sectorSpan = TAU / NUM_CLOCKS
    const clockAngle = sectorStart + sectorSpan / 2
    const [cx, cy] = pointOnCircle(clockAngle, rClock)
    const clockId = `clock-${c}`
    clocks.push({ id: clockId, x: cx, y: cy, clockId: c })
    links.push({
      id: `root-${clockId}`,
      fromId: 'root',
      toId: clockId,
      x1: 0,
      y1: 0,
      x2: cx,
      y2: cy,
      clockId: c,
    })

    const words = byClock[c]
    const n = words.length
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : (i + 0.5) / n
      const angle = sectorStart + sectorSpan * t
      const [wx, wy] = pointOnCircle(angle, rWord)
      const w = words[i]
      leaves.push({ id: w.id, x: wx, y: wy, word: w, clockId: c, angle })
      links.push({
        id: `${clockId}-word-${w.id}`,
        fromId: clockId,
        toId: w.id,
        x1: cx,
        y1: cy,
        x2: wx,
        y2: wy,
        clockId: c,
      })
    }
  }

  return { links, clocks, leaves }
}

function pathNodeIdsForWord(wordId: string | null, leafById: Map<string, LayoutLeaf>): Set<string> | null {
  if (!wordId) return null
  const leaf = leafById.get(wordId)
  if (!leaf) return null
  const set = new Set<string>(['root', `clock-${leaf.clockId}`, leaf.id])
  return set
}

export type GlossaryRadialTreeProps = {
  words: GlossaryWord[]
  selectedWordId: string | null
  onSelectWord?: (word: GlossaryWord) => void
  className?: string
}

export function GlossaryRadialTree({ words, selectedWordId, onSelectWord, className }: GlossaryRadialTreeProps) {
  const defaultWords = useMemo(
    () => words.filter(w => w.clock_id != null && w.clock_id >= 0 && w.clock_id < NUM_CLOCKS),
    [words]
  )

  const { layout, extent } = useMemo(() => {
    const n = defaultWords.length
    const rWord = Math.max(1400, 520 + Math.sqrt(Math.max(n, 1)) * 42)
    const rClock = rWord * 0.38
    const L = buildLayout(defaultWords, rClock, rWord)
    const pad = 140
    const extent = rWord + pad
    return { layout: L, extent }
  }, [defaultWords])

  const leafById = useMemo(() => {
    const m = new Map<string, LayoutLeaf>()
    for (const leaf of layout.leaves) m.set(leaf.id, leaf)
    return m
  }, [layout.leaves])

  const highlightIds = useMemo(() => pathNodeIdsForWord(selectedWordId, leafById), [selectedWordId, leafById])

  const linkHighlighted = useCallback(
    (link: LayoutLink) => {
      if (!highlightIds) return false
      return highlightIds.has(link.fromId) && highlightIds.has(link.toId)
    },
    [highlightIds]
  )

  const nodeHighlighted = useCallback(
    (id: string) => {
      if (!highlightIds) return false
      return highlightIds.has(id)
    },
    [highlightIds]
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [transform, setTransform] = useState({ k: 1, tx: 0, ty: 0 })
  const dragRef = useRef({ active: false, sx: 0, sy: 0, stx: 0, sty: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (!w || !h) return
      const size = extent * 2
      const k = Math.min(w, h) / size
      setTransform({ k, tx: w / 2, ty: h / 2 })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [extent])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault()
      const factor = e.deltaY > 0 ? 0.92 : 1.08
      setTransform(t => {
        const nk = Math.min(6, Math.max(0.08, t.k * factor))
        return { ...t, k: nk }
      })
    }
    svg.addEventListener('wheel', onWheelNative, { passive: false })
    return () => svg.removeEventListener('wheel', onWheelNative)
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { active: true, sx: e.clientX, sy: e.clientY, stx: transform.tx, sty: transform.ty }
  }, [transform.tx, transform.ty])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active) return
    const d = dragRef.current
    const dx = e.clientX - d.sx
    const dy = e.clientY - d.sy
    setTransform(t => ({ ...t, tx: d.stx + dx, ty: d.sty + dy }))
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragRef.current.active = false
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }, [])

  const highlightStroke = (clockId: number) => CLOCK_HEX[clockId] ?? '#156fde'

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full flex-1 min-h-0 rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-black/20 overflow-hidden', className)}
    >
      <p className="absolute top-2 left-2 z-10 text-xs text-gray-500 dark:text-gray-400 pointer-events-none select-none">
        Scroll to zoom · drag to pan
      </p>
      <svg
        ref={svgRef}
        className="w-full h-full touch-none cursor-grab active:cursor-grabbing block"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <g transform={`translate(${transform.tx},${transform.ty}) scale(${transform.k})`}>
          <g transform={`translate(0,0)`}>
            {layout.links.map(link => {
              const hi = linkHighlighted(link)
              const stroke = hi ? highlightStroke(link.clockId) : DEFAULT_LINK
              const sw = hi ? 2.8 : 1.1
              const opacity = hi ? 1 : 0.85
              return (
                <path
                  key={link.id}
                  d={bezierPath(link.x1, link.y1, link.x2, link.y2)}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={sw}
                  strokeOpacity={opacity}
                  strokeLinecap="round"
                />
              )
            })}

            <circle
              r={10}
              cx={0}
              cy={0}
              fill={nodeHighlighted('root') ? '#156fde25' : DEFAULT_NODE_FILL}
              stroke={nodeHighlighted('root') ? '#156fde' : DEFAULT_NODE_STROKE}
              strokeWidth={nodeHighlighted('root') ? 2.5 : 1.2}
            />
            <text
              x={0}
              y={4}
              textAnchor="middle"
              className="fill-gray-800 dark:fill-gray-100 text-[11px] font-semibold pointer-events-none select-none"
            >
              Glossary
            </text>

            {layout.clocks.map(c => {
              const hi = nodeHighlighted(c.id)
              return (
                <g key={c.id}>
                  <circle
                    r={7}
                    cx={c.x}
                    cy={c.y}
                    fill={hi ? `${CLOCK_HEX[c.clockId]}35` : DEFAULT_NODE_FILL}
                    stroke={hi ? highlightStroke(c.clockId) : DEFAULT_NODE_STROKE}
                    strokeWidth={hi ? 2.2 : 1.1}
                  />
                  <title>{clockTitles[c.clockId]}</title>
                </g>
              )
            })}

            {layout.leaves.map(leaf => {
              const hi = nodeHighlighted(leaf.id)
              const hx = highlightStroke(leaf.clockId)
              const ang = Math.atan2(leaf.y, leaf.x)
              let rotDeg = (ang * 180) / Math.PI + 90
              if (Math.cos(ang) < 0) rotDeg += 180
              const labelR = 14
              const lx = leaf.x + Math.cos(ang) * labelR
              const ly = leaf.y + Math.sin(ang) * labelR
              const fs = Math.max(5.5, Math.min(9, 520 / Math.sqrt(defaultWords.length + 40)))

              return (
                <g key={leaf.id}>
                  <circle
                    r={hi ? 5 : 3.5}
                    cx={leaf.x}
                    cy={leaf.y}
                    fill={hi ? `${hx}50` : DEFAULT_NODE_FILL}
                    stroke={hi ? hx : DEFAULT_NODE_STROKE}
                    strokeWidth={hi ? 2 : 1}
                    className="cursor-pointer"
                    onClick={() => onSelectWord?.(leaf.word)}
                  />
                  <text
                    x={lx}
                    y={ly}
                    fontSize={fs}
                    className={cn(
                      'pointer-events-none select-none fill-gray-900 dark:fill-gray-100',
                      hi && 'font-semibold'
                    )}
                    style={{ paintOrder: 'stroke fill', stroke: hi ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)', strokeWidth: hi ? 2.5 : 1 }}
                    transform={`rotate(${rotDeg} ${lx} ${ly})`}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {leaf.word.word}
                  </text>
                </g>
              )
            })}
          </g>
        </g>
      </svg>
    </div>
  )
}
