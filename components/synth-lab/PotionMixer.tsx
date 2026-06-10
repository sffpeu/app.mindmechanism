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

// ─── Colour blending ─────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

function blendColors(colors: string[]): string {
  if (!colors.length) return 'transparent'
  const rgbs = colors.map(hexToRgb)
  const r = Math.round(rgbs.reduce((s, c) => s + c[0], 0) / rgbs.length)
  const g = Math.round(rgbs.reduce((s, c) => s + c[1], 0) / rgbs.length)
  const b = Math.round(rgbs.reduce((s, c) => s + c[2], 0) / rgbs.length)
  return `rgb(${r},${g},${b})`
}

// ─── Audio engine ─────────────────────────────────────────────────────────────

type StopFn = () => void

function makeNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate
  const buf = ctx.createBuffer(1, sr * 2, sr)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buf
}

function createDropAudio(ctx: AudioContext, master: GainNode, id: string): StopFn {
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, ctx.currentTime)
  g.connect(master)

  const oscillators: OscillatorNode[] = []
  const nodes: AudioNode[] = []

  const fadeIn = (duration = 2) => g.gain.linearRampToValueAtTime(1, ctx.currentTime + duration)

  switch (id) {
    case 'warmth': {
      // 80 + 160 Hz — felt more than heard, earthy
      const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 80
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 160
      const g1 = ctx.createGain(); g1.gain.value = 0.18
      const g2 = ctx.createGain(); g2.gain.value = 0.09
      o1.connect(g1); o2.connect(g2); g1.connect(g); g2.connect(g)
      fadeIn(3); o1.start(); o2.start()
      oscillators.push(o1, o2); nodes.push(g1, g2)
      break
    }

    case 'glow': {
      // 432 + 864 Hz — warm sustained presence
      const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 432
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 864
      const g1 = ctx.createGain(); g1.gain.value = 0.12
      const g2 = ctx.createGain(); g2.gain.value = 0.06
      o1.connect(g1); o2.connect(g2); g1.connect(g); g2.connect(g)
      fadeIn(1.5); o1.start(); o2.start()
      oscillators.push(o1, o2); nodes.push(g1, g2)
      break
    }

    case 'shimmer': {
      // 880 + 1320 + 2200 Hz — high harmonic gloss
      for (const f of [880, 1320, 2200]) {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f
        const og = ctx.createGain(); og.gain.value = 0.04
        o.connect(og); og.connect(g)
        o.start()
        oscillators.push(o); nodes.push(og)
      }
      fadeIn(2)
      break
    }

    case 'breath': {
      // 180 Hz with slow tremolo — the sound of something alive
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 180
      const amp = ctx.createGain(); amp.gain.value = 0.12
      const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.25
      const lfoG = ctx.createGain(); lfoG.gain.value = 0.06
      lfo.connect(lfoG); lfoG.connect(amp.gain)
      o.connect(amp); amp.connect(g)
      fadeIn(2); o.start(); lfo.start()
      oscillators.push(o, lfo); nodes.push(amp, lfoG)
      break
    }

    case 'space': {
      // 528 Hz with delay feedback — the sensation of a large room
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 528
      const og = ctx.createGain(); og.gain.value = 0.08
      const delay = ctx.createDelay(1.0); delay.delayTime.value = 0.45
      const fbG = ctx.createGain(); fbG.gain.value = 0.5
      o.connect(og); og.connect(g); og.connect(delay); delay.connect(fbG); fbG.connect(delay); delay.connect(g)
      fadeIn(2); o.start()
      oscillators.push(o); nodes.push(og, delay, fbG)
      break
    }

    case 'weight': {
      // 55 + 110 Hz — sub presence, the heaviness beneath
      const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 55
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 110
      const g1 = ctx.createGain(); g1.gain.value = 0.22
      const g2 = ctx.createGain(); g2.gain.value = 0.1
      o1.connect(g1); o2.connect(g2); g1.connect(g); g2.connect(g)
      fadeIn(4); o1.start(); o2.start()
      oscillators.push(o1, o2); nodes.push(g1, g2)
      break
    }

    case 'hum': {
      // 220 + 221.5 Hz — detuned pair, the sound of something running quietly
      const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 220
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 221.5
      const g1 = ctx.createGain(); g1.gain.value = 0.1
      const g2 = ctx.createGain(); g2.gain.value = 0.1
      o1.connect(g1); o2.connect(g2); g1.connect(g); g2.connect(g)
      fadeIn(2); o1.start(); o2.start()
      oscillators.push(o1, o2); nodes.push(g1, g2)
      break
    }

    case 'mist': {
      // Bandpass noise at 800 Hz — dispersed, neither here nor there
      const src = ctx.createBufferSource()
      src.buffer = makeNoiseBuffer(ctx)
      src.loop = true
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'; filter.frequency.value = 800; filter.Q.value = 1.5
      const ng = ctx.createGain(); ng.gain.value = 0.12
      src.connect(filter); filter.connect(ng); ng.connect(g)
      fadeIn(2); src.start()
      return () => {
        g.gain.setTargetAtTime(0, ctx.currentTime, 0.5)
        setTimeout(() => {
          try { src.stop() } catch { /* already stopped */ }
          try { ng.disconnect(); filter.disconnect(); src.disconnect(); g.disconnect() } catch { /* ignore */ }
        }, 800)
      }
    }

    case 'glass': {
      // Pure 528 Hz — clear, no modulation, no decay
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 528
      const og = ctx.createGain(); og.gain.value = 0.09
      o.connect(og); og.connect(g)
      fadeIn(1.5); o.start()
      oscillators.push(o); nodes.push(og)
      break
    }
  }

  return () => {
    g.gain.setTargetAtTime(0, ctx.currentTime, 0.5)
    setTimeout(() => {
      oscillators.forEach(o => { try { o.stop() } catch { /* ignore */ } })
      nodes.forEach(n => { try { n.disconnect() } catch { /* ignore */ } })
      try { g.disconnect() } catch { /* ignore */ }
    }, 800)
  }
}

// ─── Saved atmosphere ─────────────────────────────────────────────────────────

type SavedAtmosphere = {
  name: string
  dropIds: string[]
  volume: number
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
    return true // session saves accumulate
  })
  all.unshift(atm)
  localStorage.setItem(LS_KEY, JSON.stringify(all.slice(0, 20)))
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PotionMixer() {
  const [activeDropIds, setActiveDropIds] = useState<string[]>([])
  const [volume, setVolume] = useState(0.65)
  const [showSave, setShowSave] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveWheel, setSaveWheel] = useState<number | null>(null)
  const [confirmation, setConfirmation] = useState('')

  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const stopFnsRef = useRef<Record<string, StopFn>>({})

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      const ctx = new AudioContext()
      const master = ctx.createGain()
      master.gain.value = volume
      master.connect(ctx.destination)
      ctxRef.current = ctx
      masterRef.current = master
    }
    if (ctxRef.current.state === 'suspended') void ctxRef.current.resume()
    return { ctx: ctxRef.current, master: masterRef.current! }
  }, [volume])

  useEffect(() => {
    if (masterRef.current && ctxRef.current) {
      masterRef.current.gain.setTargetAtTime(volume, ctxRef.current.currentTime, 0.1)
    }
  }, [volume])

  useEffect(() => {
    return () => {
      Object.values(stopFnsRef.current).forEach(fn => fn())
      void ctxRef.current?.close()
    }
  }, [])

  const toggleDrop = useCallback((dropId: string) => {
    setActiveDropIds(prev => {
      if (prev.includes(dropId)) {
        stopFnsRef.current[dropId]?.()
        delete stopFnsRef.current[dropId]
        return prev.filter(id => id !== dropId)
      }
      const { ctx, master } = ensureCtx()
      stopFnsRef.current[dropId] = createDropAudio(ctx, master, dropId)
      return [...prev, dropId]
    })
  }, [ensureCtx])

  const clearAll = useCallback(() => {
    Object.values(stopFnsRef.current).forEach(fn => fn())
    stopFnsRef.current = {}
    setActiveDropIds([])
  }, [])

  const potColor = blendColors(activeDropIds.map(id => DROPS.find(d => d.id === id)!.color))
  const isEmpty = activeDropIds.length === 0

  const handleSave = () => {
    if (!activeDropIds.length) return
    persistAtmosphere({
      name: saveName.trim() || 'Untitled mixture',
      dropIds: [...activeDropIds],
      volume,
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

          {/* Vessel SVG */}
          <svg viewBox="0 0 200 200" width="200" height="200" className="absolute inset-0 pointer-events-none" aria-hidden>
            {/* Shadow under the pot */}
            <ellipse cx="100" cy="192" rx="60" ry="8" fill="black" opacity="0.12" />
            {/* Pot body — cauldron shape */}
            <path
              d="M 30 75 Q 18 140 40 175 Q 70 198 100 198 Q 130 198 160 175 Q 182 140 170 75 Q 155 55 100 55 Q 45 55 30 75 Z"
              fill={isEmpty ? '#1e1e2e' : potColor}
              style={{ transition: 'fill 1.4s ease' }}
              opacity={isEmpty ? 0.5 : 0.88}
            />
            {/* Rim / opening ellipse */}
            <ellipse cx="100" cy="75" rx="70" ry="20"
              fill={isEmpty ? '#2a2a3e' : potColor}
              style={{ transition: 'fill 1.4s ease', filter: 'brightness(1.3)' }}
              opacity={0.9}
            />
            {/* Rim highlight */}
            <ellipse cx="100" cy="73" rx="68" ry="18"
              fill="none" stroke="white" strokeWidth="1.5" opacity={0.1}
            />
            {/* Surface gloss when filled */}
            {!isEmpty && (
              <ellipse cx="90" cy="68" rx="28" ry="8"
                fill="white" opacity={0.07} transform="rotate(-10 90 68)"
              />
            )}
            {/* Bubble animations when active */}
            {!isEmpty && activeDropIds.map((id, i) => {
              const drop = DROPS.find(d => d.id === id)!
              const cx = 65 + (i % 5) * 18
              const cy = 100 + Math.floor(i / 5) * 20
              return (
                <circle
                  key={id} cx={cx} cy={cy} r={6}
                  fill={drop.color} opacity={0.7}
                  style={{
                    animation: `mm-bubble ${2.5 + i * 0.4}s ease-in-out infinite alternate`,
                    transformOrigin: `${cx}px ${cy}px`,
                  }}
                />
              )
            })}
          </svg>

          {/* Empty label */}
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pt-4">
              <span className="text-[9px] uppercase tracking-[0.3em] text-white/20 select-none">
                empty
              </span>
            </div>
          )}
        </div>

        {/* Mixture count */}
        <p className="text-[10px] tracking-wide text-gray-400 dark:text-gray-500 h-4">
          {!isEmpty && `${activeDropIds.length} ${activeDropIds.length === 1 ? 'element' : 'elements'} · ${activeDropIds.map(id => DROPS.find(d => d.id === id)!.name).join(', ')}`}
        </p>
      </div>

      {/* ── Drop palette ── */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-5">
          Tap to add · tap again to remove
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          {DROPS.map(drop => {
            const active = activeDropIds.includes(drop.id)
            return (
              <button
                key={drop.id}
                onClick={() => toggleDrop(drop.id)}
                type="button"
                className="flex flex-col items-center gap-2 group focus-visible:outline-none"
                aria-pressed={active}
                aria-label={`${drop.name} — ${drop.sub}`}
              >
                {/* The drop orb */}
                <div
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: 52, height: 52,
                    backgroundColor: drop.color,
                    boxShadow: active
                      ? `0 0 0 2.5px white, 0 0 0 5px ${drop.color}55, 0 4px 14px ${drop.color}66`
                      : `0 2px 8px ${drop.color}44`,
                    opacity: active ? 1 : 0.6,
                    transform: active ? 'scale(1.08) translateY(-3px)' : 'scale(1)',
                  }}
                />
                <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 leading-none">
                  {drop.name}
                </span>
                <span className="text-[9px] text-gray-400 dark:text-gray-500 leading-none text-center">
                  {drop.sub}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Volume ── */}
      <div className="flex items-center gap-4 max-w-sm">
        <span className="text-[10px] uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500 w-14 shrink-0">
          Volume
        </span>
        <Slider
          value={[volume]}
          min={0} max={1} step={0.01}
          onValueChange={([v]) => setVolume(v!)}
          className="flex-1"
        />
        <span className="text-xs tabular-nums text-gray-400 dark:text-gray-500 w-6 text-right">
          {Math.round(volume * 100)}
        </span>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-3 flex-wrap min-h-8">
        {!isEmpty && (
          <Button variant="outline" size="sm" onClick={clearAll} className="text-xs h-8">
            Clear mixture
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
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
            Name this mixture
          </p>

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
                    : 'border-black/10 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-black/20 dark:hover:border-white/20'
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
            <Button size="sm" onClick={handleSave} className="text-xs h-8">
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowSave(false); setSaveName(''); setSaveWheel(null) }} className="text-xs h-8">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Bubble keyframe */}
      <style>{`
        @keyframes mm-bubble {
          0%   { transform: translateY(0)   scale(1);    opacity: 0.65; }
          50%  { transform: translateY(-8px) scale(1.1); opacity: 0.85; }
          100% { transform: translateY(0)   scale(0.95); opacity: 0.5;  }
        }
      `}</style>
    </div>
  )
}
