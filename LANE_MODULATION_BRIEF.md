# Lane Modulation Brief
### Nine Lanes — Nine Characters — One Instrument
**Mind Mechanism | EIC Brief | 2026-05-08**

---

## The Requirement

The sequencer has nine lanes — one per wheel. Each lane must feel like its wheel, not just sound at its frequency. The difference between ROOT and THROAT is not only that Saturn is lower than Mercury. It is that Saturn is *heavy* and Mercury is *clear*. That qualitative difference must be audible in how the lane fires.

Secondary to that: each lane accepts a user-uploaded MP3. When the user loads their own audio, it passes through the same lane's processing chain — their sound takes on the wheel's character. This is not cosmetic. It is the mechanism by which the student's personal vocabulary enters the MM framework.

---

## Current State

Every lane uses the same audio graph:

```
AudioBufferSourceNode → GainNode (envelope) → MasterGain → AudioContext.destination
```

There is no per-lane processing. The drone buffer and the envelope constants are the only differentiation. The result: nine lanes that feel like one lane playing nine files.

---

## Target State

Each lane inserts its own processing chain between the envelope gain and the master:

```
AudioBufferSourceNode → GainNode (envelope) → [LaneProcessor] → MasterGain → destination
```

The `LaneProcessor` is a small Web Audio sub-graph — two to four nodes — that gives the lane its characteristic texture. It is created fresh for each hit (stateless, no persistent LFO state required at this phase). Each hit is a complete, self-contained signal path.

---

## The Nine Lane Characters

These are derived from the somatic and conceptual identity of each wheel, not from aesthetic preference. The processing choices have functional justification.

### W1 — ROOT | Saturn | 147.85 Hz
**Character: Gravity. Dense. Immovable.**

The ROOT is the body's ground connection. It should feel like weight, like something you lean into rather than float above.

```
Processing chain:
  → BiquadFilter   type: lowpass   freq: 320 Hz   Q: 2.2
  → BiquadFilter   type: peaking   freq: 80 Hz    gain: +4 dB   Q: 1.0
  → GainNode       gain: 1.15

Effect: Low-end emphasis. Everything above 320Hz rolls off steeply.
The 80Hz boost adds physical presence — you feel it before you hear it.
Longer sustain default (120ms).
```

---

### W2 — SACRAL | Neptune | 211.44 Hz
**Character: Fluid. Moving. Without fixed edge.**

Neptune's somatic territory is the lower abdomen — fluid dynamics, boundary dissolution, creative impulse. The sound should feel like it shifts while you listen.

```
Processing chain:
  → BiquadFilter   type: bandpass   freq: 340 Hz   Q: 0.8
  → DelayNode      delayTime: 0.022s (22ms)
  → GainNode       gain: 0.35   (delayed signal mixed back — creates doubling)
  → WetDryMix      dry: 0.75   wet: 0.25

Effect: The 22ms delay creates a subtle doubling — the sound has
an undulating, slightly unstable quality. Not an echo; a shimmer.
```

Note for implementation: wet/dry mix requires a simple parallel graph — the dry signal bypasses the delay chain and both paths rejoin before master.

---

### W3 — SOLAR PLEXUS | Mars | 144.72 Hz
**Character: Assertive. Direct. Cuts through.**

Mars governs will, action, forward force. The sound should have presence and edge — it should announce itself.

```
Processing chain:
  → WaveShaperNode  curve: soft-clip saturation (see curve spec below)
  → BiquadFilter    type: peaking   freq: 2800 Hz   gain: +5 dB   Q: 1.4
  → BiquadFilter    type: highpass  freq: 120 Hz    Q: 0.7

Effect: Soft saturation adds harmonic content (odd harmonics = presence).
The 2.8kHz boost lifts the upper midrange — the 'cut' frequency for
voice intelligibility. Highpass removes mud.
```

Soft-clip WaveShaper curve:
```typescript
const curve = new Float32Array(256)
for (let i = 0; i < 256; i++) {
  const x = (i * 2) / 255 - 1
  curve[i] = (Math.PI + 280) * x / (Math.PI + 280 * Math.abs(x))
}
```

---

### W4 — HEART | Venus | 221.23 Hz
**Character: Warm. Open. Expansive.**

The HEART is the body's centre of integration. It should feel generous — a sound that opens rather than concentrates.

```
Processing chain:
  → BiquadFilter   type: peaking   freq: 420 Hz   gain: +3 dB   Q: 0.9
  → BiquadFilter   type: highshelf freq: 6000 Hz  gain: -2 dB
  → DelayNode      delayTime: 0.035s   wet: 0.30
  → GainNode       gain: 1.0

Effect: The mid-range warmth boost, the gentle high rolloff (nothing harsh),
and the short delay tail give the sense of a sound that lingers and spreads.
Longer natural decay. The HEART lane does not snap off cleanly.
```

---

### W5 — THROAT | Mercury | 141.27 Hz
**Character: Clear. Precise. No excess.**

Mercury is communication — direct, unambiguous, efficient. The THROAT lane is the reference lane. It is what the others deviate from.

```
Processing chain:
  → BiquadFilter   type: peaking   freq: 3500 Hz   gain: +2 dB   Q: 2.0
  → GainNode       gain: 1.0

Effect: Minimal. A gentle presence boost at the top of the voice
intelligibility range. No reverb, no saturation, no colour. The most
transparent lane. If something sounds wrong on another lane, A/B it
against THROAT to find the problem.
```

---

### W6 — THIRD EYE | Uranus | 207.36 Hz
**Character: Spacious. Crystalline. Not quite of this room.**

Uranus in the MM framework carries the quality of perception beyond ordinary sense — the overview, the pattern recognition, the slightly detached clarity of insight. The sound should feel like it is coming from a larger space than the room you are in.

```
Processing chain:
  → BiquadFilter   type: peaking   freq: 7000 Hz   gain: +4 dB   Q: 1.2
  → DelayNode      delayTime: 0.055s   wet: 0.40
  → BiquadFilter   type: highpass  freq: 200 Hz    Q: 0.5
  → GainNode       gain: 0.9

Effect: The high-frequency boost makes it shimmer. The longer delay
(55ms) creates a sense of spatial depth — the sound extends into space
behind the source. The highpass cuts the mud so the effect reads as
'distance' rather than 'reverb.'
```

---

### W7 — MALE CROWN | Jupiter F♯ | 183.53 Hz
**Character: Expansive. Resonant. Authoritative but not aggressive.**

Jupiter's upper harmonic position in the MM taxonomy — the first Crown. Should feel large, warm, and held.

```
Processing chain:
  → WaveShaperNode  curve: gentle harmonic saturation (softer than W3)
  → BiquadFilter    type: peaking   freq: 600 Hz   gain: +4 dB   Q: 0.8
  → BiquadFilter    type: peaking   freq: 200 Hz   gain: +2 dB   Q: 1.2
  → GainNode        gain: 1.05

Effect: The saturation adds warmth and fullness without the bite of W3.
Two boost points — lower midrange body (600Hz) and low-mid warmth (200Hz).
Full-bodied, slightly golden quality. Longer sustain default (100ms).
```

Saturation curve for W7 (softer than W3):
```typescript
const curve = new Float32Array(256)
for (let i = 0; i < 256; i++) {
  const x = (i * 2) / 255 - 1
  curve[i] = (Math.PI + 80) * x / (Math.PI + 80 * Math.abs(x))
}
```

---

### W8 — FEMALE CROWN | Jupiter A♯ | 234.88 Hz
**Character: Receptive. Shimmering. High and open.**

The second Crown at the higher Jupiter harmonic. Should feel lighter than W7, with more air and less body — receptive rather than projecting.

```
Processing chain:
  → BiquadFilter   type: highshelf  freq: 4000 Hz   gain: +4 dB
  → BiquadFilter   type: peaking    freq: 9000 Hz   gain: +3 dB   Q: 1.5
  → DelayNode      delayTime: 0.045s   wet: 0.35
  → GainNode       gain: 0.88

Effect: The high shelf and 9kHz boost create a bright, airy shimmer.
The delay adds space without weight. Lower overall gain keeps it
from overwhelming the mix — this lane should feel like it lives
at the top of the instrument, floating above the others.
```

---

### W9 — ETHERIC HEART | Earth (planet) | 136.1 Hz
**Character: Integration. Balanced. Complete.**

The ninth wheel is **Etheric Heart**: planetary correspondence **Earth**, same OM / Earth tonic as Root and Heart at **136.10 Hz** — the closing vertex of the built-in Trinity (body → relation → sovereignty). It is the synthesis of all nine wheels — the point where the full taxonomy comes together. It should sound as if it contains everything. Not in a louder or more complex sense, but in a sense of completeness.

```
Processing chain:
  → BiquadFilter   type: peaking   freq: 250 Hz    gain: +2 dB   Q: 1.0
  → BiquadFilter   type: peaking   freq: 2000 Hz   gain: +2 dB   Q: 1.0
  → BiquadFilter   type: peaking   freq: 7000 Hz   gain: +1.5 dB Q: 1.5
  → GainNode       gain: 1.0

Effect: Three equal boosts across the three frequency regions — low-mid
body, mid presence, high shimmer. None dominant. The most neutral-feeling
lane despite being the most processed. It should sound like it belongs
everywhere in the mix at once.
```

---

## User Upload — Passing Through the Lane Character

When a user uploads their own MP3 to a lane, their audio passes through the same processing chain as the preset drone. This is architecturally automatic if the chain is correctly placed between the envelope gain node and the master.

The result: a user who uploads a recording of themselves chanting a word into the THROAT lane hears their voice with Mercury's characteristic clarity. The same recording on the HEART lane sounds warmer and wider. The lane's identity shapes their material.

This is the mechanism Sean described: *the user creates associations with sound and their vocabulary using the control tones with the ability to import and modulate external sounds.* The control tone is not replaced — the user's sound is transformed by the lane's character, which is anchored to the planetary frequency.

One option to add (Phase 2): a **blend control** per lane — how much of the lane processing is applied to the user's upload (0% = raw upload, 100% = full lane character). Preset drones always use 100%.

---

## Implementation Instructions for Cursor

### Step 1 — Build the lane processor factory

Create `lib/sequencer-lane-processors.ts`. Export:

```typescript
type LaneProcessor = {
  input: AudioNode     // connect source here
  output: AudioNode    // connect this to master
}

export function buildLaneProcessor(ctx: AudioContext, wheelIndex: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8): LaneProcessor
```

Each call to `buildLaneProcessor` creates a new chain for that wheel (used per-hit). The function is a switch on `wheelIndex` — nine cases, each wiring up the nodes described above.

### Step 2 — Insert into StepSequencer playHitsAtStep

In `playHitsAtStep` and `playHitForTrackStep`, change:

```typescript
// Current
src.connect(g)
g.connect(master)
```

To:

```typescript
// New
const laneProc = buildLaneProcessor(ctx, t as WheelIndex)
src.connect(g)
g.connect(laneProc.input)
laneProc.output.connect(master)
```

The `t` variable (track index 0–8) is already available in both functions.

### Step 3 — Test lane identity

Create a simple test: activate one step on each lane. Play them in sequence. Each step should sound audibly different in character, not just in pitch. If two adjacent lanes sound the same, the processing chain is not engaging.

### Step 4 — Upload passthrough (verify, not build)

Upload an audio file to one lane. Confirm the processed chain applies — the uploaded audio should go through the same `buildLaneProcessor` path as the preset. If it does, no additional work is needed here. If it bypasses, the `playHitForTrackStep` function needs the same update as Step 2.

---

## What Not to Do

- Do not add persistent LFO modulation in this phase. Static processing chains only. LFO (undulating filter cutoff, vibrato) is a Phase 2 enhancement once the static characters are confirmed.
- Do not add reverb impulse responses (convolver). Use delay-based spatial simulation only. Impulse responses require file assets and are a separate build.
- Do not change the envelope constants (attack, release, sustain) per lane in this phase — the sustain slider already gives the user per-lane control. Lane character comes from spectral processing, not envelope shaping, in this phase.

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Ready to hand to Cursor as a build instruction.*
*Companion to: PHRASE_DIAGNOSTIC_BRIEF.md, SOUND_IMPLEMENTATION_BRIEF.md*
