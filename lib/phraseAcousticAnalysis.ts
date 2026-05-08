/**
 * Phrase tape — acoustic scaffolding (Mind Mechanism).
 *
 * Prominence = where pitch + loudness jointly spike relative to this clip’s baseline.
 * This is acoustic prominence, not claimed linguistic stress or emotional diagnosis.
 */

export const PHRASE_ACOUSTIC_PIPELINE_VERSION = 3 as const

/** Server ASR token with timestamps (e.g. Whisper). */
export type PhraseTranscriptWord = {
  word: string
  startSec: number
  endSec: number
}

/** Local frame metrics aggregated per ASR word span — evidence-first. */
export type PhraseWordAlignment = {
  word: string
  startSec: number
  endSec: number
  prominenceMean: number
  prominenceMax: number
  meanF0Hz: number | null
  /** Frames whose centres fell inside [startSec, endSec] */
  frameCount: number
}

export type AnalyzePhraseOptions = {
  /** When set (e.g. after server ASR), per-word prominence rows are filled from local frames. */
  transcriptWords?: PhraseTranscriptWord[]
}

/** Voicing-based slice (not words): energy threshold + short-gap merge. */
export type PhraseSpeechSegment = {
  startSec: number
  endSec: number
  durationSec: number
  meanF0Hz: number | null
  meanRms: number
  /** Mean normalized prominence within this segment (0–1 scale vs clip peak) */
  meanProminence: number
}

export type PhraseAcousticPeak = {
  /** Centre of analysis frame (seconds) */
  tSec: number
  /** Display score 0–100 within this clip */
  score: number
  /** Evidence: energy above clip median (robust z-ish) */
  energyEvidence: number
  /** Evidence: pitch in semitones above clip median F0 (0 if unvoiced frame) */
  pitchEvidenceSemitones: number
}

export type PhraseAcousticReport = {
  pipelineVersion: typeof PHRASE_ACOUSTIC_PIPELINE_VERSION
  sampleRate: number
  durationSec: number
  /** Short methodology string for in-app disclosure */
  methodologyLine: string
  summary: {
    medianF0Hz: number | null
    f0MinHz: number | null
    f0MaxHz: number | null
    /** Fraction of frames classified as voiced (0–1) */
    voicedFrameFraction: number
    /** Median RMS of frames (linear, not dB) */
    medianRms: number
    /** HF / LF RMS ratio — “brightness / openness” proxy (unitless, clip-relative) */
    brightnessRatio: number
  }
  frameHopSec: number
  /** Length matches `frameCount`; each in 0–1 for sparkline */
  prominenceCurve: number[]
  energyCurve: number[]
  /** Ordered by time; typically 3–10 peaks */
  prominencePeaks: PhraseAcousticPeak[]
  /** Voicing-threshold segments — production “bursts”, not ASR words */
  speechSegments: PhraseSpeechSegment[]
  /** Populated when `transcriptWords` were supplied to analysis — ASR time, local prominence */
  wordAlignments: PhraseWordAlignment[]
}

const FRAME_SIZE = 1024
const HOP = 256
const F0_MIN_HZ = 75
const F0_MAX_HZ = 420
const PEAK_MIN_SEP_SEC = 0.11
const PEAK_SMOOTH = 5
const MAX_PEAKS = 10
const MAX_GAP_MERGE_SEC = 0.088
const MIN_SEGMENT_SEC = 0.065

function mergeShortSilentGaps(active: boolean[], sampleRate: number): boolean[] {
  const out = [...active]
  const n = out.length
  let i = 0
  while (i < n) {
    if (out[i]) {
      i++
      continue
    }
    const g0 = i
    while (i < n && !out[i]) i++
    const g1 = i
    if (g0 === 0 || g1 === n) continue
    const endPrev = ((g0 - 1) * HOP + FRAME_SIZE) / sampleRate
    const startNext = (g1 * HOP) / sampleRate
    const gap = Math.max(0, startNext - endPrev)
    if (gap <= MAX_GAP_MERGE_SEC) {
      for (let k = g0; k < g1; k++) out[k] = true
    }
  }
  return out
}

function buildSpeechSegments(
  active: boolean[],
  eRms: number[],
  f0s: (number | null)[],
  normProm: number[],
  sampleRate: number,
  durationSec: number
): PhraseSpeechSegment[] {
  const segs: PhraseSpeechSegment[] = []
  let s = -1
  const flush = (e: number) => {
    if (s < 0) return
    const startSec = (s * HOP) / sampleRate
    const endSec = Math.min(durationSec, (e * HOP + FRAME_SIZE) / sampleRate)
    const duration = Math.max(0, endSec - startSec)
    if (duration >= MIN_SEGMENT_SEC) {
      let rSum = 0
      let pSum = 0
      const fhz: number[] = []
      for (let k = s; k <= e; k++) {
        rSum += eRms[k]!
        pSum += normProm[k]!
        const f = f0s[k]
        if (f != null && f > 0) fhz.push(f)
      }
      const count = e - s + 1
      fhz.sort((a, b) => a - b)
      const meanF0 = fhz.length ? median(fhz) : null
      segs.push({
        startSec,
        endSec,
        durationSec: duration,
        meanF0Hz: meanF0,
        meanRms: rSum / count,
        meanProminence: pSum / count,
      })
    }
    s = -1
  }

  for (let i = 0; i < active.length; i++) {
    if (active[i]) {
      if (s < 0) s = i
    } else {
      if (s >= 0) flush(i - 1)
    }
  }
  if (s >= 0) flush(active.length - 1)
  return segs
}

function buildWordAlignments(
  words: PhraseTranscriptWord[],
  frameStarts: number[],
  normProm: number[],
  f0s: (number | null)[]
): PhraseWordAlignment[] {
  const out: PhraseWordAlignment[] = []
  for (const w of words) {
    const label = w.word.trim()
    if (!label) continue
    let pSum = 0
    let pMax = 0
    let n = 0
    const fz: number[] = []
    for (let i = 0; i < frameStarts.length; i++) {
      const t = frameStarts[i]!
      if (t < w.startSec || t > w.endSec) continue
      pSum += normProm[i]!
      pMax = Math.max(pMax, normProm[i]!)
      n++
      const f = f0s[i]
      if (f != null && f > 0) fz.push(f)
    }
    fz.sort((a, b) => a - b)
    out.push({
      word: label,
      startSec: w.startSec,
      endSec: w.endSec,
      prominenceMean: n ? pSum / n : 0,
      prominenceMax: n ? pMax : 0,
      meanF0Hz: fz.length ? median(fz) : null,
      frameCount: n,
    })
  }
  return out
}

function rms(x: Float32Array, start: number, len: number): number {
  let s = 0
  const end = Math.min(start + len, x.length)
  for (let i = start; i < end; i++) {
    const v = x[i]!
    s += v * v
  }
  const n = end - start
  return n > 0 ? Math.sqrt(s / n) : 0
}

/** Single-channel F0 via normalized autocorrelation (voiced speech). */
function estimateF0Hz(frame: Float32Array, sr: number): number | null {
  const n = frame.length
  if (n < 512) return null

  let peak = 0
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(frame[i]!))
  if (peak < 1e-6) return null
  const clip = peak * 0.25
  const x = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const v = frame[i]!
    x[i] = Math.max(-clip, Math.min(clip, v))
  }

  const lagMin = Math.max(2, Math.floor(sr / F0_MAX_HZ))
  const lagMax = Math.min(Math.floor(n / 2) - 1, Math.ceil(sr / F0_MIN_HZ))

  let r0 = 0
  for (let i = 0; i < n; i++) r0 += x[i]! * x[i]!
  if (r0 < 1e-12) return null

  let bestLag = lagMin
  let best = -1
  for (let lag = lagMin; lag <= lagMax; lag++) {
    let acc = 0
    for (let i = 0; i < n - lag; i++) acc += x[i]! * x[i + lag]!
    const norm = acc / r0
    if (norm > best) {
      best = norm
      bestLag = lag
    }
  }
  if (best < 0.65) return null

  // Parabolic refinement on autocorr peak
  let accM = 0
  for (let i = 0; i < n - (bestLag - 1); i++) accM += x[i]! * x[i + bestLag - 1]!
  let accP = 0
  for (let i = 0; i < n - (bestLag + 1); i++) accP += x[i]! * x[i + bestLag + 1]!
  const yM = accM / r0
  const y0 = best
  const yP = accP / r0
  const denom = yM - 2 * y0 + yP
  const delta = Math.abs(denom) > 1e-8 ? 0.5 * (yM - yP) / denom : 0
  const refinedLag = Math.max(lagMin, Math.min(lagMax, bestLag + delta))
  return sr / refinedLag
}

function hzToMidi(hz: number): number {
  return 12 * Math.log2(hz / 440) + 69
}

function median(sorted: number[]): number | null {
  if (!sorted.length) return null
  const m = Math.floor(sorted.length / 2)
  if (sorted.length % 2) return sorted[m]!
  return (sorted[m - 1]! + sorted[m]!) / 2
}

function quantile(sorted: number[], q: number): number | null {
  if (!sorted.length) return null
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (sorted[base + 1] === undefined) return sorted[base]!
  return sorted[base]! + rest * (sorted[base + 1]! - sorted[base]!)
}

function smoothMovingAvg(a: number[], win: number): number[] {
  if (win <= 1) return [...a]
  const half = Math.floor(win / 2)
  const out = new Array(a.length)
  for (let i = 0; i < a.length; i++) {
    let s = 0
    let c = 0
    for (let j = i - half; j <= i + half; j++) {
      if (j >= 0 && j < a.length) {
        s += a[j]!
        c++
      }
    }
    out[i] = c ? s / c : 0
  }
  return out
}

function downsampleMax(values: number[], targetLen: number): number[] {
  if (values.length <= targetLen || targetLen < 2) return [...values]
  const out: number[] = []
  const step = values.length / targetLen
  for (let k = 0; k < targetLen; k++) {
    const start = Math.floor(k * step)
    const end = Math.floor((k + 1) * step)
    let m = 0
    for (let i = start; i < end; i++) m = Math.max(m, values[i] ?? 0)
    out.push(m)
  }
  return out
}

/**
 * Decode blob to mono float32 at native rate; caller should close `ctx` if created ad hoc.
 */
export async function decodeBlobToMono(ctx: AudioContext, blob: Blob): Promise<{ mono: Float32Array; sampleRate: number }> {
  const ab = await blob.arrayBuffer()
  const audioBuf = await ctx.decodeAudioData(ab.slice(0))
  const n = audioBuf.length
  const mono = new Float32Array(n)
  const ch0 = audioBuf.getChannelData(0)
  if (audioBuf.numberOfChannels === 1) {
    mono.set(ch0)
  } else {
    const ch1 = audioBuf.getChannelData(1)
    for (let i = 0; i < n; i++) mono[i] = (ch0[i]! + ch1[i]!) * 0.5
  }
  return { mono, sampleRate: audioBuf.sampleRate }
}

export async function analyzePhraseBlob(
  blob: Blob,
  options?: AnalyzePhraseOptions
): Promise<PhraseAcousticReport> {
  const ctx = new AudioContext()
  await ctx.resume().catch(() => undefined)
  try {
    const { mono, sampleRate } = await decodeBlobToMono(ctx, blob)
    const durationSec = mono.length / sampleRate
    const hopSec = HOP / sampleRate

    const frameStarts: number[] = []
    const eRms: number[] = []
    const eHf: number[] = []
    const f0s: (number | null)[] = []

    const frame = new Float32Array(FRAME_SIZE)
    for (let start = 0; start + FRAME_SIZE <= mono.length; start += HOP) {
      frame.set(mono.subarray(start, start + FRAME_SIZE))
      const r = rms(frame, 0, FRAME_SIZE)
      // Crude HF emphasis: first difference energy vs signal RMS
      let hf = 0
      for (let i = 1; i < FRAME_SIZE; i++) {
        const d = frame[i]! - frame[i - 1]!
        hf += d * d
      }
      hf = Math.sqrt(hf / (FRAME_SIZE - 1))
      eRms.push(r)
      eHf.push(hf)
      f0s.push(r > 1e-4 ? estimateF0Hz(frame, sampleRate) : null)
      frameStarts.push(start / sampleRate + (FRAME_SIZE / 2) / sampleRate)
    }

    const nFrames = eRms.length
    if (nFrames === 0) {
      return {
        pipelineVersion: PHRASE_ACOUSTIC_PIPELINE_VERSION,
        sampleRate,
        durationSec,
        methodologyLine:
          'Mono decode → short-time RMS + autocorrelation F0 → joint prominence vs this clip’s baseline. Not a medical or emotional assessment.',
        summary: {
          medianF0Hz: null,
          f0MinHz: null,
          f0MaxHz: null,
          voicedFrameFraction: 0,
          medianRms: 0,
          brightnessRatio: 0,
        },
        frameHopSec: hopSec,
        prominenceCurve: [],
        energyCurve: [],
        prominencePeaks: [],
        speechSegments: [],
        wordAlignments: [],
      }
    }

    const voicedF0 = f0s.filter((f): f is number => f != null && f > 0)
    const sortedF0 = [...voicedF0].sort((a, b) => a - b)
    const medianF0 = median(sortedF0)
    const f0Min = sortedF0.length ? sortedF0[0]! : null
    const f0Max = sortedF0.length ? sortedF0[sortedF0.length - 1]! : null

    const sortedRms = [...eRms].sort((a, b) => a - b)
    const medRms = quantile(sortedRms, 0.5) ?? 0

    const brightnessRatios = eRms.map((r, i) => (r > 1e-8 ? eHf[i]! / r : 0))
    const sortedBr = [...brightnessRatios].sort((a, b) => a - b)
    const medBr = quantile(sortedBr, 0.5) ?? 0

    const voicedCount = f0s.filter((f) => f != null).length
    const voicedFrameFraction = voicedCount / nFrames

    const logRms = eRms.map((r) => Math.log1p(r))
    const sortedLog = [...logRms].sort((a, b) => a - b)
    const medLog = quantile(sortedLog, 0.5) ?? 0
    const q75 = quantile(sortedLog, 0.75) ?? medLog
    const spread = Math.max(1e-8, q75 - medLog)

    const midiMedian = medianF0 != null ? hzToMidi(medianF0) : null

    const pitchSemitones: number[] = f0s.map((f) => {
      if (f == null || midiMedian == null) return 0
      return hzToMidi(f) - midiMedian
    })

    const energyEvidence = logRms.map((lr) => (lr - medLog) / spread)
    const pitchPart = pitchSemitones.map((ps) => {
      if (midiMedian == null) return 0
      return ps / 4
    })

    const rawProm: number[] = []
    for (let i = 0; i < nFrames; i++) {
      const e = Math.max(0, energyEvidence[i]!)
      const p = f0s[i] != null ? Math.max(0, pitchPart[i]!) : 0
      rawProm.push(0.55 * e + 0.45 * p)
    }

    const smoothed = smoothMovingAvg(rawProm, PEAK_SMOOTH)
    const sortedSm = [...smoothed].sort((a, b) => a - b)
    const smMed = quantile(sortedSm, 0.5) ?? 0
    const smQ75 = quantile(sortedSm, 0.75) ?? smMed
    const smSpread = Math.max(1e-8, smQ75 - smMed)

    const normProm = smoothed.map((v) => Math.max(0, (v - smMed) / (2.2 * smSpread)))
    const promMax = Math.max(1e-8, ...normProm)
    const prominenceCurveFull = normProm.map((v) => Math.min(1, v / promMax))
    const energyNormFull = eRms.map((r) => Math.min(1, r / (Math.max(1e-8, quantile(sortedRms, 0.99) ?? medRms))))

    const SPARK = 200
    const prominenceCurve = downsampleMax(prominenceCurveFull, SPARK)
    const energyCurve = downsampleMax(energyNormFull, SPARK)

    const thresh = smMed + 0.38 * smSpread
    const minSep = PEAK_MIN_SEP_SEC

    const candidates: { i: number; v: number }[] = []
    for (let i = 2; i < smoothed.length - 2; i++) {
      const v = smoothed[i]!
      if (v < thresh) continue
      if (!(v >= smoothed[i - 1]! && v >= smoothed[i + 1]!)) continue
      if (!(v > smoothed[i - 2]! && v > smoothed[i + 2]!)) continue
      candidates.push({ i, v })
    }
    candidates.sort((a, b) => b.v - a.v)

    const prominencePeaks: PhraseAcousticPeak[] = []
    for (const c of candidates) {
      if (prominencePeaks.length >= MAX_PEAKS) break
      const t = frameStarts[c.i]!
      if (prominencePeaks.some((p) => Math.abs(p.tSec - t) < minSep)) continue
      const score = Math.min(100, Math.round((normProm[c.i]! / promMax) * 100))
      prominencePeaks.push({
        tSec: t,
        score,
        energyEvidence: energyEvidence[c.i]!,
        pitchEvidenceSemitones: pitchSemitones[c.i]!,
      })
    }
    prominencePeaks.sort((a, b) => a.tSec - b.tSec)

    const silenceThresh = Math.max(
      (quantile(sortedRms, 0.14) ?? 0) * 1.55,
      medRms * 0.2,
      1e-5
    )
    let active = eRms.map((r) => r >= silenceThresh)
    active = mergeShortSilentGaps(active, sampleRate)
    const speechSegments = buildSpeechSegments(
      active,
      eRms,
      f0s,
      normProm,
      sampleRate,
      durationSec
    )

    const transcriptWords = options?.transcriptWords?.filter((w) => w.word.trim().length > 0) ?? []
    const wordAlignments =
      transcriptWords.length > 0
        ? buildWordAlignments(transcriptWords, frameStarts, normProm, f0s)
        : []

    const baseMethodology =
      'Mono decode → 40 ms-class frames: RMS, HF emphasis ratio, autocorrelation F0 when voiced. Prominence combines loudness and pitch relative to this clip only. Voiced “segments” are energy-threshold bursts (short internal gaps merged)—scaffolding for production timing, not ASR tokens.'
    const methodologyLine =
      transcriptWords.length > 0
        ? `${baseMethodology} Word timings come from server ASR (Whisper); per-word columns aggregate the same local frame metrics inside each token span—linguistic indexing with acoustic evidence, not a pronunciation score.`
        : baseMethodology

    return {
      pipelineVersion: PHRASE_ACOUSTIC_PIPELINE_VERSION,
      sampleRate,
      durationSec,
      methodologyLine,
      summary: {
        medianF0Hz: medianF0,
        f0MinHz: f0Min,
        f0MaxHz: f0Max,
        voicedFrameFraction,
        medianRms: medRms,
        brightnessRatio: medBr,
      },
      frameHopSec: hopSec,
      prominenceCurve,
      energyCurve,
      prominencePeaks,
      speechSegments,
      wordAlignments,
    }
  } finally {
    await ctx.close().catch(() => undefined)
  }
}

/** Serializable bundle for coaches / journals (Architect-owned record). */
export function exportPhraseReadoutJson(
  report: PhraseAcousticReport,
  meta: {
    channelIndex: number
    notes?: string
    poolDurationSec?: number
    transcriptText?: string | null
    transcriptWords?: PhraseTranscriptWord[] | null
  }
): string {
  return JSON.stringify(
    {
      mindMechanism: true,
      kind: 'phrase_acoustic_readout',
      channel: meta.channelIndex + 1,
      exportedAt: new Date().toISOString(),
      appraisalNotes: meta.notes ?? '',
      poolDurationSec: meta.poolDurationSec,
      transcriptText: meta.transcriptText ?? null,
      transcriptWords: meta.transcriptWords ?? null,
      readout: report,
    },
    null,
    2
  )
}
