'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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

/** Normalize degrees to (-180, 180] for stable CSS rotation. */
function normalizeRotationDeg(deg: number): number {
  let d = deg % 360
  if (d > 180) d -= 360
  if (d <= -180) d += 360
  return d
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

/** Pixels beyond the sector annulus outer edge where word nodes sit (labels sit further via radial offset). */
const LEAF_OUTSET = 118

type BuildLayoutOptions = {
  /** All-view overview: no word leaves or hub→word links, only hubs + root links. */
  omitWordLeaves?: boolean
  /** When set (e.g. expanded segment in All view), only words for this clock id. */
  onlyClockId?: number | null
}

function buildLayout(
  defaultWords: GlossaryWord[],
  rClock: number,
  /** Radius for word nodes — past colored sector outer edge so labels read outside the wedge. */
  leafRadius: number,
  opts?: BuildLayoutOptions
) {
  const omitWordLeaves = opts?.omitWordLeaves ?? false
  const onlyClockId = opts?.onlyClockId ?? null

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

    if (omitWordLeaves) continue

    const words =
      onlyClockId !== null ? (c === onlyClockId ? byClock[c] : []) : byClock[c]
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

/** My Words: single ring from center — no nine-clock hubs or sectors; only this user’s entries. */
function buildLayoutMyWords(userWords: GlossaryWord[], leafRadius: number) {
  const links: LayoutLink[] = []
  const clocks: LayoutClock[] = []
  const leaves: LayoutLeaf[] = []
  const sorted = [...userWords].sort((a, b) => a.word.localeCompare(b.word))
  const n = sorted.length
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : (i + 0.5) / n
    const angle = -Math.PI / 2 + TAU * t
    const [wx, wy] = pointOnCircle(angle, leafRadius)
    const w = sorted[i]
    const c =
      w.clock_id != null && w.clock_id >= 0 && w.clock_id < NUM_CLOCKS ? w.clock_id : 0
    leaves.push({ id: w.id, x: wx, y: wy, word: w, clockId: c, angle })
    links.push({
      id: `root-${w.id}`,
      fromId: 'root',
      toId: w.id,
      x1: 0,
      y1: 0,
      x2: wx,
      y2: wy,
      clockId: c,
    })
  }
  return { links, clocks, leaves }
}

/** Selection highlights the word leaf only — not root/hub paths. */
function pathNodeIdsForWord(wordId: string | null, leafById: Map<string, LayoutLeaf>): Set<string> | null {
  if (!wordId) return null
  if (!leafById.has(wordId)) return null
  return new Set<string>([wordId])
}

export type GlossaryVisualFilters = {
  scopeFilter: 'All' | 'Default' | 'My Words'
  selectedClockId: number | null
  selectedSentiment: '+' | '~' | '-' | null
  /** For My Words: dim leaves that are not this user's entries. */
  userId?: string | null
}

export type GlossaryRadialTreeProps = {
  words: GlossaryWord[]
  selectedWordId: string | null
  onSelectWord?: (word: GlossaryWord) => void
  className?: string
  /** When set, diagram reflects glossary filters (clock color, sector, enlargement). */
  visualFilters?: GlossaryVisualFilters
  /** Hovering a sector (or word) focuses that chakra; leaving the diagram clears. */
  diagramHoverClockId?: number | null
  onDiagramClockHover?: (clockId: number | null) => void
  /** All view: expanded clock shows words; null = overview (clock titles on ring only). */
  expandedSegmentClockId?: number | null
  onExpandSegment?: (clockId: number | null) => void
  /** When set, diagram rotates so this clock’s sector sits at 3 o’clock (readable horizontal). */
  rotationSnapClockId?: number | null
  /** Full-bleed diagram: no card border/background (visual glossary mode). */
  variant?: 'card' | 'fullscreen'
}

export function GlossaryRadialTree({
  words,
  selectedWordId,
  onSelectWord,
  className,
  visualFilters,
  diagramHoverClockId = null,
  onDiagramClockHover,
  expandedSegmentClockId = null,
  onExpandSegment,
  rotationSnapClockId = null,
  variant = 'card',
}: GlossaryRadialTreeProps) {
  const scopeFilter = visualFilters?.scopeFilter ?? 'All'
  const filterClockId = visualFilters?.selectedClockId ?? null
  const selectedSentiment = visualFilters?.selectedSentiment ?? null
  const filterUserId = visualFilters?.userId ?? null

  const allViewOverview =
    scopeFilter === 'All' && expandedSegmentClockId === null

  /**
   * Geometry only (radii / word positions): expanded All wedge or Default dropdown clock.
   * Excludes diagram hover so the graph does not grow/shrink when moving the pointer.
   */
  const layoutFocusClockId = useMemo(() => {
    if (
      scopeFilter === 'All' &&
      expandedSegmentClockId !== null &&
      expandedSegmentClockId >= 0 &&
      expandedSegmentClockId < NUM_CLOCKS
    ) {
      return expandedSegmentClockId
    }
    if (scopeFilter === 'Default' && filterClockId !== null && filterClockId >= 0 && filterClockId < NUM_CLOCKS) {
      return filterClockId
    }
    return null
  }, [scopeFilter, expandedSegmentClockId, filterClockId])

  /** Visual dimming / emphasis: expanded segment → sector hover → Default clock (may differ from layout). */
  const focusClockId = useMemo(() => {
    if (
      scopeFilter === 'All' &&
      expandedSegmentClockId !== null &&
      expandedSegmentClockId >= 0 &&
      expandedSegmentClockId < NUM_CLOCKS
    ) {
      return expandedSegmentClockId
    }
    if (diagramHoverClockId !== null && diagramHoverClockId >= 0 && diagramHoverClockId < NUM_CLOCKS) {
      return diagramHoverClockId
    }
    if (scopeFilter === 'Default' && filterClockId !== null && filterClockId >= 0 && filterClockId < NUM_CLOCKS) {
      return filterClockId
    }
    return null
  }, [scopeFilter, expandedSegmentClockId, diagramHoverClockId, filterClockId])

  const defaultWords = useMemo(
    () => words.filter(w => w.clock_id != null && w.clock_id >= 0 && w.clock_id < NUM_CLOCKS),
    [words]
  )

  /** Logged-in user’s own glossary entries only (visual My Words ring). */
  const myWordsOnly = useMemo(() => {
    if (scopeFilter !== 'My Words' || !filterUserId) return [] as GlossaryWord[]
    return words.filter(w => w.source === 'user' && w.user_id === filterUserId)
  }, [scopeFilter, filterUserId, words])

  const isMyWordsSoloLayout = scopeFilter === 'My Words'

  /** Stable canvas size (max of focused / unfocused) so focus changes do not jump the view fit. */
  const { layout, extent, outerSectorR, labelFontSize, leafRadius } = useMemo(() => {
    const pad = 280

    if (isMyWordsSoloLayout) {
      const n = myWordsOnly.length
      const rWordBaseLo = Math.max(1400, 520 + Math.sqrt(Math.max(n, 1)) * 42)
      const outerR = rWordBaseLo + 80
      const leafR = outerR + LEAF_OUTSET
      const extentVal = leafR + pad
      const L = buildLayoutMyWords(myWordsOnly, leafR)
      const labelFontSize =
        4.45 * Math.max(6.4, Math.min(12, 560 / Math.sqrt(Math.max(n, 1) + 36)))
      return { layout: L, extent: extentVal, outerSectorR: outerR, labelFontSize, leafRadius: leafR }
    }

    const n = defaultWords.length
    const rWordBaseLo = Math.max(1400, 520 + Math.sqrt(Math.max(n, 1)) * 42)
    const rWordBaseHi = rWordBaseLo * 1.06
    const outerRMax = rWordBaseHi * FOCUS_RADIAL_SCALE + 80
    const leafRadiusMax = outerRMax + LEAF_OUTSET
    const extent = leafRadiusMax + pad

    const usedLayoutFocus = layoutFocusClockId !== null
    const rWordBase = usedLayoutFocus ? rWordBaseHi : rWordBaseLo
    const outerR = (usedLayoutFocus ? rWordBase * FOCUS_RADIAL_SCALE : rWordBase) + 80
    const leafRadius = outerR + LEAF_OUTSET
    const rClock = rWordBase * 0.38

    const layoutOpts: BuildLayoutOptions = allViewOverview
      ? { omitWordLeaves: true }
      : scopeFilter === 'All' && expandedSegmentClockId !== null
        ? { onlyClockId: expandedSegmentClockId }
        : {}

    const L = buildLayout(defaultWords, rClock, leafRadius, layoutOpts)
    const labelFontSize =
      4.45 * Math.max(6.4, Math.min(12, 560 / Math.sqrt(defaultWords.length + 36)))

    return { layout: L, extent, outerSectorR: outerR, labelFontSize, leafRadius }
  }, [
    isMyWordsSoloLayout,
    myWordsOnly,
    defaultWords,
    layoutFocusClockId,
    allViewOverview,
    scopeFilter,
    expandedSegmentClockId,
  ])

  const leafById = useMemo(() => {
    const m = new Map<string, LayoutLeaf>()
    for (const leaf of layout.leaves) m.set(leaf.id, leaf)
    return m
  }, [layout.leaves])

  const [hoveredWordId, setHoveredWordId] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [tooltipMounted, setTooltipMounted] = useState(false)
  useEffect(() => setTooltipMounted(true), [])

  /** Path/root/clock highlights follow selection only — not hover. */
  const selectionPathIds = useMemo(
    () => pathNodeIdsForWord(selectedWordId, leafById),
    [selectedWordId, leafById]
  )

  const linkHighlightedChakra = useCallback(
    (link: LayoutLink) => {
      if (!selectionPathIds) return false
      return selectionPathIds.has(link.fromId) && selectionPathIds.has(link.toId)
    },
    [selectionPathIds]
  )

  const sectorDimmed = useCallback(
    (clockId: number) => {
      if (focusClockId === null) return false
      return clockId !== focusClockId
    },
    [focusClockId]
  )

  const leafNotInMyWordsScope = useCallback(
    (w: GlossaryWord) => {
      if (scopeFilter !== 'My Words' || !filterUserId) return false
      return w.source !== 'user' || w.user_id !== filterUserId
    },
    [scopeFilter, filterUserId]
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
    return 0.88
  }

  const innerSectorR = useMemo(() => {
    if (isMyWordsSoloLayout) return Math.min(outerSectorR * 0.42, 220)
    const c0 = layout.clocks[0]
    return c0 ? Math.hypot(c0.x, c0.y) * 0.35 : 80
  }, [isMyWordsSoloLayout, layout.clocks, outerSectorR])

  /**
   * Rotate diagram CW so the active hub sits on +x (3 o’clock). Derived from actual hub (cx, cy)
   * so it matches SVG `rotate()`, then normalized for consistent animation endpoints.
   */
  const rotationSnapDeg = useMemo(() => {
    if (rotationSnapClockId === null || rotationSnapClockId < 0 || rotationSnapClockId >= NUM_CLOCKS) return 0
    const clk = layout.clocks.find(c => c.clockId === rotationSnapClockId)
    if (!clk) return 0
    const raw = (Math.atan2(clk.y, clk.x) * 180) / Math.PI
    return normalizeRotationDeg(raw)
  }, [rotationSnapClockId, layout.clocks])

  const onSvgPointerLeave = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      onPointerUp(e)
      onDiagramClockHover?.(null)
    },
    [onPointerUp, onDiagramClockHover]
  )

  const setClockHover = useCallback(
    (clockId: number | null) => {
      onDiagramClockHover?.(clockId)
    },
    [onDiagramClockHover]
  )

  const isFullscreen = variant === 'fullscreen'

  const hoveredLeaf = hoveredWordId ? leafById.get(hoveredWordId) ?? null : null
  const tooltipHex = hoveredLeaf ? (CLOCK_HEX[hoveredLeaf.clockId] ?? '#156fde') : '#156fde'

  return (
    <>
    <div
      ref={containerRef}
      className={cn(
        'relative w-full flex-1 min-h-0 overflow-hidden',
        isFullscreen
          ? 'rounded-none border-0 bg-transparent dark:bg-transparent'
          : 'rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-black/20',
        className
      )}
      onMouseMove={(e) => {
        if (!dragRef.current.active) setMousePos({ x: e.clientX, y: e.clientY })
      }}
      onMouseLeave={() => setMousePos(null)}
    >
      {!isFullscreen && (
        <p className="absolute top-2 left-2 z-10 text-xs text-gray-500 dark:text-gray-400 pointer-events-none select-none max-w-[min(100%,260px)]">
          Hover a wedge to focus · scroll zoom · drag pan
          {scopeFilter === 'All' && allViewOverview && (
            <span className="block mt-0.5">
              All: click a wedge for words · click the same wedge again to return to overview
            </span>
          )}
          {layoutFocusClockId !== null && (
            <span className="block mt-0.5 font-medium" style={{ color: CLOCK_HEX[layoutFocusClockId] }}>
              {clockTitles[layoutFocusClockId]} — enlarged layout
            </span>
          )}
          {scopeFilter === 'My Words' && (
            <span className="block mt-0.5 text-gray-600 dark:text-gray-400">
              Only words you added; colors match chakra when set
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
        onPointerLeave={onSvgPointerLeave}
      >
        <g transform={`translate(${transform.tx},${transform.ty}) scale(${transform.k})`}>
          <g
            style={{
              transform: `rotate(${rotationSnapDeg}deg)`,
              transformOrigin: '0px 0px',
              transition: 'transform 0.55s cubic-bezier(0.33, 1, 0.32, 1)',
            }}
          >
          <g style={{ transition: 'opacity 0.32s ease-out' }}>
            {isMyWordsSoloLayout ? (
              <circle
                r={innerSectorR * 1.15}
                cx={0}
                cy={0}
                className="fill-slate-400/10 dark:fill-white/5 pointer-events-none"
              />
            ) : (
              <>
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

                {(onDiagramClockHover || onExpandSegment) &&
                  layout.clocks.map(c => (
                    <path
                      key={`sector-hit-${c.id}`}
                      d={sectorAnnulusPath(c.sectorStart, c.sectorSpan, innerSectorR, outerSectorR)}
                      fill="transparent"
                      className="cursor-pointer"
                      onPointerEnter={() => setClockHover(c.clockId)}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation()
                        onExpandSegment?.(c.clockId)
                      }}
                    />
                  ))}
              </>
            )}

            <g style={{ transition: 'opacity 0.28s ease-out' }}>
              {layout.links.map(link => {
                const dim = sectorDimmed(link.clockId)
                const hi = linkHighlightedChakra(link)
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
                    pointerEvents="none"
                  />
                )
              })}
            </g>

            {!isMyWordsSoloLayout && (onDiagramClockHover || onExpandSegment) && (
              <circle
                r={innerSectorR * 0.92}
                cx={0}
                cy={0}
                fill="transparent"
                className="cursor-pointer"
                onPointerEnter={() => setClockHover(null)}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  onExpandSegment?.(null)
                }}
              />
            )}

            <g transform={`rotate(${-rotationSnapDeg} 0 0)`}>
              <circle
                r={12}
                cx={0}
                cy={0}
                fill={DEFAULT_NODE_FILL}
                stroke={DEFAULT_NODE_STROKE}
                strokeWidth={1.2}
                pointerEvents="none"
              />
              <text
                x={0}
                y={4}
                textAnchor="middle"
                className="fill-gray-800 dark:fill-gray-100 text-[12px] font-semibold pointer-events-none select-none"
              >
                {isMyWordsSoloLayout ? 'My words' : 'Glossary'}
              </text>
            </g>

            {!isMyWordsSoloLayout &&
              layout.clocks.map(c => {
                const dim = sectorDimmed(c.clockId)
                const hex = CLOCK_HEX[c.clockId]
                const titleRingR = leafRadius * (allViewOverview ? 0.97 : 0.86)
                const [ttx, tty] = pointOnCircle(c.clockAngle, titleRingR)

                return (
                  <g
                    key={c.id}
                    opacity={dim ? 0.45 : 1}
                    className={onDiagramClockHover || onExpandSegment ? 'cursor-pointer' : undefined}
                    onPointerEnter={onDiagramClockHover ? () => setClockHover(c.clockId) : undefined}
                    onPointerDown={onExpandSegment ? (e) => e.stopPropagation() : undefined}
                    onClick={
                      onExpandSegment
                        ? (e) => {
                            e.stopPropagation()
                            onExpandSegment(c.clockId)
                          }
                        : undefined
                    }
                  >
                    <circle
                      r={focusClockId === c.clockId ? 10 : 7}
                      cx={c.x}
                      cy={c.y}
                      fill={`${hex}28`}
                      stroke={hex}
                      strokeWidth={focusClockId === c.clockId ? 2 : 1.35}
                    />
                    <title>{clockTitles[c.clockId]}</title>
                    <text
                      x={ttx}
                      y={tty}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className={cn('select-none font-semibold cursor-pointer', dim && 'opacity-80')}
                      fontSize={labelFontSize}
                      fill={hex}
                      fillOpacity={dim ? 0.45 : 0.92}
                      transform={`rotate(${-rotationSnapDeg} ${ttx} ${tty})`}
                      style={{ pointerEvents: 'auto' }}
                    >
                      {clockTitles[c.clockId]}
                    </text>
                  </g>
                )
              })}

            <g style={{ transition: 'opacity 0.28s ease-out' }}>
              {layout.leaves.map(leaf => {
                const hx = highlightStroke(leaf.clockId)
                const dim = sectorDimmed(leaf.clockId)
                const sentDim = leafSentimentDimmed(leaf.word)
                const notMine = leafNotInMyWordsScope(leaf.word)
                const ang = Math.atan2(leaf.y, leaf.x)

                const fs = labelFontSize
                const labelR = Math.max(38, fs * 0.78)
                const lx = leaf.x + Math.cos(ang) * labelR
                const ly = leaf.y + Math.sin(ang) * labelR
                /** Counter parent rotate(snap) so glyphs stay horizontal and readable on screen. */
                const labelUprightDeg = -rotationSnapDeg

                const groupOp = dim ? 0.38 : notMine ? 0.3 : sentDim ? 0.22 : 1
                const isSelected = selectedWordId === leaf.id
                const isHoverOnly = hoveredWordId === leaf.id && !isSelected

                const clockHex = CLOCK_HEX[leaf.clockId] ?? hx
                const textFill = isSelected ? clockHex : isHoverOnly ? WORD_HOVER_GREY : clockHex
                const textOpacity = isSelected ? 1 : isHoverOnly ? 1 : 0.5

                const dotFill = isSelected
                  ? `${clockHex}55`
                  : isHoverOnly
                    ? '#e2e8f0'
                    : `${clockHex}20`
                const dotStroke = isSelected ? clockHex : isHoverOnly ? WORD_HOVER_GREY : clockHex
                const dotR = isSelected ? 8.5 : isHoverOnly ? 6 : 5.5
                const dotSw = isSelected ? 2.25 : 1.35

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
                    <circle r={Math.max(26, fs * 0.52)} cx={leaf.x} cy={leaf.y} fill="transparent" />
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
                      transform={`rotate(${labelUprightDeg} ${lx} ${ly})`}
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
          </g>
        </g>
      </svg>
    </div>
    {tooltipMounted && hoveredLeaf && mousePos && !dragRef.current.active &&
      createPortal(
        <div
          className="pointer-events-none fixed z-[2000] px-2.5 py-1.5 rounded-md shadow-lg text-sm font-semibold select-none"
          style={{
            left: mousePos.x + 16,
            top: mousePos.y - 36,
            backgroundColor: `${tooltipHex}18`,
            border: `1px solid ${tooltipHex}55`,
            color: tooltipHex,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {hoveredLeaf.word.word}
        </div>,
        document.body
      )
    }
    </>
  )
}
