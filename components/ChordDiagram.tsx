'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { FocusWordWithValue } from '@/types/Chord'
import { getSentimentBand } from '@/types/Chord'

const PI2 = Math.PI * 2

/** Clamp value to [-5, 5] for display. */
function clampValue(v: number): number {
  return Math.max(-5, Math.min(5, v))
}

/** Arc path from angle a to b at radius r (radians, clockwise). */
function arcPath(r: number, a: number, b: number): string {
  const x1 = r * Math.cos(a)
  const y1 = r * Math.sin(a)
  const x2 = r * Math.cos(b)
  const y2 = r * Math.sin(b)
  const large = b - a > Math.PI ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
}

/** Ribbon path: outer arc from a1 to a2, then inner arc from a2 back to a1, then line to outer start. */
function ribbonPath(r0: number, r1: number, a1: number, a2: number): string {
  const x1o = r1 * Math.cos(a1)
  const y1o = r1 * Math.sin(a1)
  const x2o = r1 * Math.cos(a2)
  const y2o = r1 * Math.sin(a2)
  const x1i = r0 * Math.cos(a1)
  const y1i = r0 * Math.sin(a1)
  const x2i = r0 * Math.cos(a2)
  const y2i = r0 * Math.sin(a2)
  const largeOuter = a2 - a1 > Math.PI ? 1 : 0
  const largeInner = a1 - a2 > Math.PI ? 1 : 0
  return (
    `M ${x1o} ${y1o} ` +
    `A ${r1} ${r1} 0 ${largeOuter} 1 ${x2o} ${y2o} ` +
    `L ${x2i} ${y2i} ` +
    `A ${r0} ${r0} 0 ${largeInner} 1 ${x1i} ${y1i} ` +
    `L ${x1o} ${y1o} Z`
  )
}

/** Positive (green), neutral (blue), negative (red) with gradient support. */
const SENTIMENT_COLORS = {
  positive: { fill: '#22c55e', gradient: ['#166534', '#22c55e', '#4ade80'] },
  neutral: { fill: '#3b82f6', gradient: ['#1e40af', '#3b82f6', '#60a5fa'] },
  negative: { fill: '#ef4444', gradient: ['#991b1b', '#ef4444', '#f87171'] },
} as const

function getRibbonColor(
  avgValue: number,
  overlap: number
): { fill: string; opacity: number } {
  const band = getSentimentBand(avgValue)
  const base = SENTIMENT_COLORS[band].fill
  const opacity = 0.35 + Math.min(0.5, overlap) * 0.4
  return { fill: base, opacity }
}

function getArcColor(avgValue: number): string {
  const band = getSentimentBand(avgValue)
  return SENTIMENT_COLORS[band].fill
}

export interface ChordDiagramProps {
  /** Number of focus nodes (clock positions). */
  focusNodes: number
  /** Words with value (-5..5) and node index. Diagram builds up from these. */
  words: FocusWordWithValue[]
  /** Size of the SVG viewBox (width/height). */
  size?: number
  /** Inner radius of chord (default 0.2 * size). */
  innerRadius?: number
  /** Outer radius of chord (default 0.45 * size). */
  outerRadius?: number
  /** Optional rotation offset in degrees to align with clock. */
  rotationDeg?: number
  /** Whether to show the chord (e.g. only when words exist). */
  visible?: boolean
  /** Unique key to reset build-up animation when words change. */
  animationKey?: string
}

export function ChordDiagram({
  focusNodes,
  words,
  size = 400,
  innerRadius,
  outerRadius,
  rotationDeg = 0,
  visible = true,
  animationKey = 'chord',
}: ChordDiagramProps) {
  const r0 = innerRadius ?? size * 0.18
  const r1 = outerRadius ?? size * 0.42
  const rotationRad = (rotationDeg * Math.PI) / 180

  const layout = useMemo(() => {
    const n = Math.max(1, focusNodes)
    const nodeTotal: number[] = Array(n).fill(0.3)
    const nodeValueSum: number[] = Array(n).fill(0)

    words.forEach((w) => {
      const idx = ((w.nodeIndex % n) + n) % n
      nodeTotal[idx] += 0.5 + Math.abs(clampValue(w.value))
      nodeValueSum[idx] += clampValue(w.value)
    })

    const totalSum = nodeTotal.reduce((a, b) => a + b, 0) || 1
    const padAngle = 0.015
    const totalAngle = PI2 - n * padAngle
    const angleStart: number[] = []
    const angleEnd: number[] = []
    let acc = 0
    for (let k = 0; k < n; k++) {
      const start = (acc / totalSum) * totalAngle + k * padAngle
      acc += nodeTotal[k]
      const end = (acc / totalSum) * totalAngle + k * padAngle
      angleStart.push(start)
      angleEnd.push(end)
    }

    const flow: number[][] = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0))
    const flowAvgValue: number[][] = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0))

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const countI = words.filter((w) => ((w.nodeIndex % n) + n) % n === i).length
        const countJ = words.filter((w) => ((w.nodeIndex % n) + n) % n === j).length
        const avgI = countI ? nodeValueSum[i] / countI : 0
        const avgJ = countJ ? nodeValueSum[j] / countJ : 0
        const f = (nodeTotal[i] * nodeTotal[j]) / (totalSum * totalSum + 1) * 20
        flow[i][j] = flow[j][i] = f
        flowAvgValue[i][j] = flowAvgValue[j][i] = (avgI + avgJ) / 2
      }
    }

    const arcs: { start: number; end: number; total: number; valueSum: number; index: number }[] = []
    for (let k = 0; k < n; k++) {
      arcs.push({
        start: angleStart[k],
        end: angleEnd[k],
        total: nodeTotal[k],
        valueSum: nodeValueSum[k],
        index: k,
      })
    }

    const ribbons: { i: number; j: number; flow: number; avgValue: number }[] = []
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (flow[i][j] > 0.001) {
          ribbons.push({
            i,
            j,
            flow: flow[i][j],
            avgValue: flowAvgValue[i][j],
          })
        }
      }
    }

    const maxFlow = Math.max(...ribbons.map((r) => r.flow), 1)
    return { arcs, ribbons, maxFlow }
  }, [focusNodes, words])

  if (!visible) return null

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 150 }}
      aria-hidden
    >
      <motion.svg
        key={animationKey}
        viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
        width="100%"
        height="100%"
        className="max-w-[85%] max-h-[85%] w-auto h-auto"
        style={{
          transform: `rotate(${rotationDeg}deg)`,
          filter: 'drop-shadow(0 0 12px rgba(0,0,0,0.15))',
        }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <defs>
          <linearGradient id="chord-positive" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={SENTIMENT_COLORS.positive.gradient[0]} />
            <stop offset="50%" stopColor={SENTIMENT_COLORS.positive.gradient[1]} />
            <stop offset="100%" stopColor={SENTIMENT_COLORS.positive.gradient[2]} />
          </linearGradient>
          <linearGradient id="chord-neutral" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={SENTIMENT_COLORS.neutral.gradient[0]} />
            <stop offset="50%" stopColor={SENTIMENT_COLORS.neutral.gradient[1]} />
            <stop offset="100%" stopColor={SENTIMENT_COLORS.neutral.gradient[2]} />
          </linearGradient>
          <linearGradient id="chord-negative" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={SENTIMENT_COLORS.negative.gradient[0]} />
            <stop offset="50%" stopColor={SENTIMENT_COLORS.negative.gradient[1]} />
            <stop offset="100%" stopColor={SENTIMENT_COLORS.negative.gradient[2]} />
          </linearGradient>
        </defs>

        <g transform={`rotate(${(rotationRad * 180) / Math.PI})`}>
          {layout.ribbons.map((r, idx) => {
            const a1 = layout.arcs[r.i].end
            const a2 = layout.arcs[r.j].start
            const overlap = r.flow / layout.maxFlow
            const { fill, opacity } = getRibbonColor(r.avgValue, overlap)
            const band = getSentimentBand(r.avgValue)
            const gradientId =
              band === 'positive'
                ? 'chord-positive'
                : band === 'negative'
                  ? 'chord-negative'
                  : 'chord-neutral'
            return (
              <motion.path
                key={`ribbon-${r.i}-${r.j}-${idx}`}
                d={ribbonPath(r0, r1, a1, a2)}
                fill={`url(#${gradientId})`}
                opacity={opacity}
                initial={{ opacity: 0 }}
                animate={{ opacity }}
                transition={{ delay: idx * 0.04, duration: 0.4 }}
              />
            )
          })}

          {layout.arcs.map((arc, idx) => {
            const countAtNode = words.filter((w) => ((w.nodeIndex % focusNodes) + focusNodes) % focusNodes === idx).length
            const avgVal = countAtNode ? arc.valueSum / countAtNode : 0
            const band = getSentimentBand(avgVal)
            const gradientId =
              band === 'positive'
                ? 'chord-positive'
                : band === 'negative'
                  ? 'chord-negative'
                  : 'chord-neutral'
            const pathD = arcPath(r1, arc.start, arc.end)
            return (
              <motion.path
                key={`arc-${idx}`}
                d={pathD}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth={Math.max(2, 3 + 4 * Math.min(1, arc.total / 15))}
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + idx * 0.03, duration: 0.4 }}
              />
            )
          })}
        </g>
      </motion.svg>
    </div>
  )
}
