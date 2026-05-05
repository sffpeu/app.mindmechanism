'use client'

import { useState, useMemo } from 'react'
import { MANDALA_NODES, WHEEL_COLORS } from '@/data/mandalaNodes'

interface Props {
  onStart: (nodeIds: string[], sessionName: string, blankCount: number) => void
  onClose: () => void
}

export function CreateSessionModal({ onStart, onClose }: Props) {
  const [count, setCount] = useState(9)
  const [blankCount, setBlankCount] = useState(0)
  const [sessionName, setSessionName] = useState('')

  const wheelData = useMemo(() => {
    const map: Record<number, { ids: string[]; name: string }> = {}
    for (const node of MANDALA_NODES) {
      if (!map[node.wheel]) map[node.wheel] = { ids: [], name: node.wheelName }
      map[node.wheel].ids.push(node.id)
    }
    return map
  }, [])

  const wheels = Object.keys(wheelData).map(Number).sort((a, b) => a - b)
  const eligibleWheels = wheels.filter(w => wheelData[w].ids.length >= count)
  const eligibleNodeIds = eligibleWheels.flatMap(w => wheelData[w].ids)
  /** When count > 0, the pooled wheel nodes must cover the draw size. */
  const taxonomyPoolOk = count === 0 || eligibleNodeIds.length >= count
  /** At least one card on the table: wheel draw, blanks, or both. */
  const hasAnyCards = blankCount > 0 || count > 0
  const canProceed = hasAnyCards && taxonomyPoolOk

  const handleStart = () => {
    if (!canProceed) return
    const shuffled = [...eligibleNodeIds].sort(() => Math.random() - 0.5)
    const drawnIds = count > 0 ? shuffled.slice(0, count) : []
    onStart(drawnIds, sessionName.trim() || 'Session', blankCount)
  }

  const inc = () => setCount(c => Math.min(16, c + 1))
  const dec = () => setCount(c => Math.max(0, c - 1))
  const incBlank = () => setBlankCount(c => Math.min(8, c + 1))
  const decBlank = () => setBlankCount(c => Math.max(0, c - 1))

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 20000,
        background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 560, background: '#1c1c1e', borderRadius: 20,
          border: '1px solid #2a2a2e',
          boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid #252527' }}>
          <div style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>
            Mind Mechanism
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#eee', letterSpacing: '0.01em' }}>
            Create Session
          </div>
          <div style={{ fontSize: 13, color: '#444', marginTop: 4 }}>
            Initial wheel cards (0–16), plus up to 8 blank cards. Set wheel draw to 0 for blanks only — then use Draw to add wheel cards from the deck.
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', display: 'flex', gap: 32 }}>

          {/* Left: name + count */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div>
              <label style={{
                fontSize: 10, color: '#555', textTransform: 'uppercase',
                letterSpacing: '0.1em', display: 'block', marginBottom: 8,
              }}>
                Session name
              </label>
              <input
                value={sessionName}
                onChange={e => setSessionName(e.target.value)}
                placeholder="e.g. Morning reflection"
                style={{
                  width: '100%', background: '#252527',
                  border: '1px solid #363638', borderRadius: 8,
                  color: '#e0e0e0', fontSize: 14, padding: '10px 12px',
                  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Count picker */}
            <div>
              <label style={{
                fontSize: 10, color: '#555', textTransform: 'uppercase',
                letterSpacing: '0.1em', display: 'block', marginBottom: 14,
              }}>
                Wheel cards on table
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={dec}
                  disabled={count <= 0}
                  style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: '#252527', border: '1px solid #363638',
                    color: count <= 0 ? '#333' : '#aaa', fontSize: 22,
                    cursor: count <= 0 ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  −
                </button>

                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    fontSize: 64, fontWeight: 900, color: '#fff',
                    lineHeight: 1, letterSpacing: '-0.03em',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {count}
                  </div>
                  <div style={{
                    fontSize: 10, color: '#3a3a3a', marginTop: 6,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}>
                    min 0 · max 16
                  </div>
                </div>

                <button
                  onClick={inc}
                  disabled={count >= 16}
                  style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: '#252527', border: '1px solid #363638',
                    color: count >= 16 ? '#333' : '#aaa', fontSize: 22,
                    cursor: count >= 16 ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Blank cards picker */}
            <div>
              <label style={{
                fontSize: 10, color: '#555', textTransform: 'uppercase',
                letterSpacing: '0.1em', display: 'block', marginBottom: 10,
              }}>
                Blank cards <span style={{ color: '#3a3a3a', fontStyle: 'italic', textTransform: 'none' }}>— fill in your own words</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={decBlank}
                  disabled={blankCount <= 0}
                  style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: '#252527', border: '1px solid #363638',
                    color: blankCount <= 0 ? '#333' : '#aaa', fontSize: 18,
                    cursor: blankCount <= 0 ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  −
                </button>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    fontSize: 40, fontWeight: 900, color: blankCount > 0 ? '#fff' : '#333',
                    lineHeight: 1, letterSpacing: '-0.03em',
                    fontVariantNumeric: 'tabular-nums',
                    transition: 'color 0.15s',
                  }}>
                    {blankCount}
                  </div>
                  <div style={{ fontSize: 10, color: '#3a3a3a', marginTop: 4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    max 8
                  </div>
                </div>
                <button
                  onClick={incBlank}
                  disabled={blankCount >= 8}
                  style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: '#252527', border: '1px solid #363638',
                    color: blankCount >= 8 ? '#333' : '#aaa', fontSize: 18,
                    cursor: blankCount >= 8 ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Eligibility summary */}
            <div style={{ fontSize: 12, color: '#3a3a3a', lineHeight: 1.6 }}>
              {eligibleNodeIds.length} nodes across {eligibleWheels.length} wheel{eligibleWheels.length !== 1 ? 's' : ''} eligible
            </div>
          </div>

          {/* Right: wheel list */}
          <div style={{ width: 168, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              fontSize: 10, color: '#555', textTransform: 'uppercase',
              letterSpacing: '0.1em', marginBottom: 10,
            }}>
              Wheels
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {wheels.map(w => {
                const { ids, name } = wheelData[w]
                const eligible = ids.length >= count
                const color = WHEEL_COLORS[w]
                return (
                  <div
                    key={w}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      opacity: eligible ? 1 : 0.2,
                      transition: 'opacity 0.18s',
                    }}
                  >
                    <div style={{
                      width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
                      background: eligible ? color : '#444',
                      transition: 'background 0.18s',
                    }} />
                    <div style={{
                      fontSize: 12, color: eligible ? '#bbb' : '#444',
                      flex: 1, transition: 'color 0.18s',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {name}
                    </div>
                    <div style={{
                      fontSize: 11, fontWeight: 700,
                      color: eligible ? color : '#333',
                      fontVariantNumeric: 'tabular-nums',
                      transition: 'color 0.18s',
                    }}>
                      ×{ids.length}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 28px', borderTop: '1px solid #252527',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 18px', background: 'none',
              color: '#555', border: '1px solid #2e2e30',
              borderRadius: 8, fontSize: 13, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={!canProceed}
            style={{
              padding: '9px 26px',
              background: canProceed ? '#ffffff' : '#252527',
              color: canProceed ? '#000' : '#3a3a3a',
              border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 700,
              cursor: canProceed ? 'pointer' : 'not-allowed',
              letterSpacing: '0.04em',
              transition: 'background 0.18s, color 0.18s',
            }}
          >
            Start Session →
          </button>
        </div>
      </div>
    </div>
  )
}
