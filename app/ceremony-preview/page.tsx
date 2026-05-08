'use client'

/**
 * /ceremony-preview
 *
 * Development preview for the Completion Ceremony animation.
 * Shows all nine Wheel ceremonies simultaneously so you can
 * review and adjust colours, timing, and intensity without
 * running a full session.
 *
 * Remove or gate behind an env check before production.
 */

import { useState } from 'react'
import { MandalaCeremony } from '@/components/MandalaCeremony'
import Image from 'next/image'

const WHEELS = [
  { id: 0, name: 'Root',        hex: '#fd290a' },
  { id: 1, name: 'Sacral',      hex: '#fba63b' },
  { id: 2, name: 'Solar',       hex: '#f7da5f' },
  { id: 3, name: 'Heart',       hex: '#6dc037' },
  { id: 4, name: 'Throat',      hex: '#156fde' },
  { id: 5, name: 'Third Eye',   hex: '#941952' },
  { id: 6, name: 'Crown',       hex: '#541b96' },
  { id: 7, name: 'Wheel 8',     hex: '#ee5fa7' },
  { id: 8, name: 'Wheel 9',     hex: '#56c1ff' },
]

function getImagePath(id: number) {
  return `/small/${id + 1}_small.svg`
}

function WheelPreview({ wheel, duration }: { wheel: typeof WHEELS[0]; duration: number }) {
  const [active, setActive] = useState(false)
  const [key, setKey] = useState(0)

  const fire = () => {
    setActive(false)
    setTimeout(() => {
      setKey(k => k + 1)
      setActive(true)
    }, 50)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Clock face preview */}
      <div
        className="relative rounded-full overflow-hidden"
        style={{
          width: 160,
          height: 160,
          border: `1.5px solid ${wheel.hex}33`,
          boxShadow: `0 0 20px ${wheel.hex}15`,
        }}
      >
        {/* Mandala image */}
        <Image
          src={getImagePath(wheel.id)}
          alt={wheel.name}
          fill
          className="object-cover rounded-full dark:invert"
        />

        {/* Ceremony overlay */}
        {active && (
          <MandalaCeremony
            key={key}
            clockHex={wheel.hex}
            onComplete={() => setActive(false)}
            duration={duration}
          />
        )}

        {/* Idle state label */}
        {!active && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(0,0,0,0.18)' }}
          >
            <span className="text-xs text-white/60 font-medium tracking-wide">idle</span>
          </div>
        )}

        {/* Active indicator */}
        {active && (
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
            style={{ background: wheel.hex }} />
        )}
      </div>

      {/* Label */}
      <div className="text-center">
        <p className="text-xs font-semibold" style={{ color: wheel.hex }}>{wheel.name}</p>
        <p className="text-[10px] text-white/30 mt-0.5">Wheel {wheel.id + 1}</p>
      </div>

      {/* Fire button */}
      <button
        onClick={fire}
        className="text-[10px] px-3 py-1.5 rounded-full border transition-all"
        style={{
          borderColor: `${wheel.hex}55`,
          color: active ? wheel.hex : 'rgba(255,255,255,0.4)',
          background: active ? `${wheel.hex}15` : 'transparent',
        }}
      >
        {active ? 'playing…' : 'fire ceremony'}
      </button>
    </div>
  )
}

export default function CeremonyPreview() {
  const [duration, setDuration] = useState(30_000)
  const [allActive, setAllActive] = useState(false)
  const [allKey, setAllKey] = useState(0)

  const fireAll = () => {
    setAllActive(false)
    setTimeout(() => {
      setAllKey(k => k + 1)
      setAllActive(true)
    }, 50)
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: '#09090b', color: '#e4e4e7', fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Header */}
      <div className="border-b border-white/5 px-8 py-6">
        <p className="text-[10px] tracking-widest uppercase text-white/30 mb-1">Development Preview</p>
        <h1 className="text-xl font-bold tracking-tight">The Completion Ceremony</h1>
        <p className="text-sm text-white/40 mt-1">
          Visual ceremony that fires when a session timer reaches zero.
          Preview each Wheel's ceremony here before testing in a live session.
        </p>
      </div>

      {/* Controls */}
      <div className="px-8 py-5 border-b border-white/5 flex items-center gap-8 flex-wrap">
        <div className="flex items-center gap-3">
          <label className="text-xs text-white/40 uppercase tracking-wider">Duration</label>
          <select
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white"
          >
            <option value={5_000}>5 seconds (quick test)</option>
            <option value={10_000}>10 seconds</option>
            <option value={20_000}>20 seconds</option>
            <option value={30_000}>30 seconds (full)</option>
          </select>
        </div>
        <button
          onClick={fireAll}
          className="text-xs px-4 py-2 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/30 transition-all"
        >
          Fire all simultaneously
        </button>
      </div>

      {/* Grid */}
      <div className="px-8 py-10">
        <div className="grid grid-cols-3 gap-10 max-w-2xl mx-auto">
          {WHEELS.map(wheel => (
            <WheelPreview
              key={`${wheel.id}-${allKey}`}
              wheel={wheel}
              duration={duration}
            />
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="px-8 py-6 border-t border-white/5">
        <p className="text-[10px] text-white/20 leading-relaxed">
          This page is for development review only. Remove or gate behind
          <code className="mx-1 text-white/30">NODE_ENV !== 'production'</code>
          before launch. The ceremony fires automatically in the live app when
          a timed session reaches zero — no manual trigger needed.
        </p>
      </div>
    </div>
  )
}
