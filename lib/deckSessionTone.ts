'use client'

/**
 * Short confirmation tones for deck session save / load (Web Audio API).
 * Fails silently if AudioContext is unavailable or blocked.
 */

function scheduleNote(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  duration: number,
  peakGain: number,
) {
  const t0 = ctx.currentTime + start
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, t0)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.linearRampToValueAtTime(peakGain, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(g)
  g.connect(dest)
  osc.start(t0)
  osc.stop(t0 + duration + 0.04)
}

async function playSequence(
  notes: Array<{ freq: number; at: number; dur: number; gain: number }>,
  masterPeak: number,
) {
  if (typeof window === 'undefined') return
  let ctx: AudioContext
  try {
    ctx = new AudioContext()
  } catch {
    return
  }
  try {
    if (ctx.state === 'suspended') await ctx.resume()
  } catch {
    try {
      void ctx.close()
    } catch {
      /* ignore */
    }
    return
  }

  const master = ctx.createGain()
  master.gain.setValueAtTime(masterPeak, ctx.currentTime)
  master.connect(ctx.destination)

  const totalEnd = Math.max(...notes.map(n => n.at + n.dur), 0) + 0.15
  for (const n of notes) {
    scheduleNote(ctx, master, n.freq, n.at, n.dur, n.gain)
  }

  window.setTimeout(() => {
    try {
      void ctx.close()
    } catch {
      /* ignore */
    }
  }, Math.ceil(totalEnd * 1000) + 80)
}

/** Ascending two-note “saved” chirp */
export function playDeckSessionSaveTone(): void {
  void playSequence(
    [
      { freq: 740, at: 0, dur: 0.07, gain: 0.22 },
      { freq: 988, at: 0.09, dur: 0.11, gain: 0.2 },
    ],
    0.35,
  )
}

/** Softer descending pair for “loaded” */
export function playDeckSessionLoadTone(): void {
  void playSequence(
    [
      { freq: 660, at: 0, dur: 0.09, gain: 0.2 },
      { freq: 494, at: 0.1, dur: 0.14, gain: 0.17 },
    ],
    0.32,
  )
}
