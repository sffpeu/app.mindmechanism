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

/** Fullscreen idle: muted diagram until hover / sector click. */
const IDLE_SECTOR_GREY = '#cbd5e1'
const IDLE_SECTOR_STROKE = '#94a3b8'
const IDLE_LINK_GREY = '#cbd5e1'
const IDLE_NODE_GREY = '#94a3b8'
const IDLE_NODE_FILL = '#f1f5f9'

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

/** Chakra links use 0–8; grey gap links use GREY_GAP_CLOCK_ID. */
const GREY_GAP_CLOCK_ID = -1

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
  /** When clockId === GREY_GAP_CLOCK_ID: which inter-chakra wedge this leaf sits in. */
  gapIndex?: number
}

type LayoutGreyGap = {
  id: string
  x: number
  y: number
  gapIndex: number
  sectorStart: number
  sectorSpan: number
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

/**
 * Words with no chakra assignment (most of the default glossary + user words without clock_id),
 * shown only in "All" scope as grey wedges between the nine chakra sectors.
 */
function buildGreyGapLayout(
  unassigned: GlossaryWord[],
  rClock: number,
  leafRadius: number
): { greyGaps: LayoutGreyGap[]; links: LayoutLink[]; leaves: LayoutLeaf[] } {
  const sorted = [...unassigned].sort((a, b) => a.word.localeCompare(b.word))
  const buckets: GlossaryWord[][] = Array.from({ length: NUM_CLOCKS }, () => [])
  sorted.forEach((w, i) => buckets[i % NUM_CLOCKS].push(w))

  const greyGaps: LayoutGreyGap[] = []
  const links: LayoutLink[] = []
  const leaves: LayoutLeaf[] = []
  const delta = TAU / NUM_CLOCKS
  /** Narrow annulus wedge centered on each inter-chakra boundary */
  const greySpan = delta * 0.4

  for (let g = 0; g < NUM_CLOCKS; g++) {
    const boundaryAngle = -Math.PI / 2 + (g + 1) * delta
    const sectorStart = boundaryAngle - greySpan / 2
    const [hx, hy] = pointOnCircle(boundaryAngle, rClock)
    const hubId = `grey-gap-${g}`
    greyGaps.push({ id: hubId, x: hx, y: hy, gapIndex: g, sectorStart, sectorSpan: greySpan })
    links.push({
      id: `root-${hubId}`,
      fromId: 'root',
      toId: hubId,
      x1: 0,
      y1: 0,
      x2: hx,
      y2: hy,
      clockId: GREY_GAP_CLOCK_ID,
    })

    const bucket = buckets[g]
    const n = bucket.length
    const pad = greySpan * 0.07
    const angleLo = sectorStart + pad
    const angleHi = sectorStart + greySpan - pad
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : (i + 0.5) / n
      const angle = angleLo + (angleHi - angleLo) * t
      const [wx, wy] = pointOnCircle(angle, leafRadius)
      const w = bucket[i]
      leaves.push({ id: w.id, x: wx, y: wy, word: w, clockId: GREY_GAP_CLOCK_ID, gapIndex: g, angle })
      links.push({
        id: `${hubId}-word-${w.id}`,
        fromId: hubId,
        toId: w.id,
        x1: hx,
        y1: hy,
        x2: wx,
        y2: wy,
        clockId: GREY_GAP_CLOCK_ID,
      })
    }
  }

  return { greyGaps, links, leaves }
}

function greyGapIndexFromNodeId(id: string): number | null {
  const m = /^grey-gap-(\d+)$/.exec(id)
  return m ? parseInt(m[1], 10) : null
}

function pathNodeIdsForWord(wordId: string | null, leafById: Map<string, LayoutLeaf>): Set<string> | null {
  if (!wordId) return null
  const leaf = leafById.get(wordId)
  if (!leaf) return null
  if (leaf.clockId === GREY_GAP_CLOCK_ID && leaf.gapIndex != null) {
    return new Set<string>(['root', `grey-gap-${leaf.gapIndex}`, leaf.id])
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

  const unassignedWords = useMemo(() => {
    if (scopeFilter !== 'All') return []
    return words.filter(w => w.clock_id == null || w.clock_id < 0 || w.clock_id >= NUM_CLOCKS)
  }, [words, scopeFilter])

  const { layout, extent, outerSectorR } = useMemo(() => {
    const n = defaultWords.length + (scopeFilter === 'All' ? unassignedWords.length : 0)
    const rWordBase = Math.max(1400, 520 + Math.sqrt(Math.max(n, 1)) * 42) * (focusClockId !== null ? 1.06 : 1)
    const rClock = rWordBase * 0.38
    const sectorScale = focusClockId !== null ? FOCUS_RADIAL_SCALE : 1
    const outerR = rWordBase * sectorScale + 80
    const leafRadius = outerR + LEAF_OUTSET
    const base = buildLayout(defaultWords, rClock, leafRadius)
    let greyGaps: LayoutGreyGap[] = []
    let links = base.links
    let leaves = base.leaves
    if (scopeFilter === 'All' && unassignedWords.length > 0) {
      const extra = buildGreyGapLayout(unassignedWords, rClock, leafRadius)
      greyGaps = extra.greyGaps
      links = [...base.links, ...extra.links]
      leaves = [...base.leaves, ...extra.leaves]
    }

    const pad = 200
    const extent = leafRadius + pad
    const outerSectorR = outerR
    return { layout: { ...base, links, leaves, greyGaps }, extent, outerSectorR }
  }, [defaultWords, unassignedWords, focusClockId, scopeFilter])

  const leafById = useMemo(() => {
    const m = new Map<string, LayoutLeaf>()
    for (const leaf of layout.leaves) m.set(leaf.id, leaf)
    return m
  }, [layout.leaves])

  const [hoveredWordId, setHoveredWordId] = useState<string | null>(null)
  /** Fullscreen: which clock wedge is hovered (title + color preview). */
  const [hoveredClockId, setHoveredClockIdState] = useState<number | null>(null)
  /** Fullscreen: sector click pins this clock to show word labels. */
  const [expandedClockId, setExpandedClockId] = useState<number | null>(null)
  /** Fullscreen: grey inter-chakra wedge pinned to show unassigned words. */
  const [expandedGreyGapId, setExpandedGreyGapId] = useState<number | null>(null)
  const [hoveredGreyGapId, setHoveredGreyGapIdState] = useState<number | null>(null)
  const hoverClockClearRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hoverGreyGapClearRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setHoveredClockId = useCallback((id: number | null) => {
    if (hoverClockClearRef.current) {
      clearTimeout(hoverClockClearRef.current)
      hoverClockClearRef.current = null
    }
    setHoveredClockIdState(id)
  }, [])

  const scheduleClearHoveredClock = useCallback(() => {
    if (hoverClockClearRef.current) clearTimeout(hoverClockClearRef.current)
    hoverClockClearRef.current = setTimeout(() => {
      hoverClockClearRef.current = null
      setHoveredClockIdState(null)
    }, 60)
  }, [])

  const setHoveredGreyGapId = useCallback((id: number | null) => {
    if (hoverGreyGapClearRef.current) {
      clearTimeout(hoverGreyGapClearRef.current)
      hoverGreyGapClearRef.current = null
    }
    setHoveredGreyGapIdState(id)
  }, [])

  const scheduleClearHoveredGreyGap = useCallback(() => {
    if (hoverGreyGapClearRef.current) clearTimeout(hoverGreyGapClearRef.current)
    hoverGreyGapClearRef.current = setTimeout(() => {
      hoverGreyGapClearRef.current = null
      setHoveredGreyGapIdState(null)
    }, 60)
  }, [])

  useEffect(() => {
    return () => {
      if (hoverClockClearRef.current) clearTimeout(hoverClockClearRef.current)
      if (hoverGreyGapClearRef.current) clearTimeout(hoverGreyGapClearRef.current)
    }
  }, [])

  const isFullscreen = variant === 'fullscreen'

  const clockLit = useCallback(
    (clockId: number) => {
      if (!isFullscreen) return true
      return (
        clockId === hoveredClockId ||
        clockId === expandedClockId ||
        (focusClockId !== null && clockId === focusClockId)
      )
    },
    [isFullscreen, hoveredClockId, expandedClockId, focusClockId]
  )

  const showWordsForLeaf = useCallback(
    (leaf: LayoutLeaf) => {
      if (!isFullscreen) return true
      if (leaf.clockId === GREY_GAP_CLOCK_ID) {
        return expandedGreyGapId !== null && leaf.gapIndex === expandedGreyGapId
      }
      return expandedClockId !== null && leaf.clockId === expandedClockId
    },
    [isFullscreen, expandedClockId, expandedGreyGapId]
  )

  const greyGapLit = useCallback(
    (gapIndex: number) => {
      if (!isFullscreen) return true
      return gapIndex === hoveredGreyGapId || gapIndex === expandedGreyGapId
    },
    [isFullscreen, hoveredGreyGapId, expandedGreyGapId]
  )

  /** Path/root/clock highlights follow selection only — not hover. */
  const selectionPathIds = useMemo(
    () => pathNodeIdsForWord(selectedWordId, leafById),
    [selectedWordId, leafById]
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
    if (clockId === GREY_GAP_CLOCK_ID) {
      if (hi) return '#64748b'
      return dim ? '#e2e8f0' : '#94a3b8'
    }
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
              const lit = clockLit(c.clockId)
              const fillOp = focusClockId !== null ? (c.clockId === focusClockId ? 0.22 : 0.06) : 0.1
              const strokeOp = dim ? 0.12 : 0.35
              const sectorPath = sectorAnnulusPath(c.sectorStart, c.sectorSpan, innerSectorR, outerSectorR)
              if (isFullscreen && !lit) {
                return (
                  <path
                    key={`sector-${c.id}`}
                    d={sectorPath}
                    fill={IDLE_SECTOR_GREY}
                    fillOpacity={0.42}
                    stroke={IDLE_SECTOR_STROKE}
                    strokeOpacity={0.35}
                    strokeWidth={0.9}
                    className={cn(isFullscreen && 'cursor-pointer')}
                    style={{ pointerEvents: isFullscreen ? 'auto' : 'none' }}
                    onPointerEnter={() => setHoveredClockId(c.clockId)}
                    onPointerLeave={scheduleClearHoveredClock}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedGreyGapId(null)
                      setExpandedClockId(prev => (prev === c.clockId ? null : c.clockId))
                    }}
                  />
                )
              }
              return (
                <path
                  key={`sector-${c.id}`}
                  d={sectorPath}
                  fill={hex}
                  fillOpacity={dim ? fillOp * 0.35 : fillOp}
                  stroke={hex}
                  strokeOpacity={strokeOp}
                  strokeWidth={focusClockId === c.clockId ? 2.2 : 0.8}
                  className={cn(isFullscreen && 'cursor-pointer')}
                  style={{ pointerEvents: isFullscreen ? 'auto' : 'none' }}
                  onPointerEnter={() => setHoveredClockId(c.clockId)}
                  onPointerLeave={scheduleClearHoveredClock}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedGreyGapId(null)
                    setExpandedClockId(prev => (prev === c.clockId ? null : c.clockId))
                  }}
                />
              )
            })}

            {(layout.greyGaps ?? []).map(gg => {
              const dim = sectorDimmed(-1)
              const lit = greyGapLit(gg.gapIndex)
              const sectorPath = sectorAnnulusPath(gg.sectorStart, gg.sectorSpan, innerSectorR, outerSectorR)
              if (isFullscreen && !lit) {
                return (
                  <path
                    key={`grey-sector-${gg.id}`}
                    d={sectorPath}
                    fill={IDLE_SECTOR_GREY}
                    fillOpacity={0.38}
                    stroke={IDLE_SECTOR_STROKE}
                    strokeOpacity={0.32}
                    strokeWidth={0.85}
                    className={cn(isFullscreen && 'cursor-pointer')}
                    style={{ pointerEvents: isFullscreen ? 'auto' : 'none' }}
                    onPointerEnter={() => setHoveredGreyGapId(gg.gapIndex)}
                    onPointerLeave={scheduleClearHoveredGreyGap}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedClockId(null)
                      setExpandedGreyGapId(prev => (prev === gg.gapIndex ? null : gg.gapIndex))
                    }}
                  />
                )
              }
              return (
                <path
                  key={`grey-sector-${gg.id}`}
                  d={sectorPath}
                  fill="#94a3b8"
                  fillOpacity={dim ? 0.05 : 0.12}
                  stroke="#64748b"
                  strokeOpacity={dim ? 0.1 : 0.28}
                  strokeWidth={0.75}
                  className={cn(isFullscreen && 'cursor-pointer')}
                  style={{ pointerEvents: isFullscreen ? 'auto' : 'none' }}
                  onPointerEnter={() => setHoveredGreyGapId(gg.gapIndex)}
                  onPointerLeave={scheduleClearHoveredGreyGap}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedClockId(null)
                    setExpandedGreyGapId(prev => (prev === gg.gapIndex ? null : gg.gapIndex))
                  }}
                />
              )
            })}

            {layout.links.map(link => {
              const dim =
                link.clockId === GREY_GAP_CLOCK_ID ? sectorDimmed(-1) : sectorDimmed(link.clockId)
              const hi = linkHighlighted(link)
              const gi = greyGapIndexFromNodeId(link.fromId) ?? greyGapIndexFromNodeId(link.toId)
              const lit =
                link.clockId === GREY_GAP_CLOCK_ID && gi !== null ? greyGapLit(gi) : clockLit(link.clockId)
              const stroke = linkStrokeForClock(link.clockId, dim, hi)
              const sw =
                hi
                  ? 3
                  : link.clockId !== GREY_GAP_CLOCK_ID && focusClockId === link.clockId && !dim
                    ? 1.85
                    : 1.05
              const opacity = linkOpacity(dim, hi)
              const fullscreenMuted = isFullscreen && !lit && !hi
              return (
                <path
                  key={link.id}
                  d={bezierPath(link.x1, link.y1, link.x2, link.y2)}
                  fill="none"
                  stroke={fullscreenMuted ? IDLE_LINK_GREY : hi ? stroke : dim ? '#cbd5e1' : stroke}
                  strokeWidth={sw}
                  strokeOpacity={fullscreenMuted ? 0.35 : opacity}
                  strokeLinecap="round"
                  pointerEvents="none"
                />
              )
            })}

            <g
              className={cn(isFullscreen && 'cursor-pointer')}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                if (isFullscreen) {
                  setExpandedClockId(null)
                  setExpandedGreyGapId(null)
                }
              }}
            >
              <circle
                r={12}
                cx={0}
                cy={0}
                fill={
                  nodeHighlighted('root')
                    ? '#156fde25'
                    : isFullscreen &&
                        hoveredClockId === null &&
                        expandedClockId === null &&
                        focusClockId === null
                      ? IDLE_NODE_FILL
                      : DEFAULT_NODE_FILL
                }
                stroke={
                  nodeHighlighted('root')
                    ? '#156fde'
                    : isFullscreen &&
                        hoveredClockId === null &&
                        expandedClockId === null &&
                        focusClockId === null
                      ? IDLE_NODE_GREY
                      : DEFAULT_NODE_STROKE
                }
                strokeWidth={nodeHighlighted('root') ? 2.5 : 1.2}
              />
              <text
                x={0}
                y={4}
                textAnchor="middle"
                className={cn(
                  'text-[12px] font-semibold pointer-events-none select-none',
                  isFullscreen &&
                    hoveredClockId === null &&
                    expandedClockId === null &&
                    focusClockId === null
                    ? 'fill-slate-500 dark:fill-slate-400'
                    : 'fill-gray-800 dark:fill-gray-100'
                )}
              >
                Glossary
              </text>
            </g>

            {layout.clocks.map(c => {
              const hi = nodeHighlighted(c.id)
              const dim = sectorDimmed(c.clockId)
              const hex = CLOCK_HEX[c.clockId]
              const lit = clockLit(c.clockId)
              const [lx, ly] = pointOnCircle(c.clockAngle, innerSectorR + (Math.hypot(c.x, c.y) - innerSectorR) * 0.45)
              const showTitle = !isFullscreen || lit
              const idleClock = isFullscreen && !lit

              return (
                <g key={c.id} opacity={dim && !isFullscreen ? 0.45 : idleClock ? 0.55 : 1}>
                  <circle
                    r={focusClockId === c.clockId ? 10 : 7}
                    cx={c.x}
                    cy={c.y}
                    fill={
                      idleClock
                        ? `${IDLE_NODE_GREY}35`
                        : hi
                          ? `${hex}45`
                          : `${hex}28`
                    }
                    stroke={idleClock ? IDLE_NODE_GREY : hi ? hex : hex}
                    strokeWidth={hi ? 2.4 : focusClockId === c.clockId ? 2 : 1.35}
                    className={cn(isFullscreen && 'cursor-pointer')}
                    onPointerEnter={() => setHoveredClockId(c.clockId)}
                    onPointerLeave={scheduleClearHoveredClock}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedGreyGapId(null)
                      setExpandedClockId(prev => (prev === c.clockId ? null : c.clockId))
                    }}
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
                      fill: showTitle ? hex : 'transparent',
                      opacity: showTitle ? 1 : 0,
                    }}
                  >
                    {CLOCK_SHORT[c.clockId] ?? clockTitles[c.clockId]}
                  </text>
                </g>
              )
            })}

            {(layout.greyGaps ?? []).map(gg => {
              const hi = nodeHighlighted(gg.id)
              const dim = sectorDimmed(-1)
              const lit = greyGapLit(gg.gapIndex)
              const idleHub = isFullscreen && !lit
              return (
                <g key={gg.id} opacity={dim && !isFullscreen ? 0.45 : idleHub ? 0.55 : 1}>
                  <circle
                    r={6}
                    cx={gg.x}
                    cy={gg.y}
                    fill={idleHub ? `${IDLE_NODE_GREY}35` : hi ? '#64748b55' : '#94a3b828'}
                    stroke={idleHub ? IDLE_NODE_GREY : hi ? '#64748b' : '#94a3b8'}
                    strokeWidth={hi ? 2 : 1.2}
                    className={cn(isFullscreen && 'cursor-pointer')}
                    onPointerEnter={() => setHoveredGreyGapId(gg.gapIndex)}
                    onPointerLeave={scheduleClearHoveredGreyGap}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedClockId(null)
                      setExpandedGreyGapId(prev => (prev === gg.gapIndex ? null : gg.gapIndex))
                    }}
                  />
                  <title>More words (no chakra)</title>
                </g>
              )
            })}

            {layout.leaves.map(leaf => {
              const isGreyLeaf = leaf.clockId === GREY_GAP_CLOCK_ID
              const hx = isGreyLeaf ? '#64748b' : highlightStroke(leaf.clockId)
              const dim = isGreyLeaf ? sectorDimmed(-1) : sectorDimmed(leaf.clockId)
              const sentDim = leafSentimentDimmed(leaf.word)
              const ang = Math.atan2(leaf.y, leaf.x)
              let rotDeg = (ang * 180) / Math.PI
              if (Math.cos(ang) < 0) rotDeg += 180

              const fs =
                3.35 *
                Math.max(5.2, Math.min(8.5, 480 / Math.sqrt(Math.max(layout.leaves.length, 1) + 40)))
              const labelR = Math.max(12, fs * 0.22)
              const lx = leaf.x + Math.cos(ang) * labelR
              const ly = leaf.y + Math.sin(ang) * labelR

              const wordsVisible = showWordsForLeaf(leaf)
              const groupOp = dim ? 0.38 : sentDim ? 0.22 : 1
              const isSelected = selectedWordId === leaf.id
              const isHoverOnly = hoveredWordId === leaf.id && !isSelected

              const clockHex = isGreyLeaf ? hx : (CLOCK_HEX[leaf.clockId] ?? hx)
              const textFill = isSelected ? clockHex : isHoverOnly ? WORD_HOVER_GREY : clockHex
              const inExpandedFullscreen = isFullscreen && (
                isGreyLeaf
                  ? expandedGreyGapId === leaf.gapIndex
                  : expandedClockId === leaf.clockId
              )
              const textOpacity =
                isFullscreen && !wordsVisible
                  ? 0
                  : isSelected
                    ? 1
                    : isHoverOnly
                      ? 1
                      : inExpandedFullscreen
                        ? 1
                        : 0.5

              const dotFill = isSelected
                ? `${clockHex}55`
                : isHoverOnly
                  ? '#e2e8f0'
                  : `${clockHex}20`
              const dotStroke = isSelected ? clockHex : isHoverOnly ? WORD_HOVER_GREY : clockHex
              const dotR = isSelected ? 6.5 : isHoverOnly ? 4.5 : 4
              const dotSw = isSelected ? 2 : 1

              return (
                <g
                  key={leaf.id}
                  opacity={isFullscreen && !wordsVisible ? 0 : groupOp}
                  className={cn(wordsVisible && 'cursor-pointer')}
                  style={{ pointerEvents: wordsVisible ? 'auto' : 'none' }}
                  onPointerEnter={() => {
                    setHoveredWordId(leaf.id)
                    if (isFullscreen) {
                      if (isGreyLeaf && leaf.gapIndex != null) setHoveredGreyGapId(leaf.gapIndex)
                      else setHoveredClockId(leaf.clockId)
                    }
                  }}
                  onPointerLeave={() => {
                    setHoveredWordId((h) => (h === leaf.id ? null : h))
                    if (isFullscreen) {
                      if (isGreyLeaf) scheduleClearHoveredGreyGap()
                      else scheduleClearHoveredClock()
                    }
                  }}
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
                    opacity={isFullscreen && !wordsVisible ? 0 : isHoverOnly ? 0.85 : 1}
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
