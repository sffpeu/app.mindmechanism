'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

export type PlanetTone = {
  name: string
  freq: number
  note: string
  color: string
}

export const PLANET_DATA: readonly PlanetTone[] = [
  { name: 'Mercury', freq: 141.27, note: 'C#3', color: '#888888' },
  { name: 'Venus', freq: 221.23, note: 'A3', color: '#e3bb76' },
  { name: 'Earth', freq: 136.1, note: 'C#3', color: '#2d5a27' },
  { name: 'Mars', freq: 144.72, note: 'D3', color: '#ae4d28' },
  { name: 'Jupiter (M)', freq: 183.53, note: 'F#3', color: '#d39c7e' },
  { name: 'Jupiter (F)', freq: 234.88, note: 'A#3', color: '#c99039' },
  { name: 'Saturn', freq: 147.85, note: 'D3', color: '#c5ab6e' },
  { name: 'Uranus', freq: 207.36, note: 'G#3', color: '#b8e1e2' },
  { name: 'Neptune', freq: 211.44, note: 'G#3', color: '#3f54ba' },
] as const

type PlanetPadProps = {
  planet: PlanetTone
  audioCtx: AudioContext | null
  active: boolean
  onToggle: () => void
  disabled?: boolean
}

function PlanetPad({ planet, audioCtx, active, onToggle, disabled }: PlanetPadProps) {
  const osc = useRef<OscillatorNode | null>(null)
  const gain = useRef<GainNode | null>(null)
  const lfo = useRef<OscillatorNode | null>(null)
  const lfoGainNode = useRef<GainNode | null>(null)
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!audioCtx) return

    if (stopTimer.current) {
      clearTimeout(stopTimer.current)
      stopTimer.current = null
    }

    if (active) {
      const o = audioCtx.createOscillator()
      const g = audioCtx.createGain()
      const lfoOsc = audioCtx.createOscillator()
      const lfoGain = audioCtx.createGain()

      o.type = 'sine'
      o.frequency.setValueAtTime(planet.freq, audioCtx.currentTime)

      lfoOsc.frequency.value = 0.4 + Math.random() * 0.2
      lfoGain.gain.value = planet.freq * 0.005
      lfoOsc.connect(lfoGain)
      lfoGain.connect(o.frequency)

      g.gain.setValueAtTime(0, audioCtx.currentTime)
      g.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 2)

      o.connect(g)
      g.connect(audioCtx.destination)

      osc.current = o
      gain.current = g
      lfo.current = lfoOsc
      lfoGainNode.current = lfoGain

      o.start()
      lfoOsc.start()
    } else {
      const gNode = gain.current
      const oNode = osc.current
      const lNode = lfo.current
      const lGainNode = lfoGainNode.current

      if (gNode && oNode) {
        const now = audioCtx.currentTime
        gNode.gain.cancelScheduledValues(now)
        gNode.gain.setValueAtTime(gNode.gain.value, now)
        gNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.5)
        stopTimer.current = setTimeout(() => {
          try {
            oNode.stop()
          } catch {
            /* already stopped */
          }
          try {
            lNode?.stop()
          } catch {
            /* already stopped */
          }
          oNode.disconnect()
          gNode.disconnect()
          lGainNode?.disconnect()
          lNode?.disconnect()
          osc.current = null
          gain.current = null
          lfo.current = null
          lfoGainNode.current = null
          stopTimer.current = null
        }, 1600)
      }
    }

    return () => {
      if (stopTimer.current) {
        clearTimeout(stopTimer.current)
        stopTimer.current = null
      }
    }
  }, [active, audioCtx, planet.freq])

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onToggle}
      onKeyDown={(e) => {
        if (disabled) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
      aria-pressed={active}
      aria-disabled={disabled}
      className="outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050508]"
      style={{
        background: active ? planet.color : 'rgba(255,255,255,0.05)',
        color: active ? '#000' : '#fff',
        border: `1px solid ${active ? planet.color : 'rgba(255,255,255,0.1)'}`,
        padding: '16px',
        borderRadius: '12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'center',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        position: 'relative',
        overflow: 'hidden',
        opacity: disabled ? 0.45 : 1,
        boxShadow: active ? `0 0 30px ${planet.color}44` : 'none',
      }}
    >
      <span style={{ fontSize: '10px', opacity: 0.6, fontWeight: 'bold', letterSpacing: '1px' }}>
        {planet.note}
      </span>
      <span style={{ fontSize: '14px', fontWeight: '600' }}>{planet.name}</span>
      <span style={{ fontSize: '10px', opacity: 0.5 }}>{planet.freq} Hz</span>

      {active && (
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            height: '2px',
            width: '100%',
            background: 'rgba(0,0,0,0.2)',
            animation: 'mm-celestial-scan 2s infinite linear',
          }}
        />
      )}
    </div>
  )
}

export type SolarSystemResonanceProps = {
  /** When false, pads do not start audio (still visible). */
  soundEnabled?: boolean
  /** Compact layout for embedding inside Settings. */
  compact?: boolean
}

export default function SolarSystemResonance({
  soundEnabled = true,
  compact = false,
}: SolarSystemResonanceProps) {
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null)
  const [activePlanets, setActivePlanets] = useState<Set<string>>(() => new Set())

  const togglePlanet = useCallback(
    (name: string) => {
      if (!soundEnabled) return

      if (!audioCtx) {
        const ctx = new AudioContext()
        void ctx.resume()
        setAudioCtx(ctx)
      } else if (audioCtx.state === 'suspended') {
        void audioCtx.resume()
      }

      setActivePlanets((prev) => {
        const next = new Set(prev)
        if (next.has(name)) next.delete(name)
        else next.add(name)
        return next
      })
    },
    [audioCtx, soundEnabled]
  )

  const killAll = useCallback(() => {
    setActivePlanets(new Set())
  }, [])

  useEffect(() => {
    if (!soundEnabled) {
      killAll()
    }
  }, [soundEnabled, killAll])

  useEffect(() => {
    return () => {
      void audioCtx?.close()
    }
  }, [audioCtx])

  return (
    <div
      style={{
        width: '100%',
        minHeight: compact ? 'auto' : '600px',
        background: '#050508',
        borderRadius: '16px',
        padding: compact ? '20px' : '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? '20px' : '32px',
        fontFamily: 'system-ui, sans-serif',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          background: 'radial-gradient(circle at center, #1a1a2e 0%, transparent 70%)',
          opacity: 0.3,
          pointerEvents: 'none',
        }}
      />

      <header style={{ textAlign: 'center', zIndex: 1 }}>
        <h2
          style={{
            margin: '0',
            fontSize: compact ? '18px' : '24px',
            fontWeight: '200',
            letterSpacing: compact ? '4px' : '8px',
            color: '#c5ab6e',
          }}
        >
          INTERSTELLAR SHIMMER
        </h2>
        <p style={{ margin: '8px 0 0 0', fontSize: '11px', opacity: 0.4, letterSpacing: '2px' }}>
          CELESTIAL RESONANCE · LIVE MULTI-OSC MIXER
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '16px',
          zIndex: 1,
        }}
      >
        {PLANET_DATA.map((planet) => (
          <PlanetPad
            key={planet.name}
            planet={planet}
            audioCtx={audioCtx}
            active={soundEnabled && activePlanets.has(planet.name)}
            onToggle={() => togglePlanet(planet.name)}
            disabled={!soundEnabled}
          />
        ))}
      </div>

      <footer
        style={{
          marginTop: 'auto',
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          zIndex: 1,
          paddingTop: '20px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <button
          type="button"
          onClick={killAll}
          disabled={!soundEnabled}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.6)',
            padding: '8px 24px',
            borderRadius: '20px',
            fontSize: '10px',
            letterSpacing: '2px',
            cursor: soundEnabled ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            opacity: soundEnabled ? 1 : 0.5,
          }}
        >
          SILENCE ALL
        </button>
      </footer>

      <style>{`
        @keyframes mm-celestial-scan {
          0% { transform: scaleX(0); opacity: 0; }
          50% { transform: scaleX(1); opacity: 1; }
          100% { transform: scaleX(0); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
