'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'

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

const N = PLANET_DATA.length

/** 0–1 → Hz, warm to airy */
function airToFrequency(t: number): number {
  const a = Math.max(0, Math.min(1, t))
  return 280 * 40 ** a
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

type SynthAudioGraph = {
  ctx: AudioContext
  mix: GainNode
  filter: BiquadFilterNode
  outGain: GainNode
  dryGain: GainNode
  wetGain: GainNode
  delay: DelayNode
  chorusLfo: OscillatorNode
  chorusDepth: GainNode
  pulseLfo: OscillatorNode
  pulseDepth: GainNode
}

function createSynthGraph(ctx: AudioContext): SynthAudioGraph {
  const mix = ctx.createGain()
  mix.gain.value = 1

  const delay = ctx.createDelay(0.12)
  delay.delayTime.value = 0

  const delayBase = ctx.createConstantSource()
  delayBase.offset.value = 0.03
  delayBase.start()

  const chorusLfo = ctx.createOscillator()
  chorusLfo.type = 'sine'
  chorusLfo.frequency.value = 0.18
  const chorusDepth = ctx.createGain()
  chorusDepth.gain.value = 0.012
  chorusLfo.connect(chorusDepth)
  chorusDepth.connect(delay.delayTime)
  delayBase.connect(delay.delayTime)

  chorusLfo.start()

  const dryGain = ctx.createGain()
  const wetGain = ctx.createGain()
  dryGain.gain.value = 1
  wetGain.gain.value = 0

  mix.connect(dryGain)
  mix.connect(delay)
  delay.connect(wetGain)

  const merge = ctx.createGain()
  merge.gain.value = 1
  dryGain.connect(merge)
  wetGain.connect(merge)

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = airToFrequency(0.65)
  filter.Q.value = 0.65
  merge.connect(filter)

  const level = ctx.createGain()
  level.gain.value = 0.78
  filter.connect(level)

  const tremolo = ctx.createGain()
  tremolo.gain.value = 1
  level.connect(tremolo)

  const pulseLfo = ctx.createOscillator()
  pulseLfo.type = 'sine'
  pulseLfo.frequency.value = 0.28
  const pulseDepth = ctx.createGain()
  pulseDepth.gain.value = 0
  pulseLfo.connect(pulseDepth)
  pulseDepth.connect(tremolo.gain)
  pulseLfo.start()

  tremolo.connect(ctx.destination)

  return {
    ctx,
    mix,
    filter,
    outGain: tremolo,
    dryGain,
    wetGain,
    delay,
    chorusLfo,
    chorusDepth,
    pulseLfo,
    pulseDepth,
  }
}

type PlanetPadProps = {
  planet: PlanetTone
  audioCtx: AudioContext | null
  output: GainNode | null
  active: boolean
  onToggle: () => void
  disabled?: boolean
  padPx: number
  modDrift: number
  modFlow: number
}

function PlanetPad({
  planet,
  audioCtx,
  output,
  active,
  onToggle,
  disabled,
  padPx,
  modDrift,
  modFlow,
}: PlanetPadProps) {
  const osc = useRef<OscillatorNode | null>(null)
  const gain = useRef<GainNode | null>(null)
  const lfo = useRef<OscillatorNode | null>(null)
  const lfoGainNode = useRef<GainNode | null>(null)
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flowHz = 0.06 + modFlow * 5.4
  const driftAmt = planet.freq * 0.006 * modDrift

  useEffect(() => {
    if (!audioCtx || !output) return

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

      lfoOsc.frequency.setValueAtTime(flowHz, audioCtx.currentTime)
      lfoGain.gain.setValueAtTime(driftAmt, audioCtx.currentTime)
      lfoOsc.connect(lfoGain)
      lfoGain.connect(o.frequency)

      g.gain.setValueAtTime(0, audioCtx.currentTime)
      g.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 2)

      o.connect(g)
      g.connect(output)

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
  }, [active, audioCtx, output, planet.freq])

  useEffect(() => {
    if (!active || !audioCtx || !lfo.current || !lfoGainNode.current) return
    const t = audioCtx.currentTime
    lfo.current.frequency.setTargetAtTime(flowHz, t, 0.025)
    lfoGainNode.current.gain.setTargetAtTime(driftAmt, t, 0.025)
  }, [active, audioCtx, flowHz, driftAmt])

  const label =
    planet.name.startsWith('Jupiter')
      ? planet.name.replace(/^Jupiter\s*\(/, 'Jup.\n').replace(/\)$/, '')
      : planet.name

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
      className="outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070714] mm-celestial-pad"
      style={{
        width: padPx,
        height: padPx,
        borderRadius: '50%',
        background: active
          ? `radial-gradient(circle at 30% 25%, ${planet.color}ee, ${planet.color}99)`
          : 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
        color: active ? '#0a0a0c' : '#f4f4f8',
        border: active ? `2px solid ${planet.color}` : '1px solid rgba(255,255,255,0.12)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'center',
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.35s, border-color 0.35s, background 0.35s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        position: 'relative',
        overflow: 'visible',
        opacity: disabled ? 0.45 : 1,
        boxShadow: active
          ? `0 0 0 1px ${planet.color}66, 0 0 28px ${planet.color}55, inset 0 1px 0 rgba(255,255,255,0.35)`
          : 'inset 0 1px 0 rgba(255,255,255,0.06)',
        transform: active ? 'scale(1.06)' : 'scale(1)',
        padding: 6,
      }}
    >
      <span
        style={{
          fontSize: Math.max(8, padPx * 0.11),
          opacity: active ? 0.55 : 0.45,
          fontWeight: 700,
          letterSpacing: '0.06em',
          lineHeight: 1,
        }}
      >
        {planet.note}
      </span>
      <span
        style={{
          fontSize: Math.max(9, padPx * 0.13),
          fontWeight: 700,
          lineHeight: 1.15,
          whiteSpace: 'pre-line',
          maxWidth: padPx - 10,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: Math.max(7, padPx * 0.09), opacity: 0.5, lineHeight: 1 }}>{planet.freq} Hz</span>

      {active && (
        <span
          className="mm-celestial-pulse"
          style={{
            position: 'absolute',
            inset: -3,
            borderRadius: '50%',
            border: `2px solid ${planet.color}`,
            opacity: 0.45,
            pointerEvents: 'none',
          }}
          aria-hidden
        />
      )}
    </div>
  )
}

function SynthKnob({
  label,
  value,
  onChange,
  disabled,
  compact,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  disabled?: boolean
  compact: boolean
}) {
  const valRef = useRef(value)
  const draggingRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    valRef.current = value
  }, [value])

  const size = compact ? 36 : 44
  const deg = -138 + value * 276

  const endDrag = (e: React.PointerEvent) => {
    draggingRef.current = false
    setIsDragging(false)
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      /* not captured */
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: compact ? 3 : 4,
        opacity: disabled ? 0.42 : 1,
        minWidth: compact ? 40 : 48,
      }}
    >
      <div
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        aria-label={label}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return
          const step = e.shiftKey ? 0.06 : 0.025
          if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
            onChange(clamp01(value + step))
            e.preventDefault()
          }
          if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
            onChange(clamp01(value - step))
            e.preventDefault()
          }
        }}
        onPointerDown={(e) => {
          if (disabled) return
          e.preventDefault()
          e.currentTarget.setPointerCapture(e.pointerId)
          draggingRef.current = true
          setIsDragging(true)
        }}
        onPointerMove={(e) => {
          if (!draggingRef.current || disabled) return
          const next = clamp01(valRef.current - e.movementY * 0.0055)
          valRef.current = next
          onChange(next)
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          cursor: disabled ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          position: 'relative',
          background:
            'radial-gradient(circle at 32% 28%, rgba(255,245,220,0.14), #35334a 42%, #12111a 72%, #08070c)',
          boxShadow:
            'inset 0 2px 5px rgba(255,255,255,0.11), inset 0 -3px 8px rgba(0,0,0,0.55), 0 5px 14px rgba(0,0,0,0.45)',
          border: '1px solid rgba(197, 171, 110, 0.28)',
          outline: 'none',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 5,
            borderRadius: '50%',
            border: '1px solid rgba(0,0,0,0.35)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 2,
            height: '36%',
            marginLeft: -1,
            marginTop: '-36%',
            background: 'linear-gradient(to bottom, #e8ddb8, #7d6a45)',
            transformOrigin: '50% 100%',
            transform: `rotate(${deg}deg)`,
            borderRadius: 1,
            pointerEvents: 'none',
            boxShadow: '0 0 3px rgba(197, 171, 110, 0.35)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: compact ? 5 : 6,
            height: compact ? 5 : 6,
            marginLeft: compact ? -2.5 : -3,
            marginTop: compact ? -2.5 : -3,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 25%, #4a4758, #1a1824)',
            pointerEvents: 'none',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.12)',
          }}
        />
      </div>
      <span
        style={{
          fontSize: compact ? 6 : 7,
          fontWeight: 700,
          letterSpacing: '0.16em',
          color: 'rgba(212, 196, 168, 0.82)',
          textAlign: 'center',
        }}
      >
        {label}
      </span>
    </div>
  )
}

function SynthLever({
  label,
  value,
  onChange,
  disabled,
  compact,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  disabled?: boolean
  compact: boolean
}) {
  const valRef = useRef(value)
  const dragging = useRef(false)
  const [isDragging, setIsDragging] = useState(false)
  const trackRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    valRef.current = value
  }, [value])

  const trackH = compact ? 56 : 68
  const trackW = compact ? 15 : 17
  const thumbH = compact ? 13 : 15
  const travel = Math.max(0, trackH - thumbH)
  const thumbTop = (1 - value) * travel

  const setFromClientY = useCallback(
    (clientY: number) => {
      const el = trackRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const y = clientY - r.top
      const t = clamp01(1 - y / r.height)
      valRef.current = t
      onChange(t)
    },
    [onChange]
  )

  const endDrag = (e: React.PointerEvent) => {
    dragging.current = false
    setIsDragging(false)
    try {
      trackRef.current?.releasePointerCapture(e.pointerId)
    } catch {
      /* */
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: compact ? 3 : 4,
        opacity: disabled ? 0.42 : 1,
        minWidth: compact ? 32 : 36,
      }}
    >
      <div
        ref={trackRef}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        aria-label={label}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return
          const step = e.shiftKey ? 0.07 : 0.03
          if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
            onChange(clamp01(value + step))
            e.preventDefault()
          }
          if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
            onChange(clamp01(value - step))
            e.preventDefault()
          }
        }}
        onPointerDown={(e) => {
          if (disabled) return
          e.preventDefault()
          trackRef.current?.setPointerCapture(e.pointerId)
          dragging.current = true
          setIsDragging(true)
          setFromClientY(e.clientY)
        }}
        onPointerMove={(e) => {
          if (!dragging.current || disabled) return
          setFromClientY(e.clientY)
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{
          height: trackH,
          width: trackW,
          borderRadius: trackW / 2,
          cursor: disabled ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          position: 'relative',
          background:
            'linear-gradient(to bottom, rgba(5,5,12,0.9) 0%, rgba(32,30,48,0.95) 45%, rgba(12,11,20,0.98) 100%)',
          boxShadow:
            'inset 0 3px 10px rgba(0,0,0,0.65), inset 0 -1px 0 rgba(255,255,255,0.04), 0 2px 8px rgba(0,0,0,0.35)',
          border: '1px solid rgba(197, 171, 110, 0.22)',
          outline: 'none',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 3,
            borderRadius: trackW / 2,
            border: '1px dashed rgba(197, 171, 110, 0.08)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            top: thumbTop,
            width: trackW - 5,
            height: thumbH,
            borderRadius: 5,
            background: 'linear-gradient(to bottom, #efe6d2, #b89d6e 55%, #6e5c3d)',
            pointerEvents: 'none',
            boxShadow:
              '0 3px 6px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 4px rgba(0,0,0,0.25)',
            border: '1px solid rgba(45,40,32,0.5)',
          }}
        />
      </div>
      <span
        style={{
          fontSize: compact ? 6 : 7,
          fontWeight: 700,
          letterSpacing: '0.14em',
          color: 'rgba(212, 196, 168, 0.82)',
          textAlign: 'center',
        }}
      >
        {label}
      </span>
    </div>
  )
}

export type SolarSystemResonanceProps = {
  soundEnabled?: boolean
  compact?: boolean
}

export default function SolarSystemResonance({
  soundEnabled = true,
  compact = false,
}: SolarSystemResonanceProps) {
  const [audio, setAudio] = useState<SynthAudioGraph | null>(null)
  const [activePlanets, setActivePlanets] = useState<Set<string>>(() => new Set())

  const [modDrift, setModDrift] = useState(0.65)
  const [modFlow, setModFlow] = useState(0.35)
  const [modAir, setModAir] = useState(0.62)
  const [modSpace, setModSpace] = useState(0.2)
  const [modPulse, setModPulse] = useState(0.15)

  const orbitRadiusPct = compact ? 38 : 40
  const padPx = compact ? 56 : 72

  const positions = useMemo(() => {
    return PLANET_DATA.map((_, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / N
      const left = 50 + orbitRadiusPct * Math.cos(angle)
      const top = 50 + orbitRadiusPct * Math.sin(angle)
      return { left, top }
    })
  }, [orbitRadiusPct])

  const ensureAudio = useCallback((): SynthAudioGraph => {
    if (audio) {
      void audio.ctx.resume()
      return audio
    }
    const ctx = new AudioContext()
    void ctx.resume()
    const graph = createSynthGraph(ctx)
    setAudio(graph)
    return graph
  }, [audio])

  const togglePlanet = useCallback(
    (name: string) => {
      if (!soundEnabled) return
      const graph = ensureAudio()
      void graph.ctx.resume()

      setActivePlanets((prev) => {
        const next = new Set(prev)
        if (next.has(name)) next.delete(name)
        else next.add(name)
        return next
      })
    },
    [ensureAudio, soundEnabled]
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
    if (!audio) return
    const t = audio.ctx.currentTime
    const fq = airToFrequency(modAir)
    audio.filter.frequency.setTargetAtTime(fq, t, 0.045)

    const s = Math.max(0, Math.min(1, modSpace))
    const dry = Math.cos((s * Math.PI) / 2)
    const wet = Math.sin((s * Math.PI) / 2) * 0.92
    audio.dryGain.gain.setTargetAtTime(dry, t, 0.05)
    audio.wetGain.gain.setTargetAtTime(wet, t, 0.05)

    audio.chorusDepth.gain.setTargetAtTime(0.004 + modSpace * 0.024, t, 0.05)
    audio.chorusLfo.frequency.setTargetAtTime(0.06 + modFlow * 0.95, t, 0.05)

    audio.pulseDepth.gain.setTargetAtTime(modPulse * 0.2, t, 0.05)
    audio.pulseLfo.frequency.setTargetAtTime(0.12 + modFlow * 2.1, t, 0.05)
  }, [audio, modAir, modSpace, modFlow, modPulse])

  useEffect(() => {
    return () => {
      void audio?.ctx.close()
    }
  }, [audio])

  const mixOut = audio?.mix ?? null
  const ctx = audio?.ctx ?? null

  return (
    <div
      style={{
        width: '100%',
        minHeight: compact ? 'auto' : undefined,
        background: 'linear-gradient(165deg, #06060e 0%, #0a0a18 45%, #070714 100%)',
        borderRadius: '16px',
        padding: compact ? '18px 16px 20px' : '28px 20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? 16 : 22,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 80% 55% at 50% 42%, rgba(99, 102, 241, 0.07) 0%, transparent 55%),
            radial-gradient(circle at 50% 50%, rgba(26, 26, 46, 0.5) 0%, transparent 62%)
          `,
          pointerEvents: 'none',
        }}
      />

      <header style={{ textAlign: 'center', zIndex: 1, position: 'relative' }}>
        <h2
          style={{
            margin: '0',
            fontSize: compact ? '16px' : '21px',
            fontWeight: 300,
            letterSpacing: compact ? '0.28em' : '0.38em',
            color: '#d4c4a8',
          }}
        >
          INTERSTELLAR SHIMMER
        </h2>
        <p
          style={{
            margin: '10px 0 0 0',
            fontSize: '10px',
            opacity: 0.42,
            letterSpacing: '0.22em',
            fontWeight: 500,
          }}
        >
          CELESTIAL RESONANCE · KNOBS & LEVERS
        </p>
      </header>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: compact ? 340 : 440,
          margin: '0 auto',
          aspectRatio: '1',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: '6%',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.35)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: '18%',
            borderRadius: '50%',
            border: '1px dashed rgba(197, 171, 110, 0.12)',
          }}
        />

        {/* Centre modulator */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: compact ? '40%' : '44%',
            maxWidth: compact ? 184 : 228,
            aspectRatio: '1',
            maxHeight: compact ? 208 : 228,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 40% 28%, rgba(255,230,200,0.12), rgba(20,18,40,0.85) 70%)',
            border: '1px solid rgba(197, 171, 110, 0.28)',
            boxShadow:
              '0 0 48px rgba(99, 102, 241, 0.12), inset 0 0 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
            zIndex: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: compact ? '10px 6px 8px' : '12px 8px 10px',
            gap: compact ? 6 : 8,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: compact ? 8 : 9,
              fontWeight: 700,
              letterSpacing: '0.28em',
              color: 'rgba(197, 171, 110, 0.85)',
              textAlign: 'center',
            }}
          >
            MOD BUS
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: compact ? 6 : 8,
              width: '100%',
              flex: 1,
              minHeight: 0,
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: compact ? 6 : 10,
                width: '100%',
              }}
            >
              <SynthKnob
                label="DRIFT"
                value={modDrift}
                onChange={setModDrift}
                compact={compact}
                disabled={!soundEnabled}
              />
              <SynthKnob
                label="FLOW"
                value={modFlow}
                onChange={setModFlow}
                compact={compact}
                disabled={!soundEnabled}
              />
              <SynthKnob
                label="AIR"
                value={modAir}
                onChange={setModAir}
                compact={compact}
                disabled={!soundEnabled}
              />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: compact ? 12 : 16,
                width: '100%',
              }}
            >
              <SynthLever
                label="SPACE"
                value={modSpace}
                onChange={setModSpace}
                compact={compact}
                disabled={!soundEnabled}
              />
              <SynthLever
                label="PULSE"
                value={modPulse}
                onChange={setModPulse}
                compact={compact}
                disabled={!soundEnabled}
              />
            </div>
          </div>
        </div>

        {PLANET_DATA.map((planet, i) => (
          <div
            key={planet.name}
            style={{
              position: 'absolute',
              left: `${positions[i].left}%`,
              top: `${positions[i].top}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 2,
            }}
          >
            <PlanetPad
              planet={planet}
              audioCtx={ctx}
              output={mixOut}
              active={soundEnabled && activePlanets.has(planet.name)}
              onToggle={() => togglePlanet(planet.name)}
              disabled={!soundEnabled}
              padPx={padPx}
              modDrift={modDrift}
              modFlow={modFlow}
            />
          </div>
        ))}
      </div>

      <footer
        style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: compact ? 4 : 8,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <button
          type="button"
          onClick={killAll}
          disabled={!soundEnabled}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.14)',
            color: 'rgba(255,255,255,0.72)',
            padding: '10px 28px',
            borderRadius: '999px',
            fontSize: '10px',
            letterSpacing: '0.22em',
            fontWeight: 600,
            cursor: soundEnabled ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s, border-color 0.2s',
            opacity: soundEnabled ? 1 : 0.5,
          }}
        >
          SILENCE ALL
        </button>
      </footer>

      <style>{`
        .mm-celestial-pulse {
          animation: mm-orbit-pulse 2.4s ease-in-out infinite;
        }
        @keyframes mm-orbit-pulse {
          0%, 100% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(1.15); opacity: 0.65; }
        }
      `}</style>
    </div>
  )
}
