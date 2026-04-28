'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, GripHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

type Pos = { x: number; y: number }

type Props = {
  open: boolean
  onClose: () => void
  clockHex: string
  clockIndex: number
  children: React.ReactNode
}

function defaultPos(): Pos {
  if (typeof window === 'undefined') return { x: 16, y: 56 }
  return { x: window.innerWidth - 210, y: 56 }
}

function savedPos(clockIndex: number): Pos | null {
  try {
    const raw = localStorage.getItem(`clockPanelPos_${clockIndex}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function DraggableClockPanel({ open, onClose, clockHex, clockIndex, children }: Props) {
  const [mounted, setMounted] = useState(false)
  const [pos, setPos] = useState<Pos>({ x: 16, y: 56 })
  const posRef = useRef<Pos>({ x: 16, y: 56 })
  const isMountedRef = useRef(true)

  const setPosition = useCallback((p: Pos) => {
    posRef.current = p
    setPos(p)
  }, [])

  useEffect(() => {
    setMounted(true)
    return () => { isMountedRef.current = false }
  }, [])

  useEffect(() => {
    if (!open) return
    const p = savedPos(clockIndex) ?? defaultPos()
    setPosition(p)
  }, [open, clockIndex, setPosition])

  useEffect(() => {
    if (!open || !mounted) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, mounted, onClose])

  const handleGripMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const startPosX = posRef.current.x
    const startPosY = posRef.current.y

    const onMove = (ev: MouseEvent) => {
      if (!isMountedRef.current) return
      setPosition({
        x: startPosX + ev.clientX - startX,
        y: startPosY + ev.clientY - startY,
      })
    }

    const onUp = () => {
      localStorage.setItem(`clockPanelPos_${clockIndex}`, JSON.stringify(posRef.current))
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [clockIndex, setPosition])

  const handleGripTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    const startX = touch.clientX
    const startY = touch.clientY
    const startPosX = posRef.current.x
    const startPosY = posRef.current.y

    const onMove = (ev: TouchEvent) => {
      if (!isMountedRef.current) return
      const t = ev.touches[0]
      setPosition({
        x: startPosX + t.clientX - startX,
        y: startPosY + t.clientY - startY,
      })
    }

    const onEnd = () => {
      localStorage.setItem(`clockPanelPos_${clockIndex}`, JSON.stringify(posRef.current))
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }

    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
  }, [clockIndex, setPosition])

  if (!mounted || !open) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: 1100,
        minWidth: '11rem',
        maxWidth: '16rem',
      }}
      className="rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-gray-950 shadow-lg overflow-hidden select-none"
    >
      {/* Grip bar — drag target */}
      <div
        className="flex items-center justify-between px-2 py-1.5 cursor-grab active:cursor-grabbing border-b border-black/5 dark:border-white/10"
        style={{ borderBottomColor: `${clockHex}33` }}
        onMouseDown={handleGripMouseDown}
        onTouchStart={handleGripTouchStart}
      >
        <GripHorizontal className="h-3 w-3 text-gray-400" aria-hidden />
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onClose}
          className="h-4 w-4 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          aria-label="Close panel"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      </div>
      <div className="py-1">{children}</div>
    </div>,
    document.body
  )
}

export function ClockPanelRow({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-1.5 px-2 py-1.5 text-[11px] text-gray-800 dark:text-gray-200',
        className
      )}
    >
      {children}
    </div>
  )
}
