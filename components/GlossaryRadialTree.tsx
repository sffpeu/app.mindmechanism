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

function buildLayout(
  defaultWords: GlossaryWord[],
  rClock: number,
  rWordBase: number,
  focusClockId: number | null
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
    const rWord = rWordBase * (focusClockId !== null && c === focusClockId ? FOCUS_RADIAL_SCALE : 1)

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
      const [wx, wy] = pointOnCircle(angle, rWord)
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

function pathNodeIdsForWord(wordId: string | null, leafById: Map<string, LayoutLeaf>): Set<string> | null {
  if (!wordId) return null
  const leaf = leafById.get(wordId)
  if (!leaf) return null
  const set = new Set<string>(['root', `clock-${leaf.clockId}`, leaf.id])
  return set
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

  /** Default scope + a specific clock pill → focus that sector (enlarge + color). */
  const focusClockId =
    scopeFilter === 'Default' && filterClockId !== null && filterClockId >= 0 && filterClockId < NUM_CLOCKS
      ? filterClockId
      : null

  const myWordsScopeDim = scopeFilter === 'My Words'

  const defaultWords = useMemo(
    () => words.filter(w => w.clock_id != null && w.clock_id >= 0 && w.clock_id < NUM_CLOCKS),
    [words]
  )

  const { layout, extent, outerSectorR } = useMemo(() => {
    const n = defaultWords.length
    const rWordBase = Math.max(1400, 520 + Math.sqrt(Math.max(n, 1)) * 42) * (focusClockId !== null ? 1.06 : 1)
    const rClock = rWordBase * 0.38
    const L = buildLayout(defaultWords, rClock, rWordBase, focusClockId)
    const pad = 160
    const maxR = rWordBase * (focusClockId !== null ? FOCUS_RADIAL_SCALE : 1) + pad
    const extent = maxR
    const outerSectorR = rWordBase * (focusClockId !== null ? FOCUS_RADIAL_SCALE : 1) + 80
    return { layout: L, extent, outerSectorR }
  }, [defaultWords, focusClockId])

  const leafById = useMemo(() => {
    const m = new Map<string, LayoutLeaf>()
    for (const leaf of layout.leaves) m.set(leaf.id, leaf)
    return m
  }, [layout.leaves])

  const [hoveredWordId, setHoveredWordId] = useState<string | null>(null)
  const highlightWordId = selectedWordId ?? hoveredWordId

  const highlightIds = useMemo(
    () => pathNodeIdsForWord(highlightWordId, leafById),
    [highlightWordId, leafById]
  )

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

  const sectorDimmed = useCallback(
    (clockId: number) => {
      if (myWordsScopeDim) return true
      if (focusClockId === null) return false
      return clockId !== focusClockId
    },
    [focusClockId, myWordsScopeDim]
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

  const linkStrokeForClock = (clockId: number, dim: boolean, hi: boolean) => {
    if (hi) return highlightStroke(clockId)
    const hex = CLOCK_HEX[clockId] ?? DEFAULT_LINK
    if (dim) return '#e2e8f0'
    return hex
  }

  const linkOpacity = (dim: boolean, hi: boolean) => {
    if (hi) return 1
    if (dim) return 0.28
    return scopeFilter === 'Default' || scopeFilter === 'All' ? 0.88 : 0.55
  }

  const innerSectorR = useMemo(() => layout.clocks[0] ? Math.hypot(layout.clocks[0].x, layout.clocks[0].y) * 0.35 : 80, [layout.clocks])

  const isFullscreen = variant === 'fullscreen'

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full flex-1 min-h-0 overflow-hidden',
        isFullscreen
          ? 'rounded-none border-0 bg-transparent dark:bg-transparent'
          : 'rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-black/20',
        myWordsScopeDim && 'opacity-40',
        className
      )}
    >
      {!isFullscreen && (
        <p className="absolute top-2 left-2 z-10 text-xs text-gray-500 dark:text-gray-400 pointer-events-none select-none max-w-[min(100%,220px)]">
          Scroll to zoom · drag to pan
          {focusClockId !== null && (
            <span className="block mt-0.5 font-medium" style={{ color: CLOCK_HEX[focusClockId] }}>
              {clockTitles[focusClockId]} — enlarged
            </span>
          )}
          {myWordsScopeDim && (
            <span className="block mt-0.5 text-amber-700 dark:text-amber-300">My Words: tree shows default glossary only</span>
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
            {/* Clock-colored sector bands (diagram sections) */}
            {layout.clocks.map(c => {
              const dim = sectorDimmed(c.clockId)
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

            {layout.links.map(link => {
              const dim = sectorDimmed(link.clockId)
              const hi = linkHighlighted(link)
              const stroke = linkStrokeForClock(link.clockId, dim, hi)
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

            {layout.clocks.map(c => {
              const hi = nodeHighlighted(c.id)
              const dim = sectorDimmed(c.clockId)
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
                    className="pointer-events-none select-none fill-gray-900 dark:fill-gray-100 font-semibold"
                    style={{
                      fontSize: focusClockId === c.clockId ? 11 : 9,
                      fill: hex,
                      paintOrder: 'stroke fill',
                      stroke: 'rgba(255,255,255,0.92)',
                      strokeWidth: 2.5,
                    }}
                  >
                    {CLOCK_SHORT[c.clockId] ?? clockTitles[c.clockId]}
                  </text>
                </g>
              )
            })}

            {layout.leaves.map(leaf => {
              const hi = nodeHighlighted(leaf.id)
              const hx = highlightStroke(leaf.clockId)
              const dim = sectorDimmed(leaf.clockId)
              const sentDim = leafSentimentDimmed(leaf.word)
              const ang = Math.atan2(leaf.y, leaf.x)
              /** Tangential orientation (90° from former radial-outward labels) — denser along the ring */
              let rotDeg = (ang * 180) / Math.PI
              if (Math.cos(ang) < 0) rotDeg += 180

              const fs =
                5 * Math.max(5.2, Math.min(8.5, 480 / Math.sqrt(defaultWords.length + 40)))
              const labelR = Math.max(14, fs * 0.22)
              const lx = leaf.x + Math.cos(ang) * labelR
              const ly = leaf.y + Math.sin(ang) * labelR

              const groupOp = dim ? 0.38 : sentDim ? 0.22 : 1

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
                  <circle r={Math.max(22, fs * 0.45)} cx={leaf.x} cy={leaf.y} fill="transparent" />
                  <circle
                    r={hi ? 6.5 : 4.5}
                    cx={leaf.x}
                    cy={leaf.y}
                    fill={hi ? `${hx}55` : `${CLOCK_HEX[leaf.clockId]}18`}
                    stroke={hi ? hx : CLOCK_HEX[leaf.clockId]}
                    strokeWidth={hi ? 2 : 1}
                    pointerEvents="none"
                  />
                  <text
                    x={lx}
                    y={ly}
                    fontSize={fs}
                    className={cn(
                      'select-none fill-gray-900 dark:fill-gray-100 pointer-events-none',
                      hi && 'font-semibold'
                    )}
                    style={{
                      paintOrder: 'stroke fill',
                      stroke: hi ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)',
                      strokeWidth: hi ? 3 : 1,
                    }}
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
