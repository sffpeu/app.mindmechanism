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

// ─── Room definitions ─────────────────────────────────────────────────────────
// Each room has two layers:
//   1. Ambient background sound (environmental — volume controlled by slide gesture)
//   2. Spatial/tonal treatment applied to the mix (fixed wet level)

type Room = {
  id: string
  ambientName: string   // the background sound character
  treatmentName: string // the spatial treatment
  color: string
  wheelName: string
}

const ROOMS: Room[] = clockTitles.map((title, i) => ({
  id: String(i),
  wheelName: title,
  color: WHEEL_HEX[i]!,
  ...[
    { ambientName: 'Deep Earth',      treatmentName: 'Cave reverb'      }, // ROOT
    { ambientName: 'Running Water',   treatmentName: 'Chorus spread'    }, // SACRAL
    { ambientName: 'Open Fire',       treatmentName: 'Warm room'        }, // SOLAR PLEXUS
    { ambientName: 'Forest Floor',    treatmentName: 'Hall reverb'      }, // HEART
    { ambientName: 'Open Ocean',      treatmentName: 'Tremolo pulse'    }, // THROAT
    { ambientName: 'Deep Space',      treatmentName: 'Phaser sweep'     }, // THIRD EYE
    { ambientName: 'Mountain Wind',   treatmentName: 'Stereo wide'      }, // MALE CROWN
    { ambientName: 'Soft Rain',       treatmentName: 'Shimmer reverb'   }, // FEMALE CROWN
    { ambientName: 'Crystal Chamber', treatmentName: 'Cathedral'        }, // ETHERIC HEART
  ][i]!,
}))

// ─── Colour blending ──────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]
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

// ─── Audio utilities ──────────────────────────────────────────────────────────

function makeNoiseBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
  const sr = ctx.sampleRate
  const buf = ctx.createBuffer(1, sr * seconds, sr)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buf
}

function noiseSource(ctx: AudioContext): AudioBufferSourceNode {
  const src = ctx.createBufferSource()
  src.buffer = makeNoiseBuffer(ctx, 4)
  src.loop = true
  return src
}

// ─── Room: ambient background generator ──────────────────────────────────────
// Environmental sound that runs behind the mix. Volume controlled externally.

type AmbientHandle = {
  node: GainNode          // connect this to destination; set gain to control level
  dispose: () => void
}

function createAmbient(ctx: AudioContext, roomId: string): AmbientHandle {
  const out = ctx.createGain()
  out.gain.value = 0   // caller fades in

  const sources: AudioBufferSourceNode[] = []
  const oscillators: OscillatorNode[] = []
  const nodes: AudioNode[] = [out]

  switch (roomId) {
    case '0': { // ROOT — Deep Earth
      const src = noiseSource(ctx)
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 90
      const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.08
      const lfoG = ctx.createGain(); lfoG.gain.value = 0.025
      lfo.connect(lfoG); lfoG.connect(out.gain)
      src.connect(lp); lp.connect(out)
      src.start(); lfo.start()
      sources.push(src); oscillators.push(lfo); nodes.push(lp, lfoG)
      break
    }
    case '1': { // SACRAL — Running Water
      for (const f of [320, 680, 1100, 2200]) {
        const src = noiseSource(ctx)
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'
        bp.frequency.value = f; bp.Q.value = 0.7
        const g = ctx.createGain(); g.gain.value = 0.25
        src.connect(bp); bp.connect(g); g.connect(out)
        src.start(); sources.push(src); nodes.push(bp, g)
      }
      break
    }
    case '2': { // SOLAR PLEXUS — Open Fire
      const src = noiseSource(ctx)
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 80
      const swell = ctx.createOscillator(); swell.type = 'sine'; swell.frequency.value = 0.15
      const swellG = ctx.createGain(); swellG.gain.value = 0.04
      const crackle = ctx.createOscillator(); crackle.type = 'sine'; crackle.frequency.value = 9
      const crackleG = ctx.createGain(); crackleG.gain.value = 0.02
      swell.connect(swellG); swellG.connect(out.gain)
      crackle.connect(crackleG); crackleG.connect(out.gain)
      src.connect(hp); hp.connect(lp); lp.connect(out)
      src.start(); swell.start(); crackle.start()
      sources.push(src); oscillators.push(swell, crackle); nodes.push(lp, hp, swellG, crackleG)
      break
    }
    case '3': { // HEART — Forest Floor
      const src = noiseSource(ctx)
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'
      bp.frequency.value = 500; bp.Q.value = 0.4
      const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.12
      const lfoG = ctx.createGain(); lfoG.gain.value = 0.04
      lfo.connect(lfoG); lfoG.connect(out.gain)
      src.connect(bp); bp.connect(out)
      src.start(); lfo.start()
      sources.push(src); oscillators.push(lfo); nodes.push(bp, lfoG)
      break
    }
    case '4': { // THROAT — Open Ocean
      const src = noiseSource(ctx)
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 800
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 60
      const wave = ctx.createOscillator(); wave.type = 'sine'; wave.frequency.value = 0.07
      const waveG = ctx.createGain(); waveG.gain.value = 0.08
      wave.connect(waveG); waveG.connect(out.gain)
      src.connect(hp); hp.connect(lp); lp.connect(out)
      src.start(); wave.start()
      sources.push(src); oscillators.push(wave); nodes.push(lp, hp, waveG)
      break
    }
    case '5': { // THIRD EYE — Deep Space
      const src = noiseSource(ctx)
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 4000
      const shG = ctx.createGain(); shG.gain.value = 0.15
      src.connect(hp); hp.connect(shG); shG.connect(out)
      const sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.value = 32
      const subG = ctx.createGain(); subG.gain.value = 0.06
      sub.connect(subG); subG.connect(out)
      src.start(); sub.start()
      sources.push(src); oscillators.push(sub); nodes.push(hp, shG, subG)
      break
    }
    case '6': { // MALE CROWN — Mountain Wind
      const src = noiseSource(ctx)
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1200
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5000
      const g1 = ctx.createOscillator(); g1.type = 'sine'; g1.frequency.value = 0.22
      const g2 = ctx.createOscillator(); g2.type = 'sine'; g2.frequency.value = 0.31
      const gG1 = ctx.createGain(); gG1.gain.value = 0.04
      const gG2 = ctx.createGain(); gG2.gain.value = 0.03
      g1.connect(gG1); g2.connect(gG2); gG1.connect(out.gain); gG2.connect(out.gain)
      src.connect(hp); hp.connect(lp); lp.connect(out)
      src.start(); g1.start(); g2.start()
      sources.push(src); oscillators.push(g1, g2); nodes.push(hp, lp, gG1, gG2)
      break
    }
    case '7': { // FEMALE CROWN — Soft Rain
      const s1 = noiseSource(ctx); const s2 = noiseSource(ctx)
      const bp1 = ctx.createBiquadFilter(); bp1.type = 'bandpass'; bp1.frequency.value = 2400; bp1.Q.value = 0.6
      const bp2 = ctx.createBiquadFilter(); bp2.type = 'bandpass'; bp2.frequency.value = 4800; bp2.Q.value = 0.5
      const g1 = ctx.createGain(); g1.gain.value = 0.5
      const g2 = ctx.createGain(); g2.gain.value = 0.3
      s1.connect(bp1); bp1.connect(g1); g1.connect(out)
      s2.connect(bp2); bp2.connect(g2); g2.connect(out)
      s1.start(); s2.start()
      sources.push(s1, s2); nodes.push(bp1, bp2, g1, g2)
      break
    }
    case '8': { // ETHERIC HEART — Crystal Chamber
      const src = noiseSource(ctx)
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000
      const srcG = ctx.createGain(); srcG.gain.value = 0.2
      src.connect(hp); hp.connect(srcG); srcG.connect(out)
      const delay = ctx.createDelay(2.0); delay.delayTime.value = 0.8
      const fb = ctx.createGain(); fb.gain.value = 0.58
      const dlp = ctx.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 6000
      srcG.connect(delay); delay.connect(dlp); dlp.connect(fb); fb.connect(delay); delay.connect(out)
      src.start()
      sources.push(src); nodes.push(hp, srcG, delay, fb, dlp)
      break
    }
  }

  return {
    node: out,
    dispose: () => {
      sources.forEach(s => { try { s.stop() } catch { /* ignore */ } })
      oscillators.forEach(o => { try { o.stop() } catch { /* ignore */ } })
      nodes.forEach(n => { try { n.disconnect() } catch { /* ignore */ } })
    },
  }
}

// ─── Room: spatial/tonal treatment on the mix ────────────────────────────────
// The mix bus passes through this. Fixed wet level — not user-controlled.

type EffectChain = {
  input: AudioNode
  output: AudioNode
  dispose: () => void
}

function makeReverb(
  ctx: AudioContext,
  roomScale: number,
  feedbackGain: number,
  dampHz: number,
  dryLevel: number,
  wetLevel: number,
): { input: GainNode; output: GainNode; nodes: AudioNode[] } {
  const input  = ctx.createGain()
  const output = ctx.createGain()
  const nodes: AudioNode[] = [input, output]

  const dry = ctx.createGain(); dry.gain.value = dryLevel
  input.connect(dry); dry.connect(output); nodes.push(dry)

  const combDelaysBase = [0.0297, 0.0371, 0.0411, 0.0437, 0.0307, 0.0359]
  const combSum = ctx.createGain(); combSum.gain.value = wetLevel / combDelaysBase.length
  nodes.push(combSum)

  for (const d of combDelaysBase) {
    const delay = ctx.createDelay(2); delay.delayTime.value = d * roomScale
    const fb    = ctx.createGain(); fb.gain.value = feedbackGain
    const damp  = ctx.createBiquadFilter(); damp.type = 'lowpass'; damp.frequency.value = dampHz
    input.connect(delay); delay.connect(damp); damp.connect(fb); fb.connect(delay); delay.connect(combSum)
    nodes.push(delay, fb, damp)
  }

  let chain: AudioNode = combSum
  for (const d of [0.005, 0.0017]) {
    const ap = ctx.createBiquadFilter(); ap.type = 'allpass'
    ap.frequency.value = 1 / (2 * Math.PI * d)
    chain.connect(ap); chain = ap; nodes.push(ap)
  }
  chain.connect(output)

  return { input, output, nodes }
}

function createTreatment(ctx: AudioContext, roomId: string): EffectChain {
  const allNodes: AudioNode[] = []
  const allOscillators: OscillatorNode[] = []
  const input  = ctx.createGain()
  const output = ctx.createGain()
  allNodes.push(input, output)

  switch (roomId) {
    case '0': { // Cave — tight reverb
      const { input: rvI, output: rvO, nodes } = makeReverb(ctx, 0.55, 0.48, 5500, 0.4, 1.6)
      input.connect(rvI); rvO.connect(output); allNodes.push(...nodes); break
    }
    case '1': { // Chorus — three detuned delay lines
      const dry = ctx.createGain(); dry.gain.value = 0.5
      input.connect(dry); dry.connect(output); allNodes.push(dry)
      for (let i = 0; i < 3; i++) {
        const delay = ctx.createDelay(0.05); delay.delayTime.value = 0.01 + i * 0.003
        const lfo   = ctx.createOscillator(); lfo.type = 'sine'
        lfo.frequency.value = 0.28 + i * 0.13
        const lfoG  = ctx.createGain(); lfoG.gain.value = 0.004 + i * 0.001
        const tapG  = ctx.createGain(); tapG.gain.value = 0.3
        lfo.connect(lfoG); lfoG.connect(delay.delayTime)
        input.connect(delay); delay.connect(tapG); tapG.connect(output)
        lfo.start(); allOscillators.push(lfo); allNodes.push(delay, lfoG, tapG)
      }
      break
    }
    case '2': { // Warm Room
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200
      input.connect(lp)
      const { input: rvI, output: rvO, nodes } = makeReverb(ctx, 0.85, 0.58, 3200, 0.5, 1.3)
      lp.connect(rvI); rvO.connect(output); allNodes.push(lp, ...nodes); break
    }
    case '3': { // Hall
      const { input: rvI, output: rvO, nodes } = makeReverb(ctx, 1.5, 0.74, 4000, 0.3, 1.8)
      input.connect(rvI); rvO.connect(output); allNodes.push(...nodes); break
    }
    case '4': { // Tremolo
      const trem = ctx.createGain(); trem.gain.value = 0
      const base = ctx.createGain(); base.gain.value = 0.65
      const lfo  = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.45
      const lfoG = ctx.createGain(); lfoG.gain.value = 0.35
      lfo.connect(lfoG); lfoG.connect(trem.gain)
      input.connect(base); base.connect(output)
      input.connect(trem); trem.connect(output)
      lfo.start(); allOscillators.push(lfo); allNodes.push(trem, base, lfoG); break
    }
    case '5': { // Phaser
      const dry = ctx.createGain(); dry.gain.value = 0.5
      input.connect(dry); dry.connect(output); allNodes.push(dry)
      const lfo  = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.18
      const lfoG = ctx.createGain(); lfoG.gain.value = 700
      const base = ctx.createConstantSource(); base.offset.value = 1000; base.start()
      let chain: AudioNode = input
      for (let i = 0; i < 4; i++) {
        const ap = ctx.createBiquadFilter(); ap.type = 'allpass'; ap.Q.value = 8
        ap.frequency.value = 400 + i * 300
        lfo.connect(lfoG); lfoG.connect(ap.frequency); base.connect(ap.frequency)
        chain.connect(ap); chain = ap; allNodes.push(ap)
      }
      const wetG = ctx.createGain(); wetG.gain.value = 0.5
      chain.connect(wetG); wetG.connect(output)
      lfo.start(); allOscillators.push(lfo); allNodes.push(lfoG, wetG, base); break
    }
    case '6': { // Wide — Haas
      const merger = ctx.createChannelMerger(2)
      const delay  = ctx.createDelay(0.04); delay.delayTime.value = 0.022
      input.connect(merger, 0, 0)
      input.connect(delay); delay.connect(merger, 0, 1)
      merger.connect(output); allNodes.push(merger, delay); break
    }
    case '7': { // Shimmer — reverb with pitch-shifted feedback
      const predelay = ctx.createDelay(0.1); predelay.delayTime.value = 0.04
      const { input: rvI, output: rvO, nodes } = makeReverb(ctx, 1.2, 0.7, 6000, 0.3, 1.5)
      input.connect(predelay); predelay.connect(rvI)
      const ringOsc  = ctx.createOscillator(); ringOsc.type = 'sine'
      ringOsc.frequency.value = 261.63 * (2 ** (1/12) - 1) * 80
      const ringGain = ctx.createGain(); ringGain.gain.value = 0
      const shimSend = ctx.createGain(); shimSend.gain.value = 0.35
      const shimFb   = ctx.createGain(); shimFb.gain.value = 0.45
      rvO.connect(shimSend)
      shimSend.connect(ringGain.gain as unknown as AudioNode)
      ringOsc.connect(ringGain); ringGain.connect(shimFb); shimFb.connect(rvI)
      rvO.connect(output)
      ringOsc.start(); allOscillators.push(ringOsc)
      allNodes.push(predelay, shimSend, shimFb, ringGain, ...nodes); break
    }
    case '8': { // Cathedral — double reverb pass
      const predelay = ctx.createDelay(0.5); predelay.delayTime.value = 0.06
      input.connect(predelay)
      const { input: rv1I, output: rv1O, nodes: n1 } = makeReverb(ctx, 2.2, 0.82, 3600, 0.15, 2.2)
      const { input: rv2I, output: rv2O, nodes: n2 } = makeReverb(ctx, 1.8, 0.78, 4500, 0, 0.8)
      predelay.connect(rv1I)
      rv1O.connect(rv2I); rv1O.connect(output); rv2O.connect(output)
      allNodes.push(predelay, ...n1, ...n2); break
    }
  }

  return {
    input, output,
    dispose: () => {
      allOscillators.forEach(o => { try { o.stop() } catch { /* ignore */ } })
      allNodes.forEach(n => { try { n.disconnect() } catch { /* ignore */ } })
    },
  }
}

// ─── Drop audio engine ────────────────────────────────────────────────────────

type DropAudioHandle = {
  stop: () => void
  setLevel: (v: number) => void
}

function createDropAudio(ctx: AudioContext, mixBus: GainNode, id: string): DropAudioHandle {
  const levelGain = ctx.createGain()
  levelGain.gain.setValueAtTime(0, ctx.currentTime)
  levelGain.connect(mixBus)

  const oscillators: OscillatorNode[] = []
  const extraNodes: AudioNode[] = []
  const fadeIn = (d = 2) => levelGain.gain.linearRampToValueAtTime(1, ctx.currentTime + d)

  switch (id) {
    case 'warmth': {
      const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 80
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 160
      const g1 = ctx.createGain(); g1.gain.value = 0.18
      const g2 = ctx.createGain(); g2.gain.value = 0.09
      o1.connect(g1); o2.connect(g2); g1.connect(levelGain); g2.connect(levelGain)
      fadeIn(3); o1.start(); o2.start()
      oscillators.push(o1, o2); extraNodes.push(g1, g2); break
    }
    case 'glow': {
      const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 432
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 864
      const g1 = ctx.createGain(); g1.gain.value = 0.12
      const g2 = ctx.createGain(); g2.gain.value = 0.06
      o1.connect(g1); o2.connect(g2); g1.connect(levelGain); g2.connect(levelGain)
      fadeIn(1.5); o1.start(); o2.start()
      oscillators.push(o1, o2); extraNodes.push(g1, g2); break
    }
    case 'shimmer': {
      for (const f of [880, 1320, 2200]) {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f
        const og = ctx.createGain(); og.gain.value = 0.04
        o.connect(og); og.connect(levelGain); o.start()
        oscillators.push(o); extraNodes.push(og)
      }
      fadeIn(2); break
    }
    case 'breath': {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 180
      const amp = ctx.createGain(); amp.gain.value = 0.12
      const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.25
      const lfoG = ctx.createGain(); lfoG.gain.value = 0.06
      lfo.connect(lfoG); lfoG.connect(amp.gain)
      o.connect(amp); amp.connect(levelGain)
      fadeIn(2); o.start(); lfo.start()
      oscillators.push(o, lfo); extraNodes.push(amp, lfoG); break
    }
    case 'space': {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 528
      const og = ctx.createGain(); og.gain.value = 0.08
      const delay = ctx.createDelay(1.0); delay.delayTime.value = 0.45
      const fbG = ctx.createGain(); fbG.gain.value = 0.5
      o.connect(og); og.connect(levelGain); og.connect(delay)
      delay.connect(fbG); fbG.connect(delay); delay.connect(levelGain)
      fadeIn(2); o.start()
      oscillators.push(o); extraNodes.push(og, delay, fbG); break
    }
    case 'weight': {
      const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 55
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 110
      const g1 = ctx.createGain(); g1.gain.value = 0.22
      const g2 = ctx.createGain(); g2.gain.value = 0.1
      o1.connect(g1); o2.connect(g2); g1.connect(levelGain); g2.connect(levelGain)
      fadeIn(4); o1.start(); o2.start()
      oscillators.push(o1, o2); extraNodes.push(g1, g2); break
    }
    case 'hum': {
      const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 220
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 221.5
      const g1 = ctx.createGain(); g1.gain.value = 0.1
      const g2 = ctx.createGain(); g2.gain.value = 0.1
      o1.connect(g1); o2.connect(g2); g1.connect(levelGain); g2.connect(levelGain)
      fadeIn(2); o1.start(); o2.start()
      oscillators.push(o1, o2); extraNodes.push(g1, g2); break
    }
    case 'mist': {
      const src = ctx.createBufferSource()
      src.buffer = makeNoiseBuffer(ctx, 4); src.loop = true
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'; filter.frequency.value = 800; filter.Q.value = 1.5
      const ng = ctx.createGain(); ng.gain.value = 0.12
      src.connect(filter); filter.connect(ng); ng.connect(levelGain)
      levelGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 2)
      src.start()
      return {
        setLevel: (v) => levelGain.gain.setTargetAtTime(v, ctx.currentTime, 0.05),
        stop: () => {
          levelGain.gain.setTargetAtTime(0, ctx.currentTime, 0.5)
          setTimeout(() => {
            try { src.stop() } catch { /* ignore */ }
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
      oscillators.push(o); extraNodes.push(og); break
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
  roomId: string | null
  roomLevel: number
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

// ─── Drag constants ───────────────────────────────────────────────────────────

const DRAG_RANGE_PX     = 180
const DRAG_THRESHOLD_PX = 6

// ─── Component ────────────────────────────────────────────────────────────────

type ActiveRoom = {
  id: string
  level: number
  ambient: AmbientHandle
  treatment: EffectChain
}

export default function PotionMixer() {
  const [activeDropIds, setActiveDropIds] = useState<string[]>([])
  const [levels, setLevels]               = useState<Record<string, number>>({})
  const [masterVolume, setMasterVolume]   = useState(0.65)
  const [activeRoom, setActiveRoom]       = useState<{ id: string; level: number } | null>(null)
  const [showSave, setShowSave]           = useState(false)
  const [saveName, setSaveName]           = useState('')
  const [saveWheel, setSaveWheel]         = useState<number | null>(null)
  const [confirmation, setConfirmation]   = useState('')
  // Which element is being dragged — drops or room
  const [draggingDropId, setDraggingDropId] = useState<string | null>(null)
  const [draggingRoom, setDraggingRoom]     = useState(false)

  // Audio graph: drops → mixBus → treatment.input → treatment.output → destination
  //              ambient.node → destination (independent, level-controlled)
  const ctxRef       = useRef<AudioContext | null>(null)
  const mixBusRef    = useRef<GainNode | null>(null)
  const handlesRef   = useRef<Record<string, DropAudioHandle>>({})
  const roomRef      = useRef<ActiveRoom | null>(null)

  const dropDragRef  = useRef<{ id: string; startX: number; startLevel: number; moved: boolean } | null>(null)
  const roomDragRef  = useRef<{ startX: number; startLevel: number; moved: boolean } | null>(null)

  // ── Context bootstrap ─────────────────────────────────────────────────────
  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      const ctx    = new AudioContext()
      const mixBus = ctx.createGain(); mixBus.gain.value = masterVolume
      // Default routing: dry to destination
      mixBus.connect(ctx.destination)
      ctxRef.current = ctx
      mixBusRef.current = mixBus
    }
    if (ctxRef.current.state === 'suspended') void ctxRef.current.resume()
    return { ctx: ctxRef.current, mixBus: mixBusRef.current! }
  }, [masterVolume])

  useEffect(() => {
    if (mixBusRef.current && ctxRef.current) {
      mixBusRef.current.gain.setTargetAtTime(masterVolume, ctxRef.current.currentTime, 0.1)
    }
  }, [masterVolume])

  useEffect(() => {
    return () => {
      Object.values(handlesRef.current).forEach(h => h.stop())
      if (roomRef.current) {
        roomRef.current.ambient.dispose()
        roomRef.current.treatment.dispose()
      }
      void ctxRef.current?.close()
    }
  }, [])

  // ── Room switching ─────────────────────────────────────────────────────────
  // Ambient level target when first activated — not overbearing
  const DEFAULT_ROOM_LEVEL = 0.45

  const selectRoom = useCallback((roomId: string | null) => {
    const { ctx, mixBus } = ensureCtx()

    // Tear down previous room
    if (roomRef.current) {
      const prev = roomRef.current
      // Fade ambient out
      prev.ambient.node.gain.setTargetAtTime(0, ctx.currentTime, 0.6)
      setTimeout(() => prev.ambient.dispose(), 2000)
      // Rewire mix bus dry before disposing treatment
      try { mixBus.disconnect() } catch { /* ignore */ }
      mixBus.connect(ctx.destination)
      setTimeout(() => prev.treatment.dispose(), 100)
      roomRef.current = null
    }

    setActiveRoom(null)
    if (roomId === null) return

    // Install new treatment on mix bus
    const treatment = createTreatment(ctx, roomId)
    try { mixBus.disconnect() } catch { /* ignore */ }
    mixBus.connect(treatment.input as GainNode)
    ;(treatment.output as GainNode).connect(ctx.destination)

    // Start ambient at zero then ramp to default level
    const ambient = createAmbient(ctx, roomId)
    ambient.node.connect(ctx.destination)
    ambient.node.gain.setValueAtTime(0, ctx.currentTime)
    ambient.node.gain.linearRampToValueAtTime(DEFAULT_ROOM_LEVEL * 0.22, ctx.currentTime + 3)

    roomRef.current = { id: roomId, level: DEFAULT_ROOM_LEVEL, ambient, treatment }
    setActiveRoom({ id: roomId, level: DEFAULT_ROOM_LEVEL })
  }, [ensureCtx])

  // Ambient level controlled by slide — 0→1 maps to 0→0.22 gain (keeps it background)
  const setRoomLevel = useCallback((level: number) => {
    const room = roomRef.current
    if (!room || !ctxRef.current) return
    room.level = level
    room.ambient.node.gain.setTargetAtTime(level * 0.22, ctxRef.current.currentTime, 0.05)
    setActiveRoom(prev => prev ? { ...prev, level } : null)
  }, [])

  // ── Drop management ───────────────────────────────────────────────────────
  const activateDrop = useCallback((dropId: string) => {
    const { ctx, mixBus } = ensureCtx()
    handlesRef.current[dropId] = createDropAudio(ctx, mixBus, dropId)
    setActiveDropIds(prev => [...prev, dropId])
    setLevels(prev => ({ ...prev, [dropId]: 1.0 }))
  }, [ensureCtx])

  const deactivateDrop = useCallback((dropId: string) => {
    handlesRef.current[dropId]?.stop()
    delete handlesRef.current[dropId]
    setActiveDropIds(prev => prev.filter(id => id !== dropId))
    setLevels(prev => { const n = { ...prev }; delete n[dropId]; return n })
  }, [])

  const clearAll = useCallback(() => {
    Object.values(handlesRef.current).forEach(h => h.stop())
    handlesRef.current = {}
    setActiveDropIds([])
    setLevels({})
  }, [])

  // ── Drop pointer drag ─────────────────────────────────────────────────────
  const handleDropPointerDown = useCallback((e: React.PointerEvent, dropId: string) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    if (!activeDropIds.includes(dropId)) return
    dropDragRef.current = { id: dropId, startX: e.clientX, startLevel: levels[dropId] ?? 1.0, moved: false }
  }, [activeDropIds, levels])

  const handleDropPointerMove = useCallback((e: React.PointerEvent, dropId: string) => {
    const drag = dropDragRef.current
    if (!drag || drag.id !== dropId) return
    const delta = e.clientX - drag.startX
    if (Math.abs(delta) > DRAG_THRESHOLD_PX) drag.moved = true
    if (!drag.moved) return
    const v = Math.max(0, Math.min(1, drag.startLevel + delta / DRAG_RANGE_PX))
    handlesRef.current[dropId]?.setLevel(v)
    setLevels(prev => ({ ...prev, [dropId]: v }))
    setDraggingDropId(dropId)
  }, [])

  const handleDropPointerUp = useCallback((e: React.PointerEvent, dropId: string) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    const wasDrag = dropDragRef.current?.moved ?? false
    dropDragRef.current = null
    setDraggingDropId(null)
    if (wasDrag) return
    if (activeDropIds.includes(dropId)) deactivateDrop(dropId)
    else activateDrop(dropId)
  }, [activeDropIds, activateDrop, deactivateDrop])

  // ── Room pill pointer drag ────────────────────────────────────────────────
  const handleRoomPointerDown = useCallback((e: React.PointerEvent, roomId: string) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    if (activeRoom?.id !== roomId) return
    roomDragRef.current = { startX: e.clientX, startLevel: activeRoom.level, moved: false }
  }, [activeRoom])

  const handleRoomPointerMove = useCallback((e: React.PointerEvent, roomId: string) => {
    const drag = roomDragRef.current
    if (!drag || activeRoom?.id !== roomId) return
    const delta = e.clientX - drag.startX
    if (Math.abs(delta) > DRAG_THRESHOLD_PX) drag.moved = true
    if (!drag.moved) return
    const v = Math.max(0, Math.min(1, drag.startLevel + delta / DRAG_RANGE_PX))
    setRoomLevel(v)
    setDraggingRoom(true)
  }, [activeRoom, setRoomLevel])

  const handleRoomPointerUp = useCallback((e: React.PointerEvent, roomId: string) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    const wasDrag = roomDragRef.current?.moved ?? false
    roomDragRef.current = null
    setDraggingRoom(false)
    if (wasDrag) return
    // Tap = toggle room
    selectRoom(activeRoom?.id === roomId ? null : roomId)
  }, [activeRoom, selectRoom])

  // ── Derived ───────────────────────────────────────────────────────────────
  const activeEntries = activeDropIds.map(id => ({
    id, color: DROPS.find(d => d.id === id)!.color, level: levels[id] ?? 1.0,
  }))
  const potColor    = blendWeighted(activeEntries)
  const isEmpty     = activeDropIds.length === 0
  const activeRoomDef = ROOMS.find(r => r.id === activeRoom?.id) ?? null

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!activeDropIds.length) return
    persistAtmosphere({
      name: saveName.trim() || 'Untitled mixture',
      drops: activeDropIds.map(id => ({ id, level: levels[id] ?? 1.0 })),
      masterVolume,
      roomId: activeRoom?.id ?? null,
      roomLevel: activeRoom?.level ?? DEFAULT_ROOM_LEVEL,
      wheelIndex: saveWheel,
      savedAt: Date.now(),
    })
    const label = saveWheel !== null ? clockTitles[saveWheel] : 'session'
    setConfirmation(`Saved — ${saveName.trim() || 'Untitled mixture'} · ${label}`)
    setShowSave(false); setSaveName(''); setSaveWheel(null)
    setTimeout(() => setConfirmation(''), 4000)
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* ── Room selector ── */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-1">
          Room
        </p>
        <p className="text-[9px] text-gray-400/60 dark:text-gray-500/60 mb-3">
          Tap a room to enter it · slide left / right to adjust the ambient level
        </p>
        <div className="flex flex-wrap gap-1.5">
          {/* No room */}
          <button
            type="button"
            onClick={() => selectRoom(null)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-medium border transition-all ${
              !activeRoom
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent'
                : 'border-black/10 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-black/20 dark:hover:border-white/20'
            }`}
          >
            No room
          </button>

          {ROOMS.map(room => {
            const isActive = activeRoom?.id === room.id
            const level    = isActive ? (activeRoom?.level ?? DEFAULT_ROOM_LEVEL) : 0
            const isDragging = draggingRoom && isActive
            return (
              <div key={room.id} className="relative flex flex-col items-center gap-0.5">
                {/* Level readout above pill — visible only while dragging */}
                <div
                  className="text-[9px] font-mono tabular-nums text-gray-500 dark:text-gray-400 h-3.5 leading-none transition-opacity duration-100 text-center"
                  style={{ opacity: isDragging ? 1 : 0 }}
                >
                  {Math.round(level * 100)}
                </div>
                <button
                  type="button"
                  title={`${room.ambientName} · ${room.treatmentName}`}
                  className="px-3 py-1.5 rounded-full text-[10px] font-medium border transition-all select-none"
                  style={{
                    touchAction: 'none',
                    borderColor: isActive ? room.color : 'rgba(128,128,128,0.2)',
                    color: isActive ? room.color : undefined,
                    backgroundColor: isActive ? `${room.color}${Math.round(level * 0.22 * 255).toString(16).padStart(2,'0')}` : undefined,
                    boxShadow: isActive ? `0 0 0 1px ${room.color}${Math.round(level * 80).toString(16).padStart(2,'0')}` : undefined,
                    opacity: isActive ? 0.5 + level * 0.5 : 1,
                    cursor: isActive ? 'ew-resize' : 'pointer',
                  }}
                  onPointerDown={e => handleRoomPointerDown(e, room.id)}
                  onPointerMove={e => handleRoomPointerMove(e, room.id)}
                  onPointerUp={e => handleRoomPointerUp(e, room.id)}
                >
                  {room.wheelName}
                </button>
              </div>
            )
          })}
        </div>

        {/* Active room description */}
        <p
          className="mt-2 text-[10px] text-gray-400 dark:text-gray-500 h-4 transition-opacity duration-300"
          style={{ opacity: activeRoomDef ? 1 : 0 }}
        >
          {activeRoomDef
            ? `${activeRoomDef.ambientName} · ${activeRoomDef.treatmentName}`
            : ''}
        </p>
      </div>

      {/* ── The pot ── */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative" style={{ width: 200, height: 200 }}>
          <svg viewBox="0 0 200 200" width="200" height="200"
            className="absolute inset-0 pointer-events-none" aria-hidden>
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
              fill="none" stroke="white" strokeWidth="1.5" opacity={0.1} />
            {!isEmpty && (
              <ellipse cx="90" cy="68" rx="28" ry="8"
                fill="white" opacity={0.07} transform="rotate(-10 90 68)" />
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
            const active    = activeDropIds.includes(drop.id)
            const level     = levels[drop.id] ?? 1.0
            const isDragging = draggingDropId === drop.id
            return (
              <div key={drop.id} className="flex flex-col items-center gap-2">
                <div
                  className="text-[10px] font-mono tabular-nums text-gray-500 dark:text-gray-400 h-4 leading-none transition-opacity duration-150"
                  style={{ opacity: isDragging ? 1 : 0 }}
                >
                  {Math.round(level * 100)}
                </div>
                <div
                  role="button"
                  aria-pressed={active}
                  aria-label={`${drop.name} — ${drop.sub}`}
                  className="rounded-full select-none"
                  style={{
                    width: 52, height: 52,
                    backgroundColor: drop.color,
                    cursor: active ? 'ew-resize' : 'pointer',
                    touchAction: 'none',
                    opacity: active ? 0.35 + level * 0.65 : 0.55,
                    transform: active ? `scale(${1.04 + level * 0.08}) translateY(-2px)` : 'scale(1)',
                    boxShadow: active
                      ? `0 0 0 2px white, 0 0 0 4px ${drop.color}66, 0 4px ${8 + level * 10}px ${drop.color}${Math.round(level * 88).toString(16).padStart(2,'0')}`
                      : `0 2px 8px ${drop.color}44`,
                    transition: isDragging ? 'box-shadow 0.05s, opacity 0.05s' : 'all 0.25s ease',
                  }}
                  onPointerDown={e => handleDropPointerDown(e, drop.id)}
                  onPointerMove={e => handleDropPointerMove(e, drop.id)}
                  onPointerUp={e => handleDropPointerUp(e, drop.id)}
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
          <Button variant="outline" size="sm" onClick={clearAll} className="text-xs h-8">Clear</Button>
        )}
        {!isEmpty && !showSave && (
          <Button size="sm" onClick={() => setShowSave(true)} className="text-xs h-8">Save mixture</Button>
        )}
        {confirmation && (
          <span className="text-[11px] text-green-600 dark:text-green-400">{confirmation}</span>
        )}
      </div>

      {/* ── Save panel ── */}
      {showSave && (
        <div className="rounded-xl border border-black/8 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] p-5 space-y-4">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Name this mixture</p>
          <input
            type="text" autoFocus maxLength={48}
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
                type="button" onClick={() => setSaveWheel(null)}
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
                  key={i} type="button" onClick={() => setSaveWheel(i)}
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
            <Button size="sm" variant="ghost"
              onClick={() => { setShowSave(false); setSaveName(''); setSaveWheel(null) }}
              className="text-xs h-8"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes mm-bubble {
          0%   { transform: translateY(0)    scale(1);    opacity: 0.6;  }
          50%  { transform: translateY(-7px) scale(1.1); opacity: 0.85; }
          100% { transform: translateY(0)    scale(0.95); opacity: 0.45; }
        }
      `}</style>
    </div>
  )
}
