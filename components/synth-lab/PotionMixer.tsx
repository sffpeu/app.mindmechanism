'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { WHEEL_HEX } from '@/lib/wheelColors'
import { clockTitles } from '@/lib/clockTitles'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'

// ─── Drop definitions ────────────────────────────────────────────────────────

type Drop = {
  id: string
  name: string
  color: string
  sub: string
}

const DROPS: Drop[] = [
  { id: 'warmth',  name: 'Warmth',  color: '#fd290a', sub: 'deep and settled'    },
  { id: 'glow',    name: 'Glow',    color: '#fba63b', sub: 'bright and resonant' },
  { id: 'shimmer', name: 'Shimmer', color: '#f7da5f', sub: 'high and airy'       },
  { id: 'breath',  name: 'Breath',  color: '#6dc037', sub: 'soft and moving'     },
  { id: 'space',   name: 'Space',   color: '#156fde', sub: 'wide and open'       },
  { id: 'weight',  name: 'Weight',  color: '#941952', sub: 'low and steady'      },
  { id: 'hum',     name: 'Hum',     color: '#541b96', sub: 'constant and still'  },
  { id: 'mist',    name: 'Mist',    color: '#ee5fa7', sub: 'soft and dispersed'  },
  { id: 'glass',   name: 'Glass',   color: '#56c1ff', sub: 'clear and pure'      },
]

// ─── Colour blending (level-weighted) ────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

function blendWeighted(entries: Array<{ color: string; level: number }>): string {
  if (!entries.length) return 'transparent'
  const total = entries.reduce((s, e) => s + e.level, 0)
  if (total === 0) return '#1e1e2e'
  const r = Math.round(entries.reduce((s, e) => s + hexToRgb(e.color)[0] * e.level, 0) / total)
  const g = Math.round(entries.reduce((s, e) => s + hexToRgb(e.color)[1] * e.level, 0) / total)
  const b = Math.round(entries.reduce((s, e) => s + hexToRgb(e.color)[2] * e.level, 0) / total)
  return `rgb(${r},${g},${b})`
}

// ─── Audio engine ─────────────────────────────────────────────────────────────

type DropAudioHandle = {
  stop: () => void
  setLevel: (v: number) => void
}

function makeNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate
  const buf = ctx.createBuffer(1, sr * 2, sr)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buf
}

function createDropAudio(ctx: AudioContext, master: GainNode, id: string): DropAudioHandle {
  // Per-drop level gate — this is what the fader gesture controls
  const levelGain = ctx.createGain()
  levelGain.gain.setValueAtTime(0, ctx.currentTime)
  levelGain.connect(master)

  const oscillators: OscillatorNode[] = []
  const extraNodes: AudioNode[] = []

  const fadeIn = (duration = 2) =>
    levelGain.gain.linearRampToValueAtTime(1, ctx.currentTime + duration)

  switch (id) {
    case 'warmth': {
      const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 80
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 160
      const g1 = ctx.createGain(); g1.gain.value = 0.18
      const g2 = ctx.createGain(); g2.gain.value = 0.09
      o1.connect(g1); o2.connect(g2); g1.connect(levelGain); g2.connect(levelGain)
      fadeIn(3); o1.start(); o2.start()
      oscillators.push(o1, o2); extraNodes.push(g1, g2)
      break
    }
    case 'glow': {
      const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 432
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 864
      const g1 = ctx.createGain(); g1.gain.value = 0.12
      const g2 = ctx.createGain(); g2.gain.value = 0.06
      o1.connect(g1); o2.connect(g2); g1.connect(levelGain); g2.connect(levelGain)
      fadeIn(1.5); o1.start(); o2.start()
      oscillators.push(o1, o2); extraNodes.push(g1, g2)
      break
    }
    case 'shimmer': {
      for (const f of [880, 1320, 2200]) {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f
        const og = ctx.createGain(); og.gain.value = 0.04
        o.connect(og); og.connect(levelGain)
        o.start(); oscillators.push(o); extraNodes.push(og)
      }
      fadeIn(2)
      break
    }
    case 'breath': {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 180
      const amp = ctx.createGain(); amp.gain.value = 0.12
      const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.25
      const lfoG = ctx.createGain(); lfoG.gain.value = 0.06
      lfo.connect(lfoG); lfoG.connect(amp.gain)
      o.connect(amp); amp.connect(levelGain)
      fadeIn(2); o.start(); lfo.start()
      oscillators.push(o, lfo); extraNodes.push(amp, lfoG)
      break
    }
    case 'space': {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 528
      const og = ctx.createGain(); og.gain.value = 0.08
      const delay = ctx.createDelay(1.0); delay.delayTime.value = 0.45
      const fbG = ctx.createGain(); fbG.gain.value = 0.5
      o.connect(og); og.connect(levelGain); og.connect(delay)
      delay.connect(fbG); fbG.connect(delay); delay.connect(levelGain)
      fadeIn(2); o.start()
      oscillators.push(o); extraNodes.push(og, delay, fbG)
      break
    }
    case 'weight': {
      const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 55
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 110
      const g1 = ctx.createGain(); g1.gain.value = 0.22
      const g2 = ctx.createGain(); g2.gain.value = 0.1
      o1.connect(g1); o2.connect(g2); g1.connect(levelGain); g2.connect(levelGain)
      fadeIn(4); o1.start(); o2.start()
      oscillators.push(o1, o2); extraNodes.push(g1, g2)
      break
    }
    case 'hum': {
      const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 220
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 221.5
      const g1 = ctx.createGain(); g1.gain.value = 0.1
      const g2 = ctx.createGain(); g2.gain.value = 0.1
      o1.connect(g1); o2.connect(g2); g1.connect(levelGain); g2.connect(levelGain)
      fadeIn(2); o1.start(); o2.start()
      oscillators.push(o1, o2); extraNodes.push(g1, g2)
      break
    }
    case 'mist': {
      const src = ctx.createBufferSource()
      src.buffer = makeNoiseBuffer(ctx); src.loop = true
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'; filter.frequency.value = 800; filter.Q.value = 1.5
      const ng = ctx.createGain(); ng.gain.value = 0.12
      src.connect(filter); filter.connect(ng); ng.connect(levelGain)
      fadeIn(2); src.start()
      return {
        setLevel: (v) => levelGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05),
        stop: () => {
          levelGain.gain.setTargetAtTime(0, ctx.currentTime, 0.5)
          setTimeout(() => {
            try { src.stop() } catch { /* already stopped */ }
            try { ng.disconnect(); filter.disconnect(); src.disconnect(); levelGain.disconnect() } catch { /* ignore */ }
          }, 800)
        },
      }
    }
    case 'glass': {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 528
      const og = ctx.createGain(); og.gain.value = 0.09
      o.connect(og); og.connect(levelGain)
      fadeIn(1.5); o.start()
      oscillators.push(o); extraNodes.push(og)
      break
    }
  }

  return {
    setLevel: (v) => levelGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05),
    stop: () => {
      levelGain.gain.setTargetAtTime(0, ctx.currentTime, 0.5)
      setTimeout(() => {
        oscillators.forEach(o => { try { o.stop() } catch { /* ignore */ } })
        extraNodes.forEach(n => { try { n.disconnect() } catch { /* ignore */ } })
        try { levelGain.disconnect() } catch { /* ignore */ }
      }, 800)
    },
  }
}

// ─── Saved atmosphere ─────────────────────────────────────────────────────────

type SavedAtmosphere = {
  name: string
  drops: Array<{ id: string; level: number }>
  masterVolume: number
  wheelIndex: number | null
  savedAt: number
}

const LS_KEY = 'mm_atmospheres_v1'

function loadAtmospheres(): SavedAtmosphere[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as SavedAtmosphere[] }
  catch { return [] }
}

function persistAtmosphere(atm: SavedAtmosphere): void {
  const all = loadAtmospheres().filter(a => {
    if (atm.wheelIndex !== null) return a.wheelIndex !== atm.wheelIndex
    return true
  })
  all.unshift(atm)
  localStorage.setItem(LS_KEY, JSON.stringify(all.slice(0, 20)))
}

// ─── Drag gesture constants ───────────────────────────────────────────────────

// How many pixels of horizontal drag = full range (0→1)
const DRAG_RANGE_PX = 180
// Minimum movement before we treat the gesture as a drag (not a tap)
const DRAG_THRESHOLD_PX = 6

// ─── Component ────────────────────────────────────────────────────────────────

export default function PotionMixer() {
  const [activeDropIds, setActiveDropIds] = useState<string[]>([])
  // Per-drop level: 0–1. Stored separately so we can read it for visuals.
  const [levels, setLevels] = useState<Record<string, number>>({})
  const [masterVolume, setMasterVolume] = useState(0.65)
  const [showSave, setShowSave] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveWheel, setSaveWheel] = useState<number | null>(null)
  const [confirmation, setConfirmation] = useState('')
  // Which drop is being actively dragged right now (for the readout pill)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const handlesRef = useRef<Record<string, DropAudioHandle>>({})

  // Drag gesture state — not in React state so we don't re-render mid-drag
  const dragRef = useRef<{
    id: string
    startX: number
    startLevel: number
    moved: boolean
  } | null>(null)

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      const ctx = new AudioContext()
      const master = ctx.createGain()
      master.gain.value = masterVolume
      master.connect(ctx.destination)
      ctxRef.current = ctx
      masterRef.current = master
    }
    if (ctxRef.current.state === 'suspended') void ctxRef.current.resume()
    return { ctx: ctxRef.current, master: masterRef.current! }
  }, [masterVolume])

  useEffect(() => {
    if (masterRef.current && ctxRef.current) {
      masterRef.current.gain.setTargetAtTime(masterVolume, ctxRef.current.currentTime, 0.1)
    }
  }, [masterVolume])

  useEffect(() => {
    return () => {
      Object.values(handlesRef.current).forEach(h => h.stop())
      void ctxRef.current?.close()
    }
  }, [])

  // ── Activate a drop (tap on inactive) ──────────────────────────────────────
  const activateDrop = useCallback((dropId: string) => {
    const { ctx, master } = ensureCtx()
    const handle = createDropAudio(ctx, master, dropId)
    handlesRef.current[dropId] = handle
    setActiveDropIds(prev => [...prev, dropId])
    setLevels(prev => ({ ...prev, [dropId]: 1.0 }))
  }, [ensureCtx])

  // ── Deactivate a drop (tap on active) ──────────────────────────────────────
  const deactivateDrop = useCallback((dropId: string) => {
    handlesRef.current[dropId]?.stop()
    delete handlesRef.current[dropId]
    setActiveDropIds(prev => prev.filter(id => id !== dropId))
    setLevels(prev => {
      const next = { ...prev }
      delete next[dropId]
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    Object.values(handlesRef.current).forEach(h => h.stop())
    handlesRef.current = {}
    setActiveDropIds([])
    setLevels({})
  }, [])

  // ── Pointer gesture handlers ───────────────────────────────────────────────

  const handlePointerDown = useCallback((e: React.PointerEvent, dropId: string) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const isActive = activeDropIds.includes(dropId)
    if (!isActive) {
      // Inactive: just activate on pointerup (handled there)
      return
    }
    // Active: begin potential drag
    dragRef.current = {
      id: dropId,
      startX: e.clientX,
      startLevel: levels[dropId] ?? 1.0,
      moved: false,
    }
  }, [activeDropIds, levels])

  const handlePointerMove = useCallback((e: React.PointerEvent, dropId: string) => {
    const drag = dragRef.current
    if (!drag || drag.id !== dropId) return

    const delta = e.clientX - drag.startX
    if (Math.abs(delta) > DRAG_THRESHOLD_PX) {
      drag.moved = true
    }
    if (!drag.moved) return

    const newLevel = Math.max(0, Math.min(1, drag.startLevel + delta / DRAG_RANGE_PX))
    handlesRef.current[dropId]?.setLevel(newLevel)
    setLevels(prev => ({ ...prev, [dropId]: newLevel }))
    setDraggingId(dropId)
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent, dropId: string) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    const drag = dragRef.current
    const wasDrag = drag?.moved ?? false
    dragRef.current = null
    setDraggingId(null)

    if (wasDrag) return // level was set during drag — no toggle

    // Tap behaviour
    const isActive = activeDropIds.includes(dropId)
    if (isActive) {
      deactivateDrop(dropId)
    } else {
      activateDrop(dropId)
    }
  }, [activeDropIds, activateDrop, deactivateDrop])

  // ── Derived visuals ────────────────────────────────────────────────────────

  const activeEntries = activeDropIds.map(id => ({
    id,
    color: DROPS.find(d => d.id === id)!.color,
    level: levels[id] ?? 1.0,
  }))

  const potColor = blendWeighted(activeEntries)
  const isEmpty = activeDropIds.length === 0

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!activeDropIds.length) return
    persistAtmosphere({
      name: saveName.trim() || 'Untitled mixture',
      drops: activeDropIds.map(id => ({ id, level: levels[id] ?? 1.0 })),
      masterVolume,
      wheelIndex: saveWheel,
      savedAt: Date.now(),
    })
    const label = saveWheel !== null ? clockTitles[saveWheel] : 'session'
    setConfirmation(`Saved — ${saveName.trim() || 'Untitled mixture'} · ${label}`)
    setShowSave(false)
    setSaveName('')
    setSaveWheel(null)
    setTimeout(() => setConfirmation(''), 4000)
  }

  return (
    <div className="space-y-10">

      {/* ── The pot ── */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative" style={{ width: 200, height: 200 }}>
          <svg viewBox="0 0 200 200" width="200" height="200" className="absolute inset-0 pointer-events-none" aria-hidden>
            <ellipse cx="100" cy="192" rx="60" ry="8" fill="black" opacity="0.12" />
            <path
              d="M 30 75 Q 18 140 40 175 Q 70 198 100 198 Q 130 198 160 175 Q 182 140 170 75 Q 155 55 100 55 Q 45 55 30 75 Z"
              fill={isEmpty ? '#1e1e2e' : potColor}
              style={{ transition: 'fill 1.4s ease' }}
              opacity={isEmpty ? 0.5 : 0.88}
            />
            <ellipse cx="100" cy="75" rx="70" ry="20"
              fill={isEmpty ? '#2a2a3e' : potColor}
              style={{ transition: 'fill 1.4s ease', filter: 'brightness(1.3)' }}
              opacity={0.9}
            />
            <ellipse cx="100" cy="73" rx="68" ry="18"
              fill="none" stroke="white" strokeWidth="1.5" opacity={0.1}
            />
            {!isEmpty && (
              <ellipse cx="90" cy="68" rx="28" ry="8"
                fill="white" opacity={0.07} transform="rotate(-10 90 68)"
              />
            )}
            {activeEntries.map(({ id, color, level }, i) => {
              const cx = 65 + (i % 5) * 18
              const cy = 100 + Math.floor(i / 5) * 20
              return (
                <circle key={id} cx={cx} cy={cy} r={5 + level * 3}
                  fill={color} opacity={0.4 + level * 0.45}
                  style={{
                    animation: `mm-bubble ${2.5 + i * 0.4}s ease-in-out infinite alternate`,
                    transformOrigin: `${cx}px ${cy}px`,
                  }}
                />
              )
            })}
          </svg>
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pt-4">
              <span className="text-[9px] uppercase tracking-[0.3em] text-white/20 select-none">empty</span>
            </div>
          )}
        </div>

        <p className="text-[10px] tracking-wide text-gray-400 dark:text-gray-500 h-4 text-center">
          {!isEmpty && activeDropIds.map(id => DROPS.find(d => d.id === id)!.name).join(' · ')}
        </p>
      </div>

      {/* ── Drop palette ── */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-1">
          Tap to add · tap again to remove
        </p>
        <p className="text-[9px] text-gray-400/60 dark:text-gray-500/60 mb-5">
          Hold and slide left / right to mix the level of any active drop
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          {DROPS.map(drop => {
            const active = activeDropIds.includes(drop.id)
            const level = levels[drop.id] ?? 1.0
            const isDragging = draggingId === drop.id

            return (
              <div key={drop.id} className="flex flex-col items-center gap-2">
                {/* Level readout — visible only while dragging this drop */}
                <div
                  className="text-[10px] font-mono tabular-nums text-gray-500 dark:text-gray-400 h-4 leading-none transition-opacity duration-150"
                  style={{ opacity: isDragging ? 1 : 0 }}
                >
                  {Math.round(level * 100)}
                </div>

                {/* The orb — pointer target */}
                <div
                  role="button"
                  aria-pressed={active}
                  aria-label={`${drop.name} — ${drop.sub}`}
                  className="rounded-full select-none"
                  style={{
                    width: 52,
                    height: 52,
                    backgroundColor: drop.color,
                    cursor: active ? 'ew-resize' : 'pointer',
                    touchAction: 'none', // prevent scroll hijack on touch
                    // Opacity encodes current level for active drops
                    opacity: active ? 0.35 + level * 0.65 : 0.55,
                    // Scale up slightly when active
                    transform: active
                      ? `scale(${1.04 + level * 0.08}) translateY(-2px)`
                      : 'scale(1)',
                    boxShadow: active
                      ? `0 0 0 2px white, 0 0 0 4px ${drop.color}66, 0 4px ${8 + level * 10}px ${drop.color}${Math.round(level * 88).toString(16).padStart(2,'0')}`
                      : `0 2px 8px ${drop.color}44`,
                    transition: isDragging
                      ? 'box-shadow 0.05s, opacity 0.05s'
                      : 'all 0.25s ease',
                  }}
                  onPointerDown={e => handlePointerDown(e, drop.id)}
                  onPointerMove={e => handlePointerMove(e, drop.id)}
                  onPointerUp={e => handlePointerUp(e, drop.id)}
                />

                <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 leading-none">
                  {drop.name}
                </span>
                <span className="text-[9px] text-gray-400 dark:text-gray-500 leading-none text-center">
                  {drop.sub}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Master volume ── */}
      <div className="flex items-center gap-4 max-w-sm">
        <span className="text-[10px] uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500 w-14 shrink-0">
          Master
        </span>
        <Slider
          value={[masterVolume]}
          min={0} max={1} step={0.01}
          onValueChange={([v]) => setMasterVolume(v!)}
          className="flex-1"
        />
        <span className="text-xs tabular-nums text-gray-400 dark:text-gray-500 w-6 text-right">
          {Math.round(masterVolume * 100)}
        </span>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-3 flex-wrap min-h-8">
        {!isEmpty && (
          <Button variant="outline" size="sm" onClick={clearAll} className="text-xs h-8">
            Clear
          </Button>
        )}
        {!isEmpty && !showSave && (
          <Button size="sm" onClick={() => setShowSave(true)} className="text-xs h-8">
            Save mixture
          </Button>
        )}
        {confirmation && (
          <span className="text-[11px] text-green-600 dark:text-green-400 animate-in fade-in">
            {confirmation}
          </span>
        )}
      </div>

      {/* ── Save panel ── */}
      {showSave && (
        <div className="rounded-xl border border-black/8 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Name this mixture</p>
          <input
            type="text"
            autoFocus
            maxLength={48}
            className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
            placeholder="e.g. Morning focus"
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
          />
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500 mb-3">
              Attach to a wheel — or keep for this session
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSaveWheel(null)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-medium border transition-all ${
                  saveWheel === null
                    ? 'border-violet-500 text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/20'
                    : 'border-black/10 dark:border-white/10 text-gray-500 dark:text-gray-400'
                }`}
              >
                Session only
              </button>
              {clockTitles.map((title, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSaveWheel(i)}
                  className="px-3 py-1.5 rounded-full text-[10px] font-medium border transition-all"
                  style={{
                    borderColor: saveWheel === i ? WHEEL_HEX[i] : 'rgba(128,128,128,0.2)',
                    color: saveWheel === i ? WHEEL_HEX[i] : undefined,
                    backgroundColor: saveWheel === i ? `${WHEEL_HEX[i]}18` : undefined,
                  }}
                >
                  {title}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleSave} className="text-xs h-8">Save</Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowSave(false); setSaveName(''); setSaveWheel(null) }} className="text-xs h-8">
              Cancel
            </Button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes mm-bubble {
          0%   { transform: translateY(0)    scale(1);    opacity: 0.6; }
          50%  { transform: translateY(-7px) scale(1.1); opacity: 0.85; }
          100% { transform: translateY(0)    scale(0.95); opacity: 0.45; }
        }
      `}</style>
    </div>
  )
}
