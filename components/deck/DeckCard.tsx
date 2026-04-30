'use client'

import { useRef, useCallback, useState } from 'react'
import type { MandalaNode } from '@/data/mandalaNodes'
import { WHEEL_COLORS, CARD_W, CARD_H } from '@/data/mandalaNodes'

export interface Annotation {
  userDef: string
  notes: string
  imageUrl: string | null
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
  onAnnotationChange: (field: keyof Annotation, value: string | null) => void
  onSendToGlossary: () => void
  onExpand: () => void
}

const RATE_COLOR: Record<string, string> = {
  '+': '#22c55e',
  '~': '#a3a3a3',
  '-': '#ef4444',
}

function speakTerm(term: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(term)
  utterance.lang = 'en-GB'
  utterance.rate = 0.85
  window.speechSynthesis.speak(utterance)
}

export function DeckCard({
  node, x, y, rotation, zIndex, isFlipped,
  annotation, onFlip, onBringToFront, onPositionChange,
  onAnnotationChange, onSendToGlossary, onExpand,
}: DeckCardProps) {
  const wheelColor = WHEEL_COLORS[node.wheel]
  const rateColor = RATE_COLOR[node.rate] ?? '#a3a3a3'
  const dragRef = useRef<{ startX: number; startY: number; cardX: number; cardY: number; moved: boolean } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<{ stop: () => void } | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [srSupported] = useState(() => {
    if (typeof window === 'undefined') return false
    const w = window as unknown as Record<string, unknown>
    return !!(w.SpeechRecognition || w.webkitSpeechRecognition)
  })

  const hasImage = !!annotation.imageUrl

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
    if (!dragRef.current.moved && Math.abs(dx) + Math.abs(dy) > 5) dragRef.current.moved = true
    if (dragRef.current.moved) onPositionChange(dragRef.current.cardX + dx, dragRef.current.cardY + dy)
  }, [onPositionChange])

  const handlePointerUp = useCallback(() => {
    if (!dragRef.current) return
    if (!dragRef.current.moved) onFlip()
    dragRef.current = null
  }, [onFlip])

  const stopProp = (e: React.PointerEvent | React.MouseEvent) => e.stopPropagation()

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation()
    speakTerm(node.term)
  }

  const handleMicToggle = (e: React.PointerEvent) => {
    e.stopPropagation()
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }
    type SRConstructor = new () => { lang: string; continuous: boolean; interimResults: boolean; onresult: ((ev: Event & { results: { [i: number]: { [i: number]: { transcript: string } } } }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void; stop: () => void }
    const w = window as unknown as Record<string, unknown>
    const SR = (w.SpeechRecognition || w.webkitSpeechRecognition) as SRConstructor | undefined
    if (!SR) return
    const rec = new SR()
    rec.lang = 'en-GB'
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = (ev) => {
      const transcript = ev.results[0][0].transcript
      const current = annotation.userDef
      onAnnotationChange('userDef', current ? `${current} ${transcript}` : transcript)
      setIsRecording(false)
    }
    rec.onerror = () => setIsRecording(false)
    rec.onend = () => setIsRecording(false)
    recognitionRef.current = rec
    rec.start()
    setIsRecording(true)
  }

  const handleImageClick = (e: React.PointerEvent) => {
    e.stopPropagation()
    fileInputRef.current?.click()
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onAnnotationChange('imageUrl', ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAnnotationChange('imageUrl', null)
  }

  return (
    <div
      style={{
        position: 'absolute', left: x, top: y,
        width: CARD_W, height: CARD_H,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
        perspective: 1000, zIndex,
        cursor: 'grab', userSelect: 'none', touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />

      <div style={{
        width: '100%', height: '100%', position: 'relative',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>

        {/* ── FRONT ── */}
        <div style={{
          position: 'absolute', width: '100%', height: '100%',
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' as never,
          borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 6px 28px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.3)',
          background: hasImage ? '#000' : '#fafaf9',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Image background */}
          {hasImage && (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${annotation.imageUrl})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
            }} />
          )}
          {/* Gradient overlay */}
          {hasImage && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.0) 35%, rgba(0,0,0,0.85) 100%)',
            }} />
          )}

          {!hasImage && <div style={{ height: 6, background: wheelColor, flexShrink: 0 }} />}

          <div style={{
            position: 'relative', flex: 1,
            padding: hasImage ? '10px 14px 12px' : '12px 15px 12px',
            display: 'flex', flexDirection: 'column',
            justifyContent: hasImage ? 'flex-end' : 'space-between',
          }}>
            {/* Top row: wheel label + speaker (no-image layout) */}
            {!hasImage && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: wheelColor, fontWeight: 600 }}>
                  Wheel {node.wheel} · {node.wheelName}
                </div>
                <button onClick={handleSpeak} onPointerDown={stopProp} title="Speak term"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', fontSize: 13, padding: '2px 3px' }}>
                  🔊
                </button>
              </div>
            )}

            {/* Image layout: speaker top-right absolute */}
            {hasImage && (
              <div style={{ position: 'absolute', top: 10, right: 12, zIndex: 1 }}>
                <button onClick={handleSpeak} onPointerDown={stopProp} title="Speak term"
                  style={{ background: 'rgba(0,0,0,0.35)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', fontSize: 13, borderRadius: 4, padding: '3px 6px' }}>
                  🔊
                </button>
              </div>
            )}

            {/* Wheel label for image mode */}
            {hasImage && (
              <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginBottom: 4 }}>
                Wheel {node.wheel} · {node.wheelName}
              </div>
            )}

            {/* Term */}
            <div style={{
              fontSize: 20, fontWeight: 800, letterSpacing: '0.02em',
              textTransform: 'uppercase', lineHeight: 1.1,
              color: hasImage ? '#fff' : '#111', marginBottom: 4,
            }}>
              {node.term}
            </div>

            {/* Phonetic */}
            <div style={{
              fontSize: 10, fontStyle: 'italic',
              color: hasImage ? 'rgba(255,255,255,0.62)' : '#888',
              fontFamily: 'Georgia, serif', marginBottom: hasImage ? 6 : 4,
            }}>
              {node.phonetic}
            </div>

            {!hasImage && <div style={{ height: 1, background: '#e8e8e8', marginBottom: 6 }} />}

            {/* Definition */}
            <div style={{
              fontSize: 11, lineHeight: 1.55,
              flex: hasImage ? 0 : 1,
              color: hasImage ? 'rgba(255,255,255,0.85)' : '#444',
              marginBottom: hasImage ? 8 : 0,
            }}>
              {node.definition}
            </div>

            {/* Footer: grade + camera + rate */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginTop: 'auto',
              paddingTop: hasImage ? 0 : 6,
              borderTop: hasImage ? 'none' : '1px solid #f0f0f0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 9, color: hasImage ? 'rgba(255,255,255,0.45)' : '#ccc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Grade</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: hasImage ? 'rgba(255,255,255,0.75)' : '#666' }}>{node.grade}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <button
                  onPointerDown={handleImageClick}
                  title="Set card image"
                  style={{
                    background: hasImage ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.05)',
                    border: 'none', cursor: 'pointer', padding: '2px 5px',
                    borderRadius: 4, fontSize: 11, lineHeight: 1,
                  }}
                >
                  🖼
                </button>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: '#fff',
                  background: rateColor, borderRadius: '50%',
                  width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {node.rate}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── BACK ── */}
        <div style={{
          position: 'absolute', width: '100%', height: '100%',
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' as never,
          transform: 'rotateY(180deg)',
          borderRadius: 12, background: '#1a1a1c',
          boxShadow: '0 6px 28px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.3)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ height: 6, background: wheelColor, flexShrink: 0 }} />

          <div style={{ padding: '9px 13px 7px', borderBottom: '1px solid #252528', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Your take ·</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#ddd', letterSpacing: '0.04em' }}>{node.term.toUpperCase()}</span>
            </div>
            <button onClick={handleSpeak} onPointerDown={stopProp} title="Speak term"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: 12, padding: '1px 3px' }}>
              🔊
            </button>
          </div>

          <div style={{ flex: 1, padding: '9px 13px', display: 'flex', flexDirection: 'column', gap: 7, overflow: 'hidden' }}>

            {/* Definition + mic */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <label style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Your definition
                </label>
                {srSupported && (
                  <button
                    onPointerDown={handleMicToggle}
                    title={isRecording ? 'Stop recording' : 'Speak to fill'}
                    style={{
                      background: isRecording ? '#ef4444' : '#252528',
                      border: isRecording ? 'none' : '1px solid #363638',
                      borderRadius: 4, padding: '2px 6px',
                      cursor: 'pointer', fontSize: 10, color: isRecording ? '#fff' : '#777',
                      display: 'flex', alignItems: 'center', gap: 3,
                    }}
                  >
                    {isRecording ? '⏹ Stop' : '🎙 Speak'}
                  </button>
                )}
              </div>
              <textarea
                value={annotation.userDef}
                onChange={e => onAnnotationChange('userDef', e.target.value)}
                onPointerDown={stopProp}
                placeholder={isRecording ? 'Listening...' : 'Write or speak your definition...'}
                style={{
                  width: '100%', height: 60, background: '#252528',
                  border: `1px solid ${isRecording ? '#ef4444' : '#363638'}`,
                  borderRadius: 6, color: '#ddd', fontSize: 11,
                  padding: '6px 8px', resize: 'none', outline: 'none',
                  fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>

            {/* Notes */}
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
                  width: '100%', height: 44, background: '#252528',
                  border: '1px solid #363638', borderRadius: 6,
                  color: '#ddd', fontSize: 11, padding: '6px 8px',
                  resize: 'none', outline: 'none', fontFamily: 'inherit',
                  lineHeight: 1.5, boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Image section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {hasImage ? (
                <>
                  <div style={{
                    width: 38, height: 26, borderRadius: 3, overflow: 'hidden', flexShrink: 0,
                    backgroundImage: `url(${annotation.imageUrl})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    border: '1px solid #363638',
                  }} />
                  <button
                    onPointerDown={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                    style={{ fontSize: 9, color: '#777', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}
                  >
                    Change
                  </button>
                  <button
                    onClick={handleRemoveImage} onPointerDown={stopProp}
                    style={{ fontSize: 9, color: '#444', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}
                  >
                    ✕
                  </button>
                </>
              ) : (
                <button
                  onPointerDown={handleImageClick}
                  style={{
                    fontSize: 9, color: '#555', background: '#252528',
                    border: '1px dashed #363638', borderRadius: 5,
                    padding: '4px 10px', cursor: 'pointer',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}
                >
                  🖼 Set card image
                </button>
              )}
            </div>
          </div>

          <div style={{ padding: '7px 13px', borderTop: '1px solid #252528', display: 'flex', gap: 6 }}>
            <button
              onPointerDown={stopProp} onClick={onSendToGlossary}
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
              onPointerDown={stopProp} onClick={onExpand}
              style={{
                padding: '6px 10px', background: '#252528',
                color: '#666', border: '1px solid #363638', borderRadius: 6,
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
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
