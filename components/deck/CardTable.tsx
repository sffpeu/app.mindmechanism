'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { MANDALA_NODES, WHEEL_COLORS, CARD_W, CARD_H, type MandalaNode } from '@/data/mandalaNodes'
import { DeckCard } from './DeckCard'

interface CardState {
  nodeId: string
  x: number
  y: number
  rotation: number
  zIndex: number
  isFlipped: boolean
}

interface Annotation {
  userDef: string
  notes: string
}

const DEFAULT_DRAW = [
  'achievement', 'union', 'rampant', 'balancing',
  'resonating', 'child_like', 'seeking', 'infinity', 'father',
]

const MARGIN = 40

function makeScattered(nodeIds: string[], w: number, h: number): CardState[] {
  return nodeIds.map((nodeId, i) => ({
    nodeId,
    x: MARGIN + Math.random() * Math.max(0, w - CARD_W - MARGIN * 2),
    y: MARGIN + Math.random() * Math.max(0, h - CARD_H - MARGIN * 2),
    rotation: (Math.random() - 0.5) * 22,
    zIndex: i + 1,
    isFlipped: false,
  }))
}

export function CardTable() {
  const tableRef = useRef<HTMLDivElement>(null)
  const [cards, setCards] = useState<CardState[]>([])
  const [annotations, setAnnotations] = useState<Record<string, Annotation>>({})
  const [deckIds] = useState<string[]>(
    MANDALA_NODES.filter(n => !DEFAULT_DRAW.includes(n.id)).map(n => n.id)
  )
  const [remainingDeck, setRemainingDeck] = useState<string[]>([])
  const [expandedNode, setExpandedNode] = useState<MandalaNode | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    setRemainingDeck(deckIds)
  }, [deckIds])

  useEffect(() => {
    const el = tableRef.current
    if (!el) return
    const { clientWidth: w, clientHeight: h } = el
    if (w === 0 || h === 0) return
    setCards(makeScattered(DEFAULT_DRAW, w, h))
  }, [])

  const bringToFront = useCallback((nodeId: string) => {
    setCards(prev => {
      const maxZ = Math.max(0, ...prev.map(c => c.zIndex))
      return prev.map(c => c.nodeId === nodeId ? { ...c, zIndex: maxZ + 1 } : c)
    })
  }, [])

  const handleFlip = useCallback((nodeId: string) => {
    setCards(prev => prev.map(c => c.nodeId === nodeId ? { ...c, isFlipped: !c.isFlipped } : c))
  }, [])

  const handlePositionChange = useCallback((nodeId: string, x: number, y: number) => {
    setCards(prev => prev.map(c => c.nodeId === nodeId ? { ...c, x, y } : c))
  }, [])

  const handleAnnotationChange = useCallback((nodeId: string, field: keyof Annotation, value: string) => {
    setAnnotations(prev => ({
      ...prev,
      [nodeId]: { ...prev[nodeId] ?? { userDef: '', notes: '' }, [field]: value },
    }))
  }, [])

  const handleSendToGlossary = useCallback((nodeId: string) => {
    const node = MANDALA_NODES.find(n => n.id === nodeId)
    if (!node) return
    setToast(`"${node.term}" sent to Glossary`)
    setTimeout(() => setToast(null), 2500)
  }, [])

  const handleScatter = useCallback(() => {
    const el = tableRef.current
    if (!el) return
    const { clientWidth: w, clientHeight: h } = el
    setCards(prev => makeScattered(prev.map(c => c.nodeId), w, h))
  }, [])

  const handleDraw = useCallback(() => {
    if (remainingDeck.length === 0) return
    const el = tableRef.current
    if (!el) return
    const { clientWidth: w, clientHeight: h } = el
    const id = remainingDeck[0]
    setCards(prev => {
      const maxZ = Math.max(0, ...prev.map(c => c.zIndex))
      return [...prev, {
        nodeId: id,
        x: MARGIN + Math.random() * Math.max(0, w - CARD_W - MARGIN * 2),
        y: MARGIN + Math.random() * Math.max(0, h - CARD_H - MARGIN * 2),
        rotation: (Math.random() - 0.5) * 15,
        zIndex: maxZ + 1,
        isFlipped: false,
      }]
    })
    setRemainingDeck(prev => prev.slice(1))
  }, [remainingDeck])

  const nodeMap = Object.fromEntries(MANDALA_NODES.map(n => [n.id, n]))

  const btnStyle: React.CSSProperties = {
    padding: '10px 22px',
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(8px)',
    color: '#d0d0d0',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 24,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '0.04em',
  }

  return (
    <div
      ref={tableRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: 'radial-gradient(ellipse at 40% 40%, #1e1e20 0%, #0d0d0f 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Subtle grid texture */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.025, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {cards.map(card => {
        const node = nodeMap[card.nodeId]
        if (!node) return null
        return (
          <DeckCard
            key={card.nodeId}
            node={node}
            x={card.x}
            y={card.y}
            rotation={card.rotation}
            zIndex={card.zIndex}
            isFlipped={card.isFlipped}
            annotation={annotations[card.nodeId] ?? { userDef: '', notes: '' }}
            onFlip={() => handleFlip(card.nodeId)}
            onBringToFront={() => bringToFront(card.nodeId)}
            onPositionChange={(x, y) => handlePositionChange(card.nodeId, x, y)}
            onAnnotationChange={(field, value) => handleAnnotationChange(card.nodeId, field, value)}
            onSendToGlossary={() => handleSendToGlossary(card.nodeId)}
            onExpand={() => setExpandedNode(node)}
          />
        )
      })}

      {/* Controls */}
      <div style={{
        position: 'absolute', bottom: 28, left: '50%',
        transform: 'translateX(-50%)', display: 'flex', gap: 10, zIndex: 9999,
      }}>
        <button onClick={handleScatter} style={btnStyle}>Scatter</button>
        <button
          onClick={handleDraw}
          disabled={remainingDeck.length === 0}
          style={{ ...btnStyle, opacity: remainingDeck.length === 0 ? 0.35 : 1 }}
        >
          Draw {remainingDeck.length > 0 ? `(${remainingDeck.length})` : '—'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'absolute', bottom: 76, left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
          color: '#fff', padding: '8px 20px', borderRadius: 20,
          fontSize: 13, fontWeight: 500, zIndex: 10000, whiteSpace: 'nowrap',
          border: '1px solid rgba(255,255,255,0.15)',
        }}>
          {toast}
        </div>
      )}

      {/* Expanded view */}
      {expandedNode && (
        <ExpandedView
          node={expandedNode}
          annotation={annotations[expandedNode.id] ?? { userDef: '', notes: '' }}
          onAnnotationChange={(field, value) => handleAnnotationChange(expandedNode.id, field, value)}
          onClose={() => setExpandedNode(null)}
        />
      )}
    </div>
  )
}

function ExpandedView({
  node, annotation, onAnnotationChange, onClose,
}: {
  node: MandalaNode
  annotation: { userDef: string; notes: string }
  onAnnotationChange: (field: 'userDef' | 'notes', value: string) => void
  onClose: () => void
}) {
  const wheelColor = WHEEL_COLORS[node.wheel]
  const taStyle: React.CSSProperties = {
    width: '100%', background: '#252527',
    border: '1px solid #363638', borderRadius: 8,
    color: '#e0e0e0', fontSize: 14, padding: '10px 12px',
    resize: 'vertical', outline: 'none', fontFamily: 'inherit',
    lineHeight: 1.55, boxSizing: 'border-box',
  }

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 20000,
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 500, maxHeight: '82vh',
          background: '#1c1c1e', borderRadius: 16,
          overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
          display: 'flex', flexDirection: 'column',
          border: '1px solid #2a2a2e',
        }}
      >
        <div style={{ height: 8, background: wheelColor }} />
        <div style={{ padding: '24px 28px', borderBottom: '1px solid #252527' }}>
          <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
            Wheel {node.wheel} · {node.wheelName} · Grade {node.grade} · {node.rate}
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#f0f0f0', textTransform: 'uppercase', marginBottom: 8 }}>
            {node.term}
          </div>
          <div style={{ fontSize: 14, fontStyle: 'italic', color: '#666', fontFamily: 'Georgia, serif', marginBottom: 16 }}>
            {node.phonetic}
          </div>
          <div style={{ fontSize: 16, color: '#bbb', lineHeight: 1.65 }}>
            {node.definition}
          </div>
        </div>
        <div style={{ padding: '20px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
              Your definition
            </label>
            <textarea
              value={annotation.userDef}
              onChange={e => onAnnotationChange('userDef', e.target.value)}
              placeholder="Write your own definition..."
              style={{ ...taStyle, height: 80 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
              Notes
            </label>
            <textarea
              value={annotation.notes}
              onChange={e => onAnnotationChange('notes', e.target.value)}
              placeholder="Add a note..."
              style={{ ...taStyle, height: 64 }}
            />
          </div>
        </div>
        <div style={{ padding: '16px 28px', borderTop: '1px solid #252527', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px', background: '#252527',
              color: '#888', border: '1px solid #363638', borderRadius: 8,
              fontSize: 13, cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
