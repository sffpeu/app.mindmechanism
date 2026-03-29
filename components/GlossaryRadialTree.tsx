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

/** Word label: hover state (path highlights only on click/selection). */
const WORD_HOVER_GREY = '#94a3b8'

/** Clock hub titles: one size, solid fill (no outline). */
const CLOCK_TITLE_FONT_PX = 10

/** Short labels near center (9 clock nodes) */
const CLOCK_SHORT: readonly string[] = [
  'ROOT',
  'SACROL',
  'SOLAR',
  'HEART',
  'THROAT',
  '3RD EYE',
  'M CROWN',
  'F CROWN',
  'ETHERAL',
]

/** Radial stretch for the focused clock when Default + clock filter is active */
const FOCUS_RADIAL_SCALE = 1.34

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
  sectorStart: number
  sectorSpan: number
  clockAngle: number
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

/** Annular sector wedge (for clock-colored regions) */
function sectorAnnulusPath(sectorStart: number, sectorSpan: number, innerR: number, outerR: number): string {
  const sectorEnd = sectorStart + sectorSpan
  const [ox1, oy1] = pointOnCircle(sectorStart, outerR)
  const [ox2, oy2] = pointOnCircle(sectorEnd, outerR)
  const [ix1, iy1] = pointOnCircle(sectorStart, innerR)
  const [ix2, iy2] = pointOnCircle(sectorEnd, innerR)
  const largeArc = sectorSpan > Math.PI ? 1 : 0
  return [
    `M ${ix1} ${iy1}`,
    `L ${ox1} ${oy1}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${ox2} ${oy2}`,
    `L ${ix2} ${iy2}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1}`,
    'Z',
  ].join(' ')
}

/** Pixels beyond the sector annulus outer edge where word dots sit (labels sit further via radial offset). */
const LEAF_OUTSET = 72

/** All / Default (all) / My Words: three wedges from center — neutral, positive, negative. */
const SENTIMENT_RATINGS: readonly ('~' | '+' | '-')[] = ['~', '+', '-']
const SENTIMENT_HEX = ['#22c55e', '#2563eb', '#dc2626'] as const

type SentimentSector = {
  index: number
  sectorStart: number
  sectorSpan: number
  rating: '~' | '+' | '-'
}

type SentimentLayout = {
  links: LayoutLink[]
  leaves: LayoutLeaf[]
  sectors: SentimentSector[]
}

function buildSentimentLayout(filteredWords: GlossaryWord[], leafRadius: number): SentimentLayout {
  const byRating: Record<'~' | '+' | '-', GlossaryWord[]> = { '~': [], '+': [], '-': [] }
  for (const w of filteredWords) {
    const r = w.rating
    if (r === '~' || r === '+' || r === '-') byRating[r].push(w)
    else byRating['~'].push(w)
  }
  for (const r of SENTIMENT_RATINGS) {
    byRating[r].sort((a, b) => a.word.localeCompare(b.word))
  }

  const links: LayoutLink[] = []
  const leaves: LayoutLeaf[] = []
  const sectors: SentimentSector[] = []

  for (let s = 0; s < 3; s++) {
    const rating = SENTIMENT_RATINGS[s]
    const sectorStart = -Math.PI / 2 + (TAU * s) / 3
    const sectorSpan = TAU / 3
    sectors.push({ index: s, sectorStart, sectorSpan, rating })

    const bucket = byRating[rating]
    const n = bucket.length
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : (i + 0.5) / n
      const angle = sectorStart + sectorSpan * t
      const [wx, wy] = pointOnCircle(angle, leafRadius)
      const w = bucket[i]
      leaves.push({ id: w.id, x: wx, y: wy, word: w, clockId: s, angle })
      links.push({
        id: `root-word-${w.id}`,
        fromId: 'root',
        toId: w.id,
        x1: 0,
        y1: 0,
        x2: wx,
        y2: wy,
        clockId: s,
      })
    }
  }

  return { links, leaves, sectors }
}

function buildLayout(
  defaultWords: GlossaryWord[],
  rClock: number,
  /** Radius for word nodes — past colored sector outer edge so labels read outside the wedge. */
  leafRadius: number
) {
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
    const clockNodeId = `clock-${c}`
    clocks.push({
      id: clockNodeId,
      x: cx,
      y: cy,
      clockId: c,
      sectorStart,
      sectorSpan,
      clockAngle,
    })
    links.push({
      id: `root-${clockNodeId}`,
      fromId: 'root',
      toId: clockNodeId,
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
      const [wx, wy] = pointOnCircle(angle, leafRadius)
      const w = words[i]
      leaves.push({ id: w.id, x: wx, y: wy, word: w, clockId: c, angle })
      links.push({
        id: `${clockNodeId}-word-${w.id}`,
        fromId: clockNodeId,
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

function pathNodeIdsForWord(
  wordId: string | null,
  leafById: Map<string, LayoutLeaf>,
  layoutKind: 'clock' | 'sentiment'
): Set<string> | null {
  if (!wordId) return null
  const leaf = leafById.get(wordId)
  if (!leaf) return null
  if (layoutKind === 'sentiment') {
    return new Set<string>(['root', leaf.id])
  }
  return new Set<string>(['root', `clock-${leaf.clockId}`, leaf.id])
}

export type GlossaryVisualFilters = {
  scopeFilter: 'All' | 'Default' | 'My Words'
  selectedClockId: number | null
  selectedSentiment: '+' | '~' | '-' | null
}

export type GlossaryRadialTreeProps = {
  words: GlossaryWord[]
  selectedWordId: string | null
  onSelectWord?: (word: GlossaryWord) => void
  className?: string
  /** When set, diagram reflects glossary filters (clock color, sector, enlargement). */
  visualFilters?: GlossaryVisualFilters
  /** Full-bleed diagram: no card border/background (visual glossary mode). */
  variant?: 'card' | 'fullscreen'
}

export function GlossaryRadialTree({
  words,
  selectedWordId,
  onSelectWord,
  className,
  visualFilters,
  variant = 'card',
}: GlossaryRadialTreeProps) {
  const scopeFilter = visualFilters?.scopeFilter ?? 'All'
  const filterClockId = visualFilters?.selectedClockId ?? null
  const selectedSentiment = visualFilters?.selectedSentiment ?? null

  /** 9-clock wheel only when Default + a specific chakra is chosen. All / My Words / Default (all) use sentiment wedges. */
  const useClockWheel =
    scopeFilter === 'Default' && filterClockId !== null && filterClockId >= 0 && filterClockId < NUM_CLOCKS

  const focusClockId = useClockWheel && filterClockId != null ? filterClockId : null

  const defaultWords = useMemo(
    () => words.filter(w => w.clock_id != null && w.clock_id >= 0 && w.clock_id < NUM_CLOCKS),
    [words]
  )

  const layoutBundle = useMemo(() => {
    if (useClockWheel) {
      const n = defaultWords.length
      const rWordBase = Math.max(1400, 520 + Math.sqrt(Math.max(n, 1)) * 42) * (focusClockId !== null ? 1.06 : 1)
      const rClock = rWordBase * 0.38
      const sectorScale = focusClockId !== null ? FOCUS_RADIAL_SCALE : 1
      const outerR = rWordBase * sectorScale + 80
      const leafRadius = outerR + LEAF_OUTSET
      const layout = buildLayout(defaultWords, rClock, leafRadius)
      const pad = 200
      const extent = leafRadius + pad
      return { kind: 'clock' as const, layout, extent, outerSectorR: outerR }
    }
    const n = words.length
    const rWordBase = Math.max(1400, 520 + Math.sqrt(Math.max(n, 1)) * 42)
    const outerR = rWordBase + 80
    const leafRadius = outerR + LEAF_OUTSET
    const sentiment = buildSentimentLayout(words, leafRadius)
    const pad = 200
    const extent = leafRadius + pad
    return { kind: 'sentiment' as const, sentiment, extent, outerSectorR: outerR }
  }, [words, defaultWords, useClockWheel, focusClockId])

  const extent = layoutBundle.extent
  const outerSectorR = layoutBundle.outerSectorR

  const leaves = layoutBundle.kind === 'clock' ? layoutBundle.layout.leaves : layoutBundle.sentiment.leaves

  const leafById = useMemo(() => {
    const m = new Map<string, LayoutLeaf>()
    for (const leaf of leaves) m.set(leaf.id, leaf)
    return m
  }, [leaves])

  const [hoveredWordId, setHoveredWordId] = useState<string | null>(null)

  /** Path/root/clock highlights follow selection only — not hover. */
  const selectionPathIds = useMemo(
    () => pathNodeIdsForWord(selectedWordId, leafById, layoutBundle.kind),
    [selectedWordId, leafById, layoutBundle.kind]
  )

  const linkHighlighted = useCallback(
    (link: LayoutLink) => {
      if (!selectionPathIds) return false
      return selectionPathIds.has(link.fromId) && selectionPathIds.has(link.toId)
    },
    [selectionPathIds]
  )

  const nodeHighlighted = useCallback(
    (id: string) => {
      if (!selectionPathIds) return false
      return selectionPathIds.has(id)
    },
    [selectionPathIds]
  )

  const sectorDimmedClock = useCallback(
    (clockId: number) => {
      if (focusClockId === null) return false
      return clockId !== focusClockId
    },
    [focusClockId]
  )

  const sectorDimmedSentiment = useCallback(
    (sectorIndex: number) => {
      if (selectedSentiment === null) return false
      const idx = SENTIMENT_RATINGS.indexOf(selectedSentiment)
      return idx >= 0 && sectorIndex !== idx
    },
    [selectedSentiment]
  )

  const leafSentimentDimmed = useCallback(
    (w: GlossaryWord) => {
      if (selectedSentiment === null) return false
      return w.rating !== selectedSentiment
    },
    [selectedSentiment]
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
    const el = containerRef.current
    if (!el) return
    const w = el.clientWidth
    const h = el.clientHeight
    if (!w || !h) return
    const size = layoutBundle.extent * 2
    const k = Math.min(w, h) / size
    setTransform({ k, tx: w / 2, ty: h / 2 })
  }, [scopeFilter, filterClockId, layoutBundle.kind, layoutBundle.extent])

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

  const highlightStrokeClock = (clockId: number) => CLOCK_HEX[clockId] ?? '#156fde'
  const highlightStrokeSentiment = (sectorIndex: number) => SENTIMENT_HEX[sectorIndex] ?? '#156fde'

  const linkStrokeClock = (clockId: number, dim: boolean, hi: boolean) => {
    if (hi) return highlightStrokeClock(clockId)
    const hex = CLOCK_HEX[clockId] ?? DEFAULT_LINK
    if (dim) return '#e2e8f0'
    return hex
  }

  const linkStrokeSentiment = (sectorIndex: number, dim: boolean, hi: boolean) => {
    if (hi) return highlightStrokeSentiment(sectorIndex)
    const hex = SENTIMENT_HEX[sectorIndex] ?? DEFAULT_LINK
    if (dim) return '#e2e8f0'
    return hex
  }

  const linkOpacity = (dim: boolean, hi: boolean) => {
    if (hi) return 1
    if (dim) return 0.28
    if (layoutBundle.kind === 'sentiment') return 0.88
    return scopeFilter === 'Default' || scopeFilter === 'All' ? 0.88 : 0.55
  }

  const innerSectorR = useMemo(() => {
    if (layoutBundle.kind === 'clock') {
      const c = layoutBundle.layout.clocks[0]
      return c ? Math.hypot(c.x, c.y) * 0.35 : 80
    }
    return layoutBundle.outerSectorR * 0.14
  }, [layoutBundle])

  const isFullscreen = variant === 'fullscreen'

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full flex-1 min-h-0 overflow-hidden',
        isFullscreen
          ? 'rounded-none border-0 bg-transparent dark:bg-transparent'
          : 'rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-black/20',
        className
      )}
    >
      {!isFullscreen && (
        <p className="absolute top-2 left-2 z-10 text-xs text-gray-500 dark:text-gray-400 pointer-events-none select-none max-w-[min(100%,220px)]">
          Scroll to zoom · drag to pan
          {layoutBundle.kind === 'sentiment' && (
            <span className="block mt-0.5 text-gray-600 dark:text-gray-300">
              Neutral · positive · negative (center outward)
            </span>
          )}
          {layoutBundle.kind === 'clock' && focusClockId !== null && (
            <span className="block mt-0.5 font-medium" style={{ color: CLOCK_HEX[focusClockId] }}>
              {clockTitles[focusClockId]} — enlarged
            </span>
          )}
        </p>
      )}
      <svg
        ref={svgRef}
        className="w-full h-full touch-none cursor-grab active:cursor-grabbing block"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <g transform={`translate(${transform.tx},${transform.ty}) scale(${transform.k})`}>
          <g>
            {layoutBundle.kind === 'clock' ? (
              <>
                {layoutBundle.layout.clocks.map(c => {
                  const dim = sectorDimmedClock(c.clockId)
                  const hex = CLOCK_HEX[c.clockId]
                  const fillOp = focusClockId !== null ? (c.clockId === focusClockId ? 0.22 : 0.06) : 0.1
                  const strokeOp = dim ? 0.12 : 0.35
                  return (
                    <path
                      key={`sector-${c.id}`}
                      d={sectorAnnulusPath(c.sectorStart, c.sectorSpan, innerSectorR, outerSectorR)}
                      fill={hex}
                      fillOpacity={dim ? fillOp * 0.35 : fillOp}
                      stroke={hex}
                      strokeOpacity={strokeOp}
                      strokeWidth={focusClockId === c.clockId ? 2.2 : 0.8}
                      className="pointer-events-none"
                    />
                  )
                })}

                {layoutBundle.layout.links.map(link => {
                  const dim = sectorDimmedClock(link.clockId)
                  const hi = linkHighlighted(link)
                  const stroke = linkStrokeClock(link.clockId, dim, hi)
                  const sw = hi ? 3 : focusClockId === link.clockId && !dim ? 1.85 : 1.05
                  const opacity = linkOpacity(dim, hi)
                  return (
                    <path
                      key={link.id}
                      d={bezierPath(link.x1, link.y1, link.x2, link.y2)}
                      fill="none"
                      stroke={hi ? stroke : dim ? '#cbd5e1' : stroke}
                      strokeWidth={sw}
                      strokeOpacity={opacity}
                      strokeLinecap="round"
                    />
                  )
                })}

                {layoutBundle.layout.clocks.map(c => {
                  const hi = nodeHighlighted(c.id)
                  const dim = sectorDimmedClock(c.clockId)
                  const hex = CLOCK_HEX[c.clockId]
                  const [lx, ly] = pointOnCircle(c.clockAngle, innerSectorR + (Math.hypot(c.x, c.y) - innerSectorR) * 0.45)

                  return (
                    <g key={c.id} opacity={dim ? 0.45 : 1}>
                      <circle
                        r={focusClockId === c.clockId ? 10 : 7}
                        cx={c.x}
                        cy={c.y}
                        fill={hi ? `${hex}45` : `${hex}28`}
                        stroke={hi ? hex : hex}
                        strokeWidth={hi ? 2.4 : focusClockId === c.clockId ? 2 : 1.35}
                      />
                      <title>{clockTitles[c.clockId]}</title>
                      <text
                        x={lx}
                        y={ly}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="pointer-events-none select-none font-semibold"
                        style={{
                          fontSize: CLOCK_TITLE_FONT_PX,
                          fill: hex,
                        }}
                      >
                        {CLOCK_SHORT[c.clockId] ?? clockTitles[c.clockId]}
                      </text>
                    </g>
                  )
                })}
              </>
            ) : (
              <>
                {layoutBundle.sentiment.sectors.map(sector => {
                  const dim = sectorDimmedSentiment(sector.index)
                  const hex = SENTIMENT_HEX[sector.index]
                  const active = selectedSentiment === sector.rating
                  const fillOp = selectedSentiment !== null ? (active ? 0.2 : 0.06) : 0.12
                  const strokeOp = dim ? 0.12 : 0.38
                  return (
                    <path
                      key={`sent-sector-${sector.index}`}
                      d={sectorAnnulusPath(sector.sectorStart, sector.sectorSpan, innerSectorR, outerSectorR)}
                      fill={hex}
                      fillOpacity={dim ? fillOp * 0.35 : fillOp}
                      stroke={hex}
                      strokeOpacity={strokeOp}
                      strokeWidth={active ? 2 : 0.9}
                      className="pointer-events-none"
                    />
                  )
                })}

                {layoutBundle.sentiment.links.map(link => {
                  const dim = sectorDimmedSentiment(link.clockId)
                  const hi = linkHighlighted(link)
                  const stroke = linkStrokeSentiment(link.clockId, dim, hi)
                  const sw = hi ? 3 : 1.15
                  const opacity = linkOpacity(dim, hi)
                  return (
                    <line
                      key={link.id}
                      x1={link.x1}
                      y1={link.y1}
                      x2={link.x2}
                      y2={link.y2}
                      stroke={hi ? stroke : dim ? '#cbd5e1' : stroke}
                      strokeWidth={sw}
                      strokeOpacity={opacity}
                      strokeLinecap="round"
                    />
                  )
                })}

                {layoutBundle.sentiment.sectors.map(sector => {
                  const mid = sector.sectorStart + sector.sectorSpan / 2
                  const [lx, ly] = pointOnCircle(mid, innerSectorR * 1.35)
                  const dim = sectorDimmedSentiment(sector.index)
                  const hex = SENTIMENT_HEX[sector.index]
                  const label = sector.rating === '~' ? '~' : sector.rating === '+' ? '+' : '−'
                  return (
                    <text
                      key={`sent-label-${sector.index}`}
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="pointer-events-none select-none font-bold"
                      style={{
                        fontSize: 11,
                        fill: hex,
                        opacity: dim ? 0.35 : 0.9,
                      }}
                    >
                      {label}
                    </text>
                  )
                })}
              </>
            )}

            <circle
              r={12}
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
              className="fill-gray-800 dark:fill-gray-100 text-[12px] font-semibold pointer-events-none select-none"
            >
              Glossary
            </text>

            {leaves.map(leaf => {
              const isClock = layoutBundle.kind === 'clock'
              const hx = isClock ? highlightStrokeClock(leaf.clockId) : highlightStrokeSentiment(leaf.clockId)
              const dim = isClock ? sectorDimmedClock(leaf.clockId) : sectorDimmedSentiment(leaf.clockId)
              const sentDim = leafSentimentDimmed(leaf.word)
              const ang = Math.atan2(leaf.y, leaf.x)
              let rotDeg = (ang * 180) / Math.PI
              if (Math.cos(ang) < 0) rotDeg += 180

              const wordCount = isClock ? defaultWords.length : words.length
              const fs = 3.35 * Math.max(5.2, Math.min(8.5, 480 / Math.sqrt(wordCount + 40)))
              const labelR = Math.max(24, fs * 0.48)
              const lx = leaf.x + Math.cos(ang) * labelR
              const ly = leaf.y + Math.sin(ang) * labelR

              const groupOp = dim ? 0.38 : sentDim ? 0.22 : 1
              const isSelected = selectedWordId === leaf.id
              const isHoverOnly = hoveredWordId === leaf.id && !isSelected

              const accentHex = isClock ? CLOCK_HEX[leaf.clockId] ?? hx : SENTIMENT_HEX[leaf.clockId] ?? hx
              const textFill = isSelected ? accentHex : isHoverOnly ? WORD_HOVER_GREY : accentHex
              const textOpacity = isSelected ? 1 : isHoverOnly ? 1 : 0.5

              const dotFill = isSelected
                ? `${accentHex}55`
                : isHoverOnly
                  ? '#e2e8f0'
                  : `${accentHex}20`
              const dotStroke = isSelected ? accentHex : isHoverOnly ? WORD_HOVER_GREY : accentHex
              const dotR = isSelected ? 6.5 : isHoverOnly ? 4.5 : 4
              const dotSw = isSelected ? 2 : 1

              return (
                <g
                  key={leaf.id}
                  opacity={groupOp}
                  className="cursor-pointer"
                  onPointerEnter={() => setHoveredWordId(leaf.id)}
                  onPointerLeave={() => setHoveredWordId((h) => (h === leaf.id ? null : h))}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectWord?.(leaf.word)
                  }}
                >
                  <circle r={Math.max(18, fs * 0.42)} cx={leaf.x} cy={leaf.y} fill="transparent" />
                  <circle
                    r={dotR}
                    cx={leaf.x}
                    cy={leaf.y}
                    fill={dotFill}
                    stroke={dotStroke}
                    strokeWidth={dotSw}
                    pointerEvents="none"
                    opacity={isHoverOnly ? 0.85 : 1}
                  />
                  <text
                    x={lx}
                    y={ly}
                    fontSize={fs}
                    className={cn('select-none pointer-events-none', isSelected && 'font-semibold')}
                    fill={textFill}
                    fillOpacity={textOpacity}
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
