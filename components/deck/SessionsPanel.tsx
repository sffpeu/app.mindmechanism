'use client'

export interface SavedSession {
  id: string
  name: string
  savedAt: number
  cardCount: number
  tableBackground: string | null
  cards: Array<{
    nodeId: string
    x: number
    y: number
    rotation: number
    zIndex: number
    isFlipped: boolean
    customContent?: { term: string; definition: string; phonetic: string }
  }>
  annotations: Record<string, {
    userDef: string
    notes: string
    imageUrl: string | null
    textIsLight?: boolean
    textSize?: 'sm' | 'md' | 'lg'
    textScalePercent?: number
    textBold?: boolean
    textColor?: string | null
    audioNoteId?: string
  }>
}

interface Props {
  sessions: SavedSession[]
  onLoad: (session: SavedSession) => void
  onDelete: (id: string) => void
  onClose: () => void
}

function formatDate(ts: number) {
  const d = new Date(ts)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function SessionsPanel({ sessions, onLoad, onDelete, onClose }: Props) {
  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 20000,
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)',
        display: 'flex', justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 340, height: '100%',
          background: '#1a1a1c', borderLeft: '1px solid #2a2a2e',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-24px 0 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 22px 18px',
          borderBottom: '1px solid #252527',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 5 }}>
              Mind Mechanism
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#eee' }}>Saved Sessions</div>
            <div style={{ fontSize: 12, color: '#444', marginTop: 3 }}>
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} stored
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#444',
              fontSize: 18, cursor: 'pointer', padding: '2px 4px', lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Session list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {sessions.length === 0 ? (
            <div style={{
              padding: '40px 22px', textAlign: 'center',
              color: '#333', fontSize: 13, lineHeight: 1.6,
            }}>
              No sessions saved yet.<br />
              Use the Save button to capture the current table.
            </div>
          ) : (
            sessions.map(session => (
              <div
                key={session.id}
                style={{
                  padding: '12px 22px',
                  borderBottom: '1px solid #1e1e20',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                {/* Background thumbnail */}
                <div style={{
                  width: 48, height: 34, borderRadius: 5, flexShrink: 0,
                  background: session.tableBackground ? '#000' : '#1e1e20',
                  backgroundImage: session.tableBackground ? `url(${session.tableBackground})` : 'none',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  border: '1px solid #2a2a2e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {!session.tableBackground && (
                    <span style={{ fontSize: 16, opacity: 0.25 }}>🃏</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 700, color: '#ddd',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {session.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#3a3a3a', marginTop: 3 }}>
                    {session.cardCount} card{session.cardCount !== 1 ? 's' : ''} · {formatDate(session.savedAt)}
                  </div>
                </div>
                <button
                  onClick={() => onLoad(session)}
                  style={{
                    padding: '5px 12px', background: '#252527',
                    border: '1px solid #363638', borderRadius: 6,
                    color: '#aaa', fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  }}
                >
                  Load
                </button>
                <button
                  onClick={() => onDelete(session.id)}
                  style={{
                    background: 'none', border: 'none',
                    color: '#333', fontSize: 14, cursor: 'pointer',
                    padding: '2px 4px', flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
