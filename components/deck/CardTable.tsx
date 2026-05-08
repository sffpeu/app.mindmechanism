'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { MANDALA_NODES, WHEEL_COLORS, CARD_W, CARD_H, type MandalaNode } from '@/data/mandalaNodes'
import { DeckCard, type Annotation } from './DeckCard'
import { CreateSessionModal } from './CreateSessionModal'
import { SessionsPanel, type SavedSession } from './SessionsPanel'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy, type Firestore } from 'firebase/firestore'
import { addUserWord } from '@/lib/glossary'
import { getFirebaseStorage, db } from '@/lib/firebase'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { cn } from '@/lib/utils'
import { playDeckSessionLoadTone, playDeckSessionSaveTone } from '@/lib/deckSessionTone'

interface CardState {
  nodeId: string
  x: number
  y: number
  rotation: number
  zIndex: number
  isFlipped: boolean
  customContent?: { term: string; definition: string; phonetic: string }
}

const DEFAULT_DRAW_SIZE = 9
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

/**
 * Compress a base64 data URL to JPEG at max 900×900px and 72% quality.
 * Used before uploading to Firebase Storage to keep bandwidth and costs low.
 */
async function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const MAX = 900
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX }
        else { width = Math.round((width * MAX) / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(dataUrl); return }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.72))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

/**
 * Compress a data URL then upload it to Firebase Storage.
 * Returns the permanent download URL so the annotation can reference it directly.
 * Path format: deck-images/{uid}/{label}-{timestamp}.jpg
 */
async function uploadToStorage(dataUrl: string, uid: string, label: string): Promise<string> {
  const compressed = await compressImage(dataUrl)
  const response = await fetch(compressed)
  const blob = await response.blob()
  const storage = getFirebaseStorage()
  const path = `deck-images/${uid}/${label}-${Date.now()}.jpg`
  const fileRef = storageRef(storage, path)
  await uploadBytes(fileRef, blob, { contentType: 'image/jpeg' })
  return getDownloadURL(fileRef)
}

const EMPTY_ANNOTATION: Annotation = { userDef: '', notes: '', imageUrl: null, textIsLight: false, textSize: 'md', textColor: null }

/** Left-edge stripe colours — glossary / notes wheel family (thin accent bar on dark chrome). */
const DECK_CHROME_HELP_HEX = '#fd290a'
const DECK_CHROME_SESSION_HEX = '#eab308'

/** Session toolbar: gold hover on most actions; Draw uses green hover (incl. counter). */
const DECK_STRIP_BTN =
  'rounded-full border border-transparent px-[18px] py-2.5 text-sm font-semibold tracking-wide text-white/90 transition-colors duration-150 hover:border-amber-400/50 hover:bg-amber-500/18 hover:text-amber-100'
const DECK_STRIP_BTN_DRAW =
  'rounded-full border border-transparent px-[18px] py-2.5 text-sm font-semibold tracking-wide text-white/90 transition-colors duration-150 hover:border-emerald-400/55 hover:bg-emerald-500/22 hover:text-emerald-100'

export function CardTable() {
  const { user } = useAuth()
  const tableRef = useRef<HTMLDivElement>(null)
  const bgInputRef = useRef<HTMLInputElement>(null)
  const [cards, setCards] = useState<CardState[]>([])
  const [annotations, setAnnotations] = useState<Record<string, Annotation>>({})
  const [remainingDeck, setRemainingDeck] = useState<string[]>([])
  const [tableBackground, setTableBackground] = useState<string | null>(null)
  const [expandedNode, setExpandedNode] = useState<MandalaNode | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [showCreateSession, setShowCreateSession] = useState(false)
  const [showSessions, setShowSessions] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([])
  const [currentSessionName, setCurrentSessionName] = useState('Default Draw')

  // Load deck sessions from Firestore whenever the authenticated user is known
  useEffect(() => {
    if (!user) return
    let mounted = true
    ;(async () => {
      // db initialises slightly after auth — wait up to 2 s
      let attempts = 0
      while (!db && attempts < 20) {
        await new Promise(r => setTimeout(r, 100))
        attempts++
      }
      if (!db || !mounted) return
      try {
        const sessionsCol = collection(db as Firestore, 'users', user.uid, 'deckSessions')
        const snap = await getDocs(query(sessionsCol, orderBy('savedAt', 'desc')))
        if (mounted) setSavedSessions(snap.docs.map(d => d.data() as SavedSession))
      } catch (err) {
        console.error('Failed to load deck sessions:', err)
      }
    })()
    return () => { mounted = false }
  }, [user])

  const AUTO_SAVE_KEY = 'mm-deck-autosave'

  // On mount: restore auto-saved table state, or fall back to a fresh scatter
  useEffect(() => {
    const el = tableRef.current
    if (!el) return
    const { clientWidth: w, clientHeight: h } = el
    if (w === 0 || h === 0) return

    try {
      const raw = localStorage.getItem(AUTO_SAVE_KEY)
      if (raw) {
        const snap = JSON.parse(raw)
        if (Array.isArray(snap.cards) && snap.cards.length > 0) {
          const normAnnotations: Record<string, Annotation> = {}
          for (const [k, v] of Object.entries(snap.annotations ?? {})) {
            normAnnotations[k] = { ...EMPTY_ANNOTATION, ...(v as Partial<Annotation>) }
          }
          setCards(snap.cards)
          setAnnotations(normAnnotations)
          setTableBackground(snap.tableBackground ?? null)
          setCurrentSessionName(snap.currentSessionName ?? 'Default Draw')
          setRemainingDeck(snap.remainingDeck ?? [])
          return
        }
      }
    } catch {
      // Corrupted snapshot — fall through to default scatter
    }

    const shuffled = [...MANDALA_NODES].sort(() => Math.random() - 0.5)
    const drawn = shuffled.slice(0, DEFAULT_DRAW_SIZE).map(n => n.id)
    const remaining = shuffled.slice(DEFAULT_DRAW_SIZE).map(n => n.id)
    setCards(makeScattered(drawn, w, h))
    setRemainingDeck(remaining)
  }, [])

  // Auto-save all table state to localStorage whenever anything changes (debounced 800ms).
  // Data URLs (in-flight uploads) are not persisted — only Firebase CDN URLs survive.
  useEffect(() => {
    if (cards.length === 0) return
    const timer = setTimeout(() => {
      const normAnnotations: Record<string, Annotation> = {}
      for (const [k, v] of Object.entries(annotations)) {
        normAnnotations[k] = {
          ...v,
          imageUrl: v.imageUrl?.startsWith('https://') ? v.imageUrl : null,
        }
      }
      const snapshot = {
        cards,
        annotations: normAnnotations,
        tableBackground: tableBackground?.startsWith('https://') ? tableBackground : null,
        currentSessionName,
        remainingDeck,
      }
      try {
        localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(snapshot))
      } catch {
        // Quota exceeded — silent fail
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [cards, annotations, tableBackground, currentSessionName, remainingDeck])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
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

  const handleAnnotationChange = useCallback((nodeId: string, field: keyof Annotation, value: string | boolean | number | null) => {
    setAnnotations(prev => ({
      ...prev,
      [nodeId]: { ...EMPTY_ANNOTATION, ...(prev[nodeId] ?? {}), [field]: value },
    }))

    if (field === 'imageUrl' && typeof value === 'string' && value.startsWith('data:') && user) {
      const uid = user.uid
      ;(async () => {
        try {
          const downloadUrl = await uploadToStorage(value, uid, `card-${nodeId}`)
          setAnnotations(prev => ({
            ...prev,
            [nodeId]: { ...prev[nodeId] ?? EMPTY_ANNOTATION, imageUrl: downloadUrl },
          }))
        } catch (err) {
          console.error('Card image upload failed:', err)
          // Keep the data URL in state — image still displays, just won't survive session save cleanly
        }
      })()
    }
  }, [user])

  const handleSendToGlossary = useCallback(async (nodeId: string) => {
    const card = cards.find(c => c.nodeId === nodeId)
    if (card?.customContent) {
      const { term, definition, phonetic } = card.customContent
      if (!term.trim()) { showToast('Add a term to the card first'); return }
      const result = await addUserWord({
        word: term.trim(),
        definition: definition.trim() || '',
        phonetic_spelling: phonetic.trim() || '',
        grade: 3,
        rating: '~',
        source: 'user',
        version: 'User',
        language: 'en',
        user_id: user?.uid,
      })
      showToast(result ? `"${term.trim()}" added to My Words` : 'Failed to add — try again')
      return
    }
    const node = MANDALA_NODES.find(n => n.id === nodeId)
    if (!node) return
    showToast(`"${node.term}" sent to Glossary`)
  }, [cards, showToast, user])

  const handleCustomContentChange = useCallback((nodeId: string, field: 'term' | 'definition' | 'phonetic', value: string) => {
    setCards(prev => prev.map(c =>
      c.nodeId === nodeId && c.customContent
        ? { ...c, customContent: { ...c.customContent, [field]: value } }
        : c
    ))
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

  const handleBgUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setTableBackground(dataUrl) // immediate preview
      if (user) {
        ;(async () => {
          try {
            const downloadUrl = await uploadToStorage(dataUrl, user.uid, 'bg')
            setTableBackground(downloadUrl)
          } catch (err) {
            console.error('Background image upload failed:', err)
            // Keep the data URL as fallback
          }
        })()
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [user])

  const handleSessionStart = useCallback((nodeIds: string[], sessionName: string, blankCount: number) => {
    const el = tableRef.current
    if (!el) return
    const { clientWidth: w, clientHeight: h } = el
    const taxonomyCards = makeScattered(nodeIds, w, h)
    const blankCards: CardState[] = Array.from({ length: blankCount }, (_, i) => ({
      nodeId: `blank-${Date.now()}-${i}`,
      x: MARGIN + Math.random() * Math.max(0, w - CARD_W - MARGIN * 2),
      y: MARGIN + Math.random() * Math.max(0, h - CARD_H - MARGIN * 2),
      rotation: (Math.random() - 0.5) * 22,
      zIndex: taxonomyCards.length + i + 1,
      isFlipped: false,
      customContent: { term: '', definition: '', phonetic: '' },
    }))
    setCards([...taxonomyCards, ...blankCards])
    setRemainingDeck(MANDALA_NODES.filter(n => !nodeIds.includes(n.id)).map(n => n.id))
    setAnnotations({})
    setExpandedNode(null)
    setCurrentSessionName(sessionName)
    setShowCreateSession(false)
    showToast(`Session started · ${sessionName}`)
  }, [showToast])

  const handleConfirmSave = useCallback(async (name: string) => {
    setShowSaveModal(false)
    setCurrentSessionName(name)

    // If any images are still data URLs (background upload in-flight or auth
    // unavailable), upload them now. Firestore has a 1 MB document limit so we
    // must never write raw base64 into it.
    const finalAnnotations: Record<string, Annotation> = {}
    for (const [nodeId, ann] of Object.entries(annotations)) {
      if (ann.imageUrl && ann.imageUrl.startsWith('data:') && user) {
        try {
          const downloadUrl = await uploadToStorage(ann.imageUrl, user.uid, `card-${nodeId}`)
          finalAnnotations[nodeId] = { ...ann, imageUrl: downloadUrl }
        } catch {
          finalAnnotations[nodeId] = { ...ann, imageUrl: null }
        }
      } else {
        finalAnnotations[nodeId] = ann
      }
    }

    let finalBg = tableBackground
    if (finalBg && finalBg.startsWith('data:') && user) {
      try {
        finalBg = await uploadToStorage(finalBg, user.uid, 'bg')
        setTableBackground(finalBg)
      } catch {
        finalBg = null
      }
    }

    const session: SavedSession = {
      id: Date.now().toString(),
      name,
      savedAt: Date.now(),
      cardCount: cards.length,
      cards,
      annotations: finalAnnotations,
      tableBackground: finalBg,
    }

    const updated = [session, ...savedSessions].slice(0, 20)
    setSavedSessions(updated)

    if (user && db) {
      try {
        await setDoc(
          doc(db as Firestore, 'users', user.uid, 'deckSessions', session.id),
          session
        )
        playDeckSessionSaveTone()
        showToast(`"${name}" saved`)
      } catch (err) {
        console.error('Firestore session save failed:', err)
        showToast('Save failed — please try again')
      }
    } else {
      showToast('Sign in to save sessions to your account')
    }
  }, [cards, annotations, tableBackground, savedSessions, user, showToast])

  const handleLoadSession = useCallback((session: SavedSession) => {
    playDeckSessionLoadTone()
    setCards(session.cards)
    // Merge stored annotations with EMPTY_ANNOTATION defaults so new fields are always present
    const normAnnotations: Record<string, Annotation> = {}
    for (const [k, v] of Object.entries(session.annotations)) {
      normAnnotations[k] = { ...EMPTY_ANNOTATION, ...v }
    }
    setAnnotations(normAnnotations)
    setTableBackground(session.tableBackground ?? null)
    setCurrentSessionName(session.name)
    setRemainingDeck(
      MANDALA_NODES.filter(n => !session.cards.find(c => c.nodeId === n.id)).map(n => n.id)
    )
    setExpandedNode(null)
    setShowSessions(false)
    showToast(`"${session.name}" loaded`)
  }, [showToast])

  const handleDeleteSession = useCallback(async (id: string) => {
    const updated = savedSessions.filter(s => s.id !== id)
    setSavedSessions(updated)
    if (user && db) {
      try {
        await deleteDoc(doc(db as Firestore, 'users', user.uid, 'deckSessions', id))
      } catch (err) {
        console.error('Firestore session delete failed:', err)
      }
    }
  }, [savedSessions, user])

  const nodeMap = Object.fromEntries(MANDALA_NODES.map(n => [n.id, n]))

  return (
    <div
      ref={tableRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: tableBackground ? '#000' : 'radial-gradient(ellipse at 40% 40%, #1e1e20 0%, #0d0d0f 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Table background image */}
      {tableBackground && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `url(${tableBackground})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
      )}
      {/* Dark overlay for readability */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: tableBackground ? 'rgba(0,0,0,0.58)' : 'none',
      }} />

      {/* Subtle grid texture */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.022, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {cards.map(card => {
        const isBlank = !!card.customContent
        const node = nodeMap[card.nodeId]
        if (!node && !isBlank) return null
        const effectiveNode = node ?? {
          id: card.nodeId,
          term: card.customContent!.term,
          phonetic: card.customContent!.phonetic,
          definition: card.customContent!.definition,
          wheel: 0,
          wheelName: 'Custom',
          grade: 0,
          rate: '~' as const,
          nodeId: 0,
        }
        return (
          <DeckCard
            key={card.nodeId}
            node={effectiveNode}
            x={card.x}
            y={card.y}
            rotation={card.rotation}
            zIndex={card.zIndex}
            isFlipped={card.isFlipped}
            annotation={annotations[card.nodeId] ?? EMPTY_ANNOTATION}
            onFlip={() => handleFlip(card.nodeId)}
            onBringToFront={() => bringToFront(card.nodeId)}
            onPositionChange={(x, y) => handlePositionChange(card.nodeId, x, y)}
            onAnnotationChange={(field, value) => handleAnnotationChange(card.nodeId, field, value)}
            onSendToGlossary={() => handleSendToGlossary(card.nodeId)}
            onExpand={() => setExpandedNode(effectiveNode)}
            customContent={card.customContent}
            onCustomContentChange={isBlank ? (field, value) => handleCustomContentChange(card.nodeId, field, value) : undefined}
          />
        )
      })}

      {/* Heading — bottom-left, clear of dock */}
      <div style={{
        position: 'absolute', bottom: 28, left: 76, zIndex: 9999, pointerEvents: 'none',
      }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 4, fontWeight: 700 }}>
          The Mind Mechanism
        </div>
        <div style={{ fontSize: 38, fontWeight: 900, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.03em', textTransform: 'uppercase', lineHeight: 1 }}>
          Focus Deck
        </div>
      </div>

      {/* Help — round frosted control with wheel-red rim */}
      <button
        type="button"
        aria-label="Open deck help"
        title="Help"
        onClick={() => setShowHelp(true)}
        style={{
          position: 'absolute',
          top: 20,
          right: 24,
          zIndex: 9999,
          width: 48,
          height: 48,
          padding: 0,
          borderRadius: '50%',
          border: `2px solid ${DECK_CHROME_HELP_HEX}`,
          boxShadow: `0 0 0 1px rgba(255,255,255,0.12), 0 0 20px ${DECK_CHROME_HELP_HEX}33`,
          backgroundColor: `${DECK_CHROME_HELP_HEX}18`,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          color: 'rgba(255,255,255,0.95)',
          fontSize: 18,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ?
      </button>

      {/* Session name — top centre */}
      <div style={{
        position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
        fontSize: 10, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.12em',
        textTransform: 'uppercase', pointerEvents: 'none', zIndex: 9999,
      }}>
        {currentSessionName}
      </div>

      {/* Controls toggle + expandable strip — bottom centre */}
      <input ref={bgInputRef} type="file" accept="image/*" onChange={handleBgUpload} style={{ display: 'none' }} />
      <div style={{
        position: 'absolute', bottom: 24, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        zIndex: 9999,
      }}>
        {/* Expanded strip */}
        {showControls && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(14,14,16,0.92)',
            backdropFilter: 'blur(18px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 999,
            padding: '6px 10px',
          }}>
            <button
              type="button"
              className={DECK_STRIP_BTN}
              onClick={() => { setShowCreateSession(true); setShowControls(false) }}
            >
              New Session
            </button>
            <Divider />
            <button type="button" className={DECK_STRIP_BTN} onClick={handleScatter}>
              Scatter
            </button>
            <button
              type="button"
              onClick={handleDraw}
              disabled={remainingDeck.length === 0}
              className={cn(
                DECK_STRIP_BTN_DRAW,
                'disabled:pointer-events-none disabled:opacity-30 disabled:hover:border-transparent disabled:hover:bg-transparent disabled:hover:text-white/90',
              )}
            >
              Draw{remainingDeck.length > 0 ? ` (${remainingDeck.length})` : ''}
            </button>
            <Divider />
            <button
              type="button"
              className={DECK_STRIP_BTN}
              onClick={() => { setShowSaveModal(true); setShowControls(false) }}
            >
              Save
            </button>
            <button
              type="button"
              className={cn(DECK_STRIP_BTN, savedSessions.length === 0 && 'text-white/45')}
              onClick={() => { setShowSessions(true); setShowControls(false) }}
            >
              Sessions{savedSessions.length > 0 ? ` (${savedSessions.length})` : ''}
            </button>
            <Divider />
            <button
              type="button"
              className={DECK_STRIP_BTN}
              onClick={() => bgInputRef.current?.click()}
              title={tableBackground ? 'Change background' : 'Set background'}
            >
              {tableBackground ? '🖼 ✓' : '🖼'}
            </button>
            {tableBackground && (
              <button
                type="button"
                className={cn(DECK_STRIP_BTN, 'text-white/50')}
                onClick={() => setTableBackground(null)}
                title="Remove background"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Session tools toggle — round gold-rim control */}
        <button
          type="button"
          aria-label={showControls ? 'Close session tools' : 'Open session tools'}
          title={showControls ? 'Close' : 'Session tools'}
          onClick={() => setShowControls(v => !v)}
          style={{
            width: 48,
            height: 48,
            padding: 0,
            borderRadius: '50%',
            border: `2px solid ${DECK_CHROME_SESSION_HEX}`,
            boxShadow: `0 0 0 1px rgba(255,255,255,0.1), 0 0 18px ${DECK_CHROME_SESSION_HEX}33`,
            backgroundColor: showControls ? `${DECK_CHROME_SESSION_HEX}28` : `${DECK_CHROME_SESSION_HEX}18`,
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            color: 'rgba(255,255,255,0.95)',
            fontSize: showControls ? 22 : 20,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.18s ease',
          }}
        >
          {showControls ? '×' : '⋯'}
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
          border: '1px solid rgba(255,255,255,0.14)',
        }}>
          {toast}
        </div>
      )}

      {/* Create session modal */}
      {showCreateSession && (
        <CreateSessionModal
          onStart={handleSessionStart}
          onClose={() => setShowCreateSession(false)}
        />
      )}

      {/* Save modal — name the session before committing */}
      {showSaveModal && (
        <SaveModal
          defaultName={currentSessionName}
          onSave={handleConfirmSave}
          onClose={() => setShowSaveModal(false)}
        />
      )}

      {/* Help panel */}
      {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}

      {/* Sessions panel */}
      {showSessions && (
        <SessionsPanel
          sessions={savedSessions}
          onLoad={handleLoadSession}
          onDelete={handleDeleteSession}
          onClose={() => setShowSessions(false)}
        />
      )}

      {/* Expanded panel */}
      {expandedNode && (
        <ExpandedView
          node={expandedNode}
          annotation={annotations[expandedNode.id] ?? EMPTY_ANNOTATION}
          onAnnotationChange={(field, value) => handleAnnotationChange(expandedNode.id, field, value)}
          onClose={() => setExpandedNode(null)}
        />
      )}
    </div>
  )
}

function Divider() {
  return (
    <div
      style={{
        width: 1,
        height: 26,
        background: 'rgba(255,255,255,0.14)',
        margin: '0 6px',
        flexShrink: 0,
      }}
    />
  )
}

function SaveModal({ defaultName, onSave, onClose }: {
  defaultName: string
  onSave: (name: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState(defaultName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSave(trimmed)
  }

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 20000,
        background: 'rgba(0,0,0,0.68)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 360, background: '#1c1c1e',
          borderRadius: 16, border: '1px solid #2a2a2e',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid #252527' }}>
          <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 5 }}>
            Focus Deck
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#eee' }}>Name this session</div>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Session name"
            maxLength={60}
            style={{
              width: '100%', background: '#252528',
              border: '1px solid #363638', borderRadius: 8,
              color: '#eee', fontSize: 15, padding: '10px 14px',
              outline: 'none', fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 20px', background: 'transparent',
                border: '1px solid #363638', borderRadius: 8,
                color: '#666', fontSize: 13, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              style={{
                padding: '9px 24px', background: name.trim() ? '#fff' : '#333',
                border: 'none', borderRadius: 8,
                color: name.trim() ? '#111' : '#555',
                fontSize: 13, fontWeight: 700, cursor: name.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function HelpPanel({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const sections: Array<{ title: string; items: Array<{ label: string; desc: string }> }> = [
    {
      title: 'Working with cards',
      items: [
        { label: 'Flip', desc: 'Click any card to flip it between the front face and your personal side.' },
        { label: 'Drag', desc: 'Hold and drag to reposition a card anywhere on the table.' },
        { label: 'Expand ↗', desc: 'On the card back, tap the ↗ button for a full-screen view of the node.' },
        { label: 'Speak 🔊', desc: 'Tap the speaker icon to hear the term spoken aloud in British English.' },
        { label: 'Text mode A', desc: 'When a card has a background image, tap the A circle to toggle between dark and light text.' },
      ],
    },
    {
      title: 'Personalising cards',
      items: [
        { label: 'Your definition', desc: 'On the card back, write or speak your own definition. It appears on the front face beneath the original.' },
        { label: 'Voice input 🎙', desc: 'Tap Speak on the card back to dictate your definition hands-free.' },
        { label: 'Card image 🖼', desc: 'Set a personal photograph or image as the card background using the 🖼 button on either face.' },
        { label: 'Notes', desc: 'Add private notes to any card — visible only on the back and in the expanded view.' },
        { label: '→ Glossary', desc: 'Send a node to your Glossary for long-term reference.' },
      ],
    },
    {
      title: 'Sessions',
      items: [
        { label: 'New Session', desc: 'Open the session builder: initial wheel cards (0–16), optional blank cards (up to 8), and a session name. Use 0 wheel cards for a blanks-only start, then Draw to pull wheel cards from the deck.' },
        { label: 'Scatter', desc: 'Randomise the positions of all cards currently on the table.' },
        { label: 'Draw', desc: 'Deal one additional card from the remaining deck onto the table.' },
        { label: 'Save', desc: 'Snapshot the current table — card positions, flip states, annotations, and images — to your cloud account. Images are stored in Firebase Storage; session metadata in Firestore.' },
        { label: 'Sessions', desc: 'Open the sessions panel to load or delete a previously saved layout. Up to 20 sessions are stored in your account.' },
      ],
    },
  ]

  return (
    <>
      {/* Light scrim — deck stays visible; click outside closes */}
      <div
        role="presentation"
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 19990,
          background: 'rgba(0,0,0,0.38)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="deck-help-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          zIndex: 20000,
          left: '50%',
          top: 'max(72px, 8vh)',
          transform: 'translateX(-50%)',
          width: 'min(420px, calc(100vw - 28px))',
          maxHeight: 'min(82vh, 720px)',
          display: 'flex',
          flexDirection: 'column',
          background: '#161618',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '20px 22px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.38)',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                marginBottom: 5,
              }}
            >
              Focus Deck
            </div>
            <div id="deck-help-title" style={{ fontSize: 18, fontWeight: 800, color: '#f4f4f5' }}>
              How to use
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
            aria-label="Close help"
          >
            <span className="text-lg leading-none">✕</span>
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 0 24px' }}>
          {sections.map((section) => (
            <div key={section.title} style={{ padding: '16px 22px 4px' }}>
              <div
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.42)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  fontWeight: 600,
                  marginBottom: 12,
                  paddingBottom: 8,
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {section.title}
              </div>
              {section.items.map((item) => (
                <div key={item.label} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e4e4e7', marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.52)', lineHeight: 1.65 }}>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function ExpandedView({
  node, annotation, onAnnotationChange, onClose,
}: {
  node: MandalaNode
  annotation: Annotation
  onAnnotationChange: (field: keyof Annotation, value: string | boolean | number | null) => void
  onClose: () => void
}) {
  const wheelColor = WHEEL_COLORS[node.wheel]
  const hasImage = !!annotation.imageUrl
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onAnnotationChange('imageUrl', ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(node.term)
    utterance.lang = 'en-GB'
    utterance.rate = 0.85
    window.speechSynthesis.speak(utterance)
  }

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
          width: 520, maxHeight: '86vh',
          background: '#1c1c1e', borderRadius: 16,
          overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
          display: 'flex', flexDirection: 'column',
          border: '1px solid #2a2a2e',
        }}
      >
        <div style={{
          height: hasImage ? 180 : 'auto',
          position: 'relative',
          background: hasImage ? '#000' : wheelColor,
          flexShrink: 0,
        }}>
          {hasImage && (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${annotation.imageUrl})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
            }} />
          )}
          <div style={{
            position: 'absolute', inset: 0,
            background: hasImage
              ? 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)'
              : 'none',
          }} />
          <div style={{ position: 'relative', padding: hasImage ? '16px 24px' : '20px 24px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ fontSize: 10, color: hasImage ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.75)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
              Wheel {node.wheel} · {node.wheelName} · Grade {node.grade} · {node.rate}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>
                {node.term}
              </div>
              <button
                onClick={handleSpeak}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, padding: '4px 9px', cursor: 'pointer', color: '#fff', fontSize: 14 }}
              >
                🔊
              </button>
            </div>
            <div style={{ fontSize: 13, fontStyle: 'italic', color: hasImage ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.75)', fontFamily: 'Georgia, serif', marginTop: 4 }}>
              {node.phonetic}
            </div>
          </div>
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: 'rgba(255,255,255,0.75)', fontSize: 11 }}
            >
              {hasImage ? '🖼 Change' : '🖼 Set image'}
            </button>
            {hasImage && (
              <button
                onClick={() => onAnnotationChange('imageUrl', null)}
                style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 11 }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div style={{ padding: '18px 24px 0', borderBottom: '1px solid #252527' }}>
          <div style={{ fontSize: 15, color: '#bbb', lineHeight: 1.65, paddingBottom: 18 }}>
            {node.definition}
          </div>
        </div>

        <div style={{ padding: '18px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
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

        <div style={{ padding: '14px 24px', borderTop: '1px solid #252527', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 20px', background: '#252527', color: '#888', border: '1px solid #363638', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
