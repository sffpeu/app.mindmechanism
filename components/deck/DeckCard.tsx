'use client'

import { useRef, useCallback } from 'react'
import type { MandalaNode } from '@/data/mandalaNodes'
import { WHEEL_COLORS, CARD_W, CARD_H } from '@/data/mandalaNodes'

interface Annotation {
  userDef: string
  notes: string
}

interface DeckCardProps {
  node: MandalaNode
  x: number
  y: number
  rotation: number
  zIndex: number
  isFlipped: boolean
  annotation: Annotation
  onFlip: () => void
  onBringToFront: () => void
  onPositionChange: (x: number, y: number) => void
  onAnnotationChange: (field: keyof Annotation, value: string) => void
  onSendToGlossary: () => void
  onExpand: () => void
}

const RATE_COLOR: Record<string, string> = {
  '+': '#22c55e',
  '~': '#a3a3a3',
  '-': '#ef4444',
}

export function DeckCard({
  node, x, y, rotation, zIndex, isFlipped,
  annotation, onFlip, onBringToFront, onPositionChange,
  onAnnotationChange, onSendToGlossary, onExpand,
}: DeckCardProps) {
  const wheelColor = WHEEL_COLORS[node.wheel]
  const rateColor = RATE_COLOR[node.rate] ?? '#a3a3a3'
  const dragRef = useRef<{ startX: number; startY: number; cardX: number; cardY: number; moved: boolean } | null>(null)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    onBringToFront()
    dragRef.current = { startX: e.clientX, startY: e.clientY, cardX: x, cardY: y, moved: false }
  }, [x, y, onBringToFront])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    if (!dragRef.current.moved && Math.abs(dx) + Math.abs(dy) > 5) {
      dragRef.current.moved = true
    }
    if (dragRef.current.moved) {
      onPositionChange(dragRef.current.cardX + dx, dragRef.current.cardY + dy)
    }
  }, [onPositionChange])

  const handlePointerUp = useCallback(() => {
    if (!dragRef.current) return
    if (!dragRef.current.moved) onFlip()
    dragRef.current = null
  }, [onFlip])

  const stopProp = (e: React.PointerEvent) => e.stopPropagation()

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: CARD_W,
        height: CARD_H,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
        perspective: 1000,
        zIndex,
        cursor: 'grab',
        userSelect: 'none',
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* FRONT */}
        <div style={{
          position: 'absolute', width: '100%', height: '100%',
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' as never,
          borderRadius: 12, background: '#fafaf9',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ height: 6, background: wheelColor, flexShrink: 0 }} />
          <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: wheelColor, fontWeight: 600 }}>
              Wheel {node.wheel} · {node.wheelName}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase', color: '#111', lineHeight: 1.1 }}>
              {node.term}
            </div>
            <div style={{ fontSize: 11, fontStyle: 'italic', color: '#777', fontFamily: 'Georgia, serif' }}>
              {node.phonetic}
            </div>
            <div style={{ height: 1, background: '#e5e5e5', margin: '2px 0' }} />
            <div style={{ fontSize: 12, color: '#444', lineHeight: 1.55, flex: 1 }}>
              {node.definition}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 9, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Grade</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#555' }}>{node.grade}</span>
              </div>
              <div style={{
                fontSize: 12, fontWeight: 700, color: '#fff',
                background: rateColor, borderRadius: '50%',
                width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {node.rate}
              </div>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div style={{
          position: 'absolute', width: '100%', height: '100%',
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' as never,
          transform: 'rotateY(180deg)',
          borderRadius: 12, background: '#1c1c1e',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ height: 6, background: wheelColor, flexShrink: 0 }} />
          <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid #2a2a2e', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 9, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Your take ·</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#ddd', letterSpacing: '0.05em' }}>{node.term.toUpperCase()}</span>
          </div>
          <div style={{ flex: 1, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
            <div>
              <label style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>
                Your definition
              </label>
              <textarea
                value={annotation.userDef}
                onChange={e => onAnnotationChange('userDef', e.target.value)}
                onPointerDown={stopProp}
                placeholder="Write your own definition..."
                style={{
                  width: '100%', height: 68, background: '#2a2a2e',
                  border: '1px solid #3a3a3e', borderRadius: 6,
                  color: '#e0e0e0', fontSize: 11, padding: '6px 8px',
                  resize: 'none', outline: 'none', fontFamily: 'inherit',
                  lineHeight: 1.5, boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>
                Notes
              </label>
              <textarea
                value={annotation.notes}
                onChange={e => onAnnotationChange('notes', e.target.value)}
                onPointerDown={stopProp}
                placeholder="Add a note..."
                style={{
                  width: '100%', height: 52, background: '#2a2a2e',
                  border: '1px solid #3a3a3e', borderRadius: 6,
                  color: '#e0e0e0', fontSize: 11, padding: '6px 8px',
                  resize: 'none', outline: 'none', fontFamily: 'inherit',
                  lineHeight: 1.5, boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
          <div style={{ padding: '8px 14px', borderTop: '1px solid #2a2a2e', display: 'flex', gap: 6 }}>
            <button
              onPointerDown={stopProp}
              onClick={onSendToGlossary}
              style={{
                flex: 1, padding: '6px 8px', background: wheelColor,
                color: '#fff', border: 'none', borderRadius: 6,
                fontSize: 10, fontWeight: 600, cursor: 'pointer',
                letterSpacing: '0.05em', textTransform: 'uppercase',
              }}
            >
              → Glossary
            </button>
            <button
              onPointerDown={stopProp}
              onClick={onExpand}
              style={{
                padding: '6px 10px', background: '#2a2a2e',
                color: '#888', border: '1px solid #3a3a3e', borderRadius: 6,
                fontSize: 10, fontWeight: 600, cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              ↗
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
