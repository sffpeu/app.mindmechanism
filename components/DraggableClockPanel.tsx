'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, useMotionValue } from 'framer-motion'
import { X, GripHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onClose: () => void
  clockHex: string
  clockIndex: number
  children: React.ReactNode
}

function defaultPos() {
  if (typeof window === 'undefined') return { x: 0, y: 56 }
  return { x: window.innerWidth - 195, y: 56 }
}

function savedPos(clockIndex: number): { x: number; y: number } | null {
  try {
    const raw = localStorage.getItem(`clockPanelPos_${clockIndex}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function DraggableClockPanel({ open, onClose, clockHex, clockIndex, children }: Props) {
  const [mounted, setMounted] = useState(false)
  const x = useMotionValue(0)
  const y = useMotionValue(56)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    const pos = savedPos(clockIndex) ?? defaultPos()
    x.set(pos.x)
    y.set(pos.y)
  }, [open, clockIndex, x, y])

  useEffect(() => {
    if (!open || !mounted) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, mounted, onClose])

  if (!mounted || !open) return null

  return createPortal(
    <motion.div
      drag
      dragMomentum={false}
      style={{ x, y, position: 'fixed', top: 0, left: 0, zIndex: 500 }}
      onDragEnd={() => {
        localStorage.setItem(
          `clockPanelPos_${clockIndex}`,
          JSON.stringify({ x: x.get(), y: y.get() })
        )
      }}
      className="min-w-[11rem] max-w-[16rem] rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-gray-950 shadow-lg overflow-hidden select-none"
    >
      <div
        className="flex items-center justify-between px-2 py-1 cursor-grab active:cursor-grabbing border-b border-black/5 dark:border-white/10"
        style={{ borderBottomColor: `${clockHex}33` }}
      >
        <GripHorizontal className="h-3 w-3 text-gray-400" aria-hidden />
        <button
          type="button"
          onClick={onClose}
          className="h-4 w-4 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          aria-label="Close panel"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      </div>
      <div className="py-1">{children}</div>
    </motion.div>,
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
