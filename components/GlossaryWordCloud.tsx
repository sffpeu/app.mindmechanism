'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GlossaryWord } from '@/types/Glossary'
import {
  computeWordCloudLayout,
  fontSizeFromGrade,
  PlacedWordCloudItem,
  WordCloudInput,
} from '@/lib/wordCloudLayout'
import { useTheme } from '@/app/ThemeContext'

const FONT_FAMILY = 'ui-sans-serif, system-ui, sans-serif'

function makeMeasure() {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return (text: string, fontSize: number) => ({
      width: text.length * fontSize * 0.55,
      height: fontSize * 1.2,
    })
  }
  return (text: string, fontSize: number) => {
    ctx.font = `600 ${fontSize}px ${FONT_FAMILY}`
    const m = ctx.measureText(text)
    const asc = m.actualBoundingBoxAscent ?? fontSize * 0.58
    const desc = m.actualBoundingBoxDescent ?? fontSize * 0.22
    return { width: m.width, height: asc + desc }
  }
}

function sentimentFill(rating: GlossaryWord['rating'], dark: boolean): string {
  if (rating === '+') return dark ? '#6ee7b7' : '#047857'
  if (rating === '-') return dark ? '#fda4af' : '#be123c'
  return dark ? '#cbd5e1' : '#475569'
}

function accentStroke(word: GlossaryWord, clockHex: readonly string[]): string {
  if (word.source === 'user') return '#a855f7'
  const id = word.clock_id
  if (id != null && id >= 0 && id < clockHex.length) return clockHex[id]
  return 'transparent'
}

export interface GlossaryWordCloudProps {
  words: GlossaryWord[]
  clockHex: readonly string[]
  selectedId?: string | null
  onWordSelect?: (word: GlossaryWord | null) => void
}

export function GlossaryWordCloud({
  words,
  clockHex,
  selectedId,
  onWordSelect,
}: GlossaryWordCloudProps) {
  const { isDarkMode } = useTheme()
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const placedRef = useRef<PlacedWordCloudItem[]>([])
  const wordById = useMemo(() => {
    const m = new Map<string, GlossaryWord>()
    words.forEach((w) => m.set(w.id, w))
    return m
  }, [words])

  const inputs: WordCloudInput[] = useMemo(
    () =>
      words.map((w) => ({
        id: w.id,
        text: w.word,
        fontSize: fontSizeFromGrade(w.grade),
      })),
    [words]
  )

  const placed = useMemo(() => {
    if (size.w < 40 || size.h < 40 || inputs.length === 0) return []
    const measure = makeMeasure()
    return computeWordCloudLayout({
      words: inputs,
      width: size.w,
      height: size.h,
      padding: 3,
      margin: 8,
      measure,
    })
  }, [inputs, size.w, size.h])

  useEffect(() => {
    placedRef.current = placed
  }, [placed])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const sync = () => {
      const cr = el.getBoundingClientRect()
      setSize({ w: Math.floor(cr.width), h: Math.floor(cr.height) })
    }
    sync()
    const ro = new ResizeObserver(() => sync())
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || size.w < 40 || size.h < 40) return
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    canvas.width = Math.floor(size.w * dpr)
    canvas.height = Math.floor(size.h * dpr)
    canvas.style.width = `${size.w}px`
    canvas.style.height = `${size.h}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size.w, size.h)

    for (const item of placed) {
      const word = wordById.get(item.id)
      if (!word) continue
      const fill = sentimentFill(word.rating, isDarkMode)
      const stroke = accentStroke(word, clockHex)
      const selected = selectedId === item.id

      ctx.save()
      ctx.font = `600 ${item.fontSize}px ${FONT_FAMILY}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      if (stroke !== 'transparent') {
        ctx.strokeStyle = stroke
        ctx.lineWidth = selected ? 2.2 : 1.4
        ctx.lineJoin = 'round'
        ctx.strokeText(item.text, item.x, item.y)
      }
      ctx.fillStyle = fill
      ctx.fillText(item.text, item.x, item.y)
      ctx.restore()
    }
  }, [placed, size.w, size.h, wordById, clockHex, isDarkMode, selectedId])

  useEffect(() => {
    draw()
  }, [draw])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onWordSelect) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    for (let i = placedRef.current.length - 1; i >= 0; i--) {
      const item = placedRef.current[i]
      if (
        x >= item.x - item.halfW &&
        x <= item.x + item.halfW &&
        y >= item.y - item.halfH &&
        y <= item.y + item.halfH
      ) {
        const w = wordById.get(item.id)
        if (w) {
          onWordSelect(selectedId === item.id ? null : w)
        }
        return
      }
    }
    onWordSelect(null)
  }

  return (
    <div ref={wrapRef} className="absolute inset-0 min-h-[280px]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-pointer touch-manipulation"
        onClick={handleClick}
        aria-label="Word cloud of glossary terms"
        role="img"
      />
    </div>
  )
}
