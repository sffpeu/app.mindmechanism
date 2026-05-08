'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Play,
  Square,
  Disc3,
  Upload,
  RotateCcw,
  Circle,
  Download,
  Loader2,
  Pause,
  RotateCw,
  Rewind,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Card } from '@/components/ui/card'
import {
  addCompositionFromBlob,
  loadCompositions,
  MAX_COMPOSITIONS,
} from '@/lib/userCompositionsStorage'
import { clockTitles } from '@/lib/clockTitles'
import { MM_DRONE_PATH, MM_DRONE_PLANET_LABELS } from '@/lib/mmDroneTones'

export const STEPS = 16
/** One lane per mandala / wheel (0–8). */
export const TRACKS = 9

const PATTERN_KEY_V2 = 'mm-sequencer-pattern-v2'
const PATTERN_KEY_V1 = 'mm-sequencer-pattern-v1'

/**
 * Each step is a keyed hit (attack + release only, no sustain).
 * Long drone buffers are shaped so lanes behave like pads until curated short samples ship.
 */
const PAD_ATTACK_SEC = 0.007
const PAD_RELEASE_PRESET_SEC = 0.14
const PAD_RELEASE_USER_SEC = 0.2
const PAD_PEAK_PRESET = 0.52
const PAD_PEAK_USER = 0.82
const PAD_SUSTAIN_MIN_MS = 0
const PAD_SUSTAIN_MAX_MS = 420
const PAD_SUSTAIN_DEFAULT_MS = 85
const POOL_RECORD_MS = 10000
const PRACTICE_POOLS = 3

type PhrasePool = {
  blob: Blob | null
  url: string | null
  durationSec: number
  notes: string
}

/** Rough chromatic alignment with planet drones / wheels */
const TRACK_COLORS = [
  '#fd290a',
  '#fba63b',
  '#f7da5f',
  '#6dc037',
  '#156fde',
  '#941952',
  '#541b96',
  '#ee5fa7',
  '#56c1ff',
] as const

export type SequencerTrack = {
  steps: boolean[]
  buffer: AudioBuffer | null
  /** User filename or preset description */
  label: string
  /** Factory drone vs imported sample */
  sampleKind: 'preset' | 'user'
  /** Per-lane pad body in milliseconds */
  sustainMs: number
}

function emptySteps(): boolean[] {
  return Array.from({ length: STEPS }, () => false)
}

/** One hit per wheel, spaced evenly across the bar — immediate audible demo */
function defaultStarterSteps(): boolean[][] {
  return Array.from({ length: TRACKS }, (_, ti) => {
    const hit = Math.round(ti * ((STEPS - 1) / Math.max(1, TRACKS - 1)))
    return Array.from({ length: STEPS }, (_, si) => si === hit)
  })
}

function normalizePersistedTracks(rawTracks: unknown): boolean[][] | null {
  if (!Array.isArray(rawTracks)) return null
  const masks = rawTracks.map((t) => {
    const steps = (t as { steps?: unknown })?.steps
    if (!Array.isArray(steps)) return null
    const row = steps.map(Boolean).slice(0, STEPS)
    while (row.length < STEPS) row.push(false)
    return row as boolean[]
  })
  if (masks.some((m) => !m)) return null
  while (masks.length < TRACKS) masks.push(emptySteps())
  if (masks.length > TRACKS) masks.length = TRACKS
  return masks as boolean[][]
}

function normalizePersistedSustains(rawTracks: unknown): number[] | null {
  if (!Array.isArray(rawTracks)) return null
  const values = rawTracks.map((t) => {
    const raw = (t as { sustainMs?: unknown })?.sustainMs
    const n = typeof raw === 'number' ? raw : PAD_SUSTAIN_DEFAULT_MS
    return Math.max(PAD_SUSTAIN_MIN_MS, Math.min(PAD_SUSTAIN_MAX_MS, Math.round(n)))
  })
  while (values.length < TRACKS) values.push(PAD_SUSTAIN_DEFAULT_MS)
  if (values.length > TRACKS) values.length = TRACKS
  return values
}

function loadPersistedPattern(): { bpm: number; stepMasks: boolean[][] | null; sustainMs: number[] | null } {
  if (typeof window === 'undefined') return { bpm: 118, stepMasks: null, sustainMs: null }
  try {
    for (const key of [PATTERN_KEY_V2, PATTERN_KEY_V1]) {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const o = JSON.parse(raw) as { bpm?: number; tracks?: unknown }
      const bpm =
        typeof o.bpm === 'number' ? Math.max(5, Math.min(120, Math.round(o.bpm))) : 118
      const stepMasks = normalizePersistedTracks(o.tracks)
      const sustainMs = normalizePersistedSustains(o.tracks)
      if (stepMasks) return { bpm, stepMasks, sustainMs }
    }
    return { bpm: 118, stepMasks: null, sustainMs: null }
  } catch {
    return { bpm: 118, stepMasks: null, sustainMs: null }
  }
}

function savePersistedPattern(bpm: number, tracks: SequencerTrack[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      PATTERN_KEY_V2,
      JSON.stringify({
        bpm,
        tracks: tracks.map((t) => ({ steps: t.steps, sustainMs: t.sustainMs })),
      })
    )
  } catch {
    /* quota */
  }
}

function initialTracks(): SequencerTrack[] {
  const { stepMasks, sustainMs } = loadPersistedPattern()
  const starter = stepMasks ?? defaultStarterSteps()
  return Array.from({ length: TRACKS }, (_, i) => ({
    steps: [...starter[i]!],
    buffer: null,
    label: `${MM_DRONE_PLANET_LABELS[i]} · preset`,
    sampleKind: 'preset' as const,
    sustainMs: sustainMs?.[i] ?? PAD_SUSTAIN_DEFAULT_MS,
  }))
}

export default function StepSequencer() {
  const [tracks, setTracks] = useState<SequencerTrack[]>(() => initialTracks())
  const [bpm, setBpm] = useState(() => loadPersistedPattern().bpm)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [armRecord, setArmRecord] = useState(false)
  const [recordingActive, setRecordingActive] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null)
  const [saveBusy, setSaveBusy] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [libraryCount, setLibraryCount] = useState(0)
  const [presetsLoading, setPresetsLoading] = useState(true)
  const [presetError, setPresetError] = useState<string | null>(null)
  const [phraseDuration, setPhraseDuration] = useState(0)
  const [phrasePos, setPhrasePos] = useState(0)
  const [phraseRecActive, setPhraseRecActive] = useState(false)
  const [phraseRecPaused, setPhraseRecPaused] = useState(false)
  const [phrasePlayActive, setPhrasePlayActive] = useState(false)
  const [phraseError, setPhraseError] = useState<string | null>(null)
  const [phraseRate, setPhraseRate] = useState(1)
  const [activePool, setActivePool] = useState(0)
  const [pools, setPools] = useState<PhrasePool[]>(
    Array.from({ length: PRACTICE_POOLS }, () => ({
      blob: null,
      url: null,
      durationSec: 0,
      notes: '',
    }))
  )
  const [recordedMs, setRecordedMs] = useState(0)
  const [lanePreviewTrack, setLanePreviewTrack] = useState<number | null>(null)

  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const recDestRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  const tracksRef = useRef(tracks)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recChunksRef = useRef<BlobPart[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const uploadTrackRef = useRef<number | null>(null)
  const lanePreviewIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lanePreviewTrackRef = useRef<number | null>(null)
  const phraseRecorderRef = useRef<MediaRecorder | null>(null)
  const phraseChunksRef = useRef<BlobPart[]>([])
  const phraseStreamRef = useRef<MediaStream | null>(null)
  const phraseAudioRef = useRef<HTMLAudioElement | null>(null)
  const phraseStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const phraseTickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    tracksRef.current = tracks
  }, [tracks])

  useEffect(() => {
    setLibraryCount(loadCompositions().length)
    const onUpd = () => setLibraryCount(loadCompositions().length)
    window.addEventListener('mm-compositions-updated', onUpd)
    return () => window.removeEventListener('mm-compositions-updated', onUpd)
  }, [])

  useEffect(() => {
    savePersistedPattern(bpm, tracks)
  }, [bpm, tracks])

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      const ctx = new AudioContext()
      const master = ctx.createGain()
      master.gain.value = 0.82
      const recDest = ctx.createMediaStreamDestination()
      master.connect(ctx.destination)
      master.connect(recDest)
      ctxRef.current = ctx
      masterRef.current = master
      recDestRef.current = recDest
    }
    return ctxRef.current!
  }, [])

  const decodePresetDrone = useCallback(
    async (ctx: AudioContext, wheelIndex: number): Promise<AudioBuffer> => {
      const url = MM_DRONE_PATH(wheelIndex)
      const res = await fetch(url)
      if (!res.ok) throw new Error(`${url} ${res.status}`)
      const ab = await res.arrayBuffer()
      return ctx.decodeAudioData(ab.slice(0))
    },
    []
  )

  /** Load nine MM preset drones from public /mm_tones */
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setPresetError(null)
      setPresetsLoading(true)
      try {
        const ctx = ensureCtx()
        await ctx.resume()
        const buffers = await Promise.all(
          Array.from({ length: TRACKS }, (_, i) => decodePresetDrone(ctx, i))
        )
        if (cancelled) return
        setTracks((prev) =>
          prev.map((tr, ti) =>
            tr.sampleKind === 'preset'
              ? {
                  ...tr,
                  buffer: buffers[ti],
                  label: `${MM_DRONE_PLANET_LABELS[ti]} · preset`,
                }
              : tr
          )
        )
      } catch {
        if (!cancelled) setPresetError('Could not load preset drones. Check network or refresh.')
      } finally {
        if (!cancelled) setPresetsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [decodePresetDrone, ensureCtx])

  const playHitsAtStep = useCallback((stepIdx: number) => {
    const ctx = ctxRef.current
    const master = masterRef.current
    if (!ctx || !master) return
    const list = tracksRef.current
    const now = ctx.currentTime
    for (let t = 0; t < TRACKS; t++) {
      const tr = list[t]
      if (!tr.steps[stepIdx] || !tr.buffer) continue
      const src = ctx.createBufferSource()
      src.buffer = tr.buffer
      const g = ctx.createGain()
      const peak = tr.sampleKind === 'preset' ? PAD_PEAK_PRESET : PAD_PEAK_USER
      const releaseSec =
        tr.sampleKind === 'preset' ? PAD_RELEASE_PRESET_SEC : PAD_RELEASE_USER_SEC
      const a = PAD_ATTACK_SEC
      const sustainSec = tr.sustainMs / 1000
      const releaseStart = now + a + sustainSec
      const releaseEnd = releaseStart + releaseSec

      g.gain.setValueAtTime(0, now)
      g.gain.linearRampToValueAtTime(peak, now + a)
      g.gain.setValueAtTime(peak, releaseStart)
      g.gain.exponentialRampToValueAtTime(0.0001, releaseEnd)

      src.connect(g)
      g.connect(master)

      const stopAt = now + Math.min(tr.buffer.duration, releaseEnd + 0.04)
      src.start(now)
      src.stop(stopAt)
    }
  }, [])

  const playHitForTrackStep = useCallback((trackIndex: number, stepIdx: number) => {
    const ctx = ctxRef.current
    const master = masterRef.current
    if (!ctx || !master) return
    const tr = tracksRef.current[trackIndex]
    if (!tr || !tr.steps[stepIdx] || !tr.buffer) return
    const now = ctx.currentTime
    const src = ctx.createBufferSource()
    src.buffer = tr.buffer
    const g = ctx.createGain()
    const peak = tr.sampleKind === 'preset' ? PAD_PEAK_PRESET : PAD_PEAK_USER
    const releaseSec =
      tr.sampleKind === 'preset' ? PAD_RELEASE_PRESET_SEC : PAD_RELEASE_USER_SEC
    const a = PAD_ATTACK_SEC
    const sustainSec = tr.sustainMs / 1000
    const releaseStart = now + a + sustainSec
    const releaseEnd = releaseStart + releaseSec

    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(peak, now + a)
    g.gain.setValueAtTime(peak, releaseStart)
    g.gain.exponentialRampToValueAtTime(0.0001, releaseEnd)
    src.connect(g)
    g.connect(master)
    src.start(now)
    src.stop(now + Math.min(tr.buffer.duration, a + sustainSec + releaseSec + 0.04))
  }, [])

  const stopTransport = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPlaying(false)
    setCurrentStep(0)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setRecordingActive(false)
    }
  }, [])

  const startTransport = useCallback(async () => {
    const ctx = ensureCtx()
    await ctx.resume()

    if (intervalRef.current) clearInterval(intervalRef.current)

    const stepMs = ((60 / bpm) / 4) * 1000
    setCurrentStep(0)
    playHitsAtStep(0)

    if (armRecord && recDestRef.current) {
      recChunksRef.current = []
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : ''
      try {
        const mr = mime
          ? new MediaRecorder(recDestRef.current.stream, { mimeType: mime })
          : new MediaRecorder(recDestRef.current.stream)
        mr.ondataavailable = (e) => {
          if (e.data.size > 0) recChunksRef.current.push(e.data)
        }
        mr.onstop = () => {
          const blob = new Blob(recChunksRef.current, { type: mr.mimeType || 'audio/webm' })
          setPendingBlob(blob)
          setArmRecord(false)
        }
        mr.start(250)
        mediaRecorderRef.current = mr
        setRecordingActive(true)
      } catch {
        setRecordingActive(false)
        mediaRecorderRef.current = null
      }
    }

    setIsPlaying(true)
    let s = 0
    intervalRef.current = setInterval(() => {
      s = (s + 1) % STEPS
      setCurrentStep(s)
      playHitsAtStep(s)
    }, stepMs)
  }, [armRecord, bpm, ensureCtx, playHitsAtStep])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (lanePreviewIntervalRef.current) clearInterval(lanePreviewIntervalRef.current)
      if (phraseStopTimerRef.current) clearTimeout(phraseStopTimerRef.current)
      if (phraseTickRef.current) clearInterval(phraseTickRef.current)
      if (phraseRecorderRef.current && phraseRecorderRef.current.state !== 'inactive') {
        phraseRecorderRef.current.stop()
      }
      phraseStreamRef.current?.getTracks().forEach((t) => t.stop())
      pools.forEach((p) => {
        if (p.url) URL.revokeObjectURL(p.url)
      })
      void ctxRef.current?.close()
    }
  }, [pools])

  const stopLanePreview = useCallback(() => {
    if (lanePreviewIntervalRef.current) {
      clearInterval(lanePreviewIntervalRef.current)
      lanePreviewIntervalRef.current = null
    }
    lanePreviewTrackRef.current = null
    setLanePreviewTrack(null)
  }, [])

  const startLanePreview = useCallback(
    async (trackIndex: number) => {
      const ctx = ensureCtx()
      await ctx.resume()
      if (lanePreviewTrackRef.current === trackIndex && lanePreviewIntervalRef.current) return
      stopLanePreview()
      lanePreviewTrackRef.current = trackIndex
      setLanePreviewTrack(trackIndex)
      const stepMs = ((60 / bpm) / 4) * 1000
      let s = 0
      setCurrentStep(0)
      playHitForTrackStep(trackIndex, 0)
      lanePreviewIntervalRef.current = setInterval(() => {
        s = (s + 1) % STEPS
        setCurrentStep(s)
        playHitForTrackStep(trackIndex, s)
      }, stepMs)
    },
    [bpm, ensureCtx, playHitForTrackStep, stopLanePreview]
  )

  const stopPhrasePlayback = useCallback(() => {
    const audio = phraseAudioRef.current
    if (!audio) return
    audio.pause()
    setPhrasePlayActive(false)
  }, [])

  const finalizePhrasePool = useCallback(() => {
    if (phraseStopTimerRef.current) {
      clearTimeout(phraseStopTimerRef.current)
      phraseStopTimerRef.current = null
    }
    if (phraseTickRef.current) {
      clearInterval(phraseTickRef.current)
      phraseTickRef.current = null
    }
    const recorder = phraseRecorderRef.current
    if (recorder && recorder.state !== 'inactive') recorder.stop()
    setPhraseRecActive(false)
    setPhraseRecPaused(false)
  }, [])

  const startOrResumePhraseRecord = useCallback(async () => {
    setPhraseError(null)
    stopPhrasePlayback()
    const currentPool = pools[activePool]
    const currentMs = Math.round(currentPool.durationSec * 1000)
    if (currentMs >= POOL_RECORD_MS) {
      setPhraseError('This pool is full (10s). Switch pool or reset.')
      return
    }

    const existing = phraseRecorderRef.current
    if (existing && existing.state === 'paused') {
      existing.resume()
      setPhraseRecPaused(false)
      setPhraseRecActive(true)
      return
    }
    if (existing && existing.state === 'recording') return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      phraseStreamRef.current = stream
      phraseChunksRef.current = []
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : ''
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      phraseRecorderRef.current = recorder
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) phraseChunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(phraseChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        const url = URL.createObjectURL(blob)
        setPools((prev) =>
          prev.map((pool, idx) => {
            if (idx !== activePool) return pool
            if (pool.url) URL.revokeObjectURL(pool.url)
            return {
              ...pool,
              blob,
              url,
              durationSec: Math.min(POOL_RECORD_MS / 1000, recordedMs / 1000),
            }
          })
        )
        setPhrasePos(0)
        setPhraseDuration(Math.min(POOL_RECORD_MS / 1000, recordedMs / 1000))
        setPhraseRecActive(false)
        setPhraseRecPaused(false)
        const audio = phraseAudioRef.current
        if (audio) {
          audio.src = url
          audio.currentTime = 0
          audio.onloadedmetadata = () => {
            setPhraseDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
          }
        }
        phraseStreamRef.current?.getTracks().forEach((t) => t.stop())
        phraseStreamRef.current = null
        phraseRecorderRef.current = null
      }
      recorder.start(120)
      setPhraseRecActive(true)
      setPhraseRecPaused(false)
      setRecordedMs(currentMs)
      if (phraseTickRef.current) clearInterval(phraseTickRef.current)
      phraseTickRef.current = setInterval(() => {
        setRecordedMs((prev) => {
          const next = Math.min(POOL_RECORD_MS, prev + 100)
          if (next >= POOL_RECORD_MS) {
            finalizePhrasePool()
          }
          return next
        })
      }, 100)
    } catch {
      setPhraseRecActive(false)
      setPhraseError('Microphone access is required to capture a phrase.')
    }
  }, [activePool, finalizePhrasePool, pools, recordedMs, stopPhrasePlayback])

  const pausePhraseRecord = useCallback(() => {
    const recorder = phraseRecorderRef.current
    if (!recorder || recorder.state !== 'recording') return
    recorder.pause()
    setPhraseRecPaused(true)
    if (phraseTickRef.current) {
      clearInterval(phraseTickRef.current)
      phraseTickRef.current = null
    }
  }, [])

  const togglePhrasePlayback = useCallback(async () => {
    const audio = phraseAudioRef.current
    if (!audio || !pools[activePool]?.blob) return
    if (phrasePlayActive) {
      audio.pause()
      setPhrasePlayActive(false)
      return
    }
    try {
      audio.playbackRate = phraseRate
      await audio.play()
      setPhrasePlayActive(true)
    } catch {
      setPhrasePlayActive(false)
    }
  }, [activePool, phrasePlayActive, phraseRate, pools])

  const jogPhrase = useCallback((nextSec: number) => {
    const audio = phraseAudioRef.current
    if (!audio) return
    const max = phraseDuration > 0 ? phraseDuration : POOL_RECORD_MS / 1000
    const clamped = Math.max(0, Math.min(max, nextSec))
    audio.currentTime = clamped
    setPhrasePos(clamped)
  }, [phraseDuration])

  const resetPhrase = useCallback(() => {
    stopPhrasePlayback()
    jogPhrase(0)
  }, [jogPhrase, stopPhrasePlayback])

  useEffect(() => {
    const audio = phraseAudioRef.current
    if (!audio) return
    const onTime = () => setPhrasePos(audio.currentTime || 0)
    const onEnded = () => setPhrasePlayActive(false)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('ended', onEnded)
    }
  }, [activePool, pools])

  useEffect(() => {
    const pool = pools[activePool]
    if (!pool?.url) return
    const audio = phraseAudioRef.current
    if (!audio) return
    audio.src = pool.url
    audio.currentTime = 0
    audio.playbackRate = phraseRate
    setPhrasePos(0)
    setPhraseDuration(pool.durationSec || 0)
    setRecordedMs(Math.round((pool.durationSec || 0) * 1000))
  }, [activePool, pools, phraseRate])

  useEffect(() => {
    const audio = phraseAudioRef.current
    if (!audio) return
    audio.playbackRate = phraseRate
  }, [phraseRate])

  const playAllPoolsTogether = useCallback(async () => {
    const active = pools.filter((p) => p.url)
    if (!active.length) return
    try {
      await Promise.all(
        active.map(async (p) => {
          const a = new Audio(p.url!)
          a.playbackRate = phraseRate
          await a.play()
        })
      )
    } catch {
      setPhraseError('Could not play all pools at once on this browser.')
    }
  }, [phraseRate, pools])

  const resetActivePool = useCallback(() => {
    const pool = pools[activePool]
    if (pool?.url) URL.revokeObjectURL(pool.url)
    setPools((prev) =>
      prev.map((p, i) =>
        i === activePool ? { blob: null, url: null, durationSec: 0, notes: '' } : p
      )
    )
    setPhrasePos(0)
    setPhraseDuration(0)
    setRecordedMs(0)
  }, [activePool, pools])

  const toggleStep = (track: number, step: number) => {
    setTracks((prev) =>
      prev.map((tr, ti) =>
        ti === track
          ? {
              ...tr,
              steps: tr.steps.map((on, si) => (si === step ? !on : on)),
            }
          : tr
      )
    )
  }

  const setTrackSustainMs = (track: number, value: number) => {
    const next = Math.max(PAD_SUSTAIN_MIN_MS, Math.min(PAD_SUSTAIN_MAX_MS, Math.round(value)))
    setTracks((prev) =>
      prev.map((tr, ti) => (ti === track ? { ...tr, sustainMs: next } : tr))
    )
  }

  const clearTrackSteps = (track: number) => {
    setTracks((prev) =>
      prev.map((tr, ti) =>
        ti === track ? { ...tr, steps: emptySteps() } : tr
      )
    )
  }

  const restorePreset = async (trackIndex: number) => {
    try {
      const ctx = ensureCtx()
      await ctx.resume()
      const buf = await decodePresetDrone(ctx, trackIndex)
      setTracks((prev) =>
        prev.map((tr, ti) =>
          ti === trackIndex
            ? {
                ...tr,
                buffer: buf,
                label: `${MM_DRONE_PLANET_LABELS[ti]} · preset`,
                sampleKind: 'preset',
              }
            : tr
        )
      )
    } catch {
      setPresetError(
        `Could not reload preset for wheel ${trackIndex + 1}.`
      )
    }
  }

  const onPickFile = (trackIndex: number) => {
    uploadTrackRef.current = trackIndex
    fileInputRef.current?.click()
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    const ti = uploadTrackRef.current
    if (!file || ti == null) return
    try {
      const ctx = ensureCtx()
      await ctx.resume()
      const ab = await file.arrayBuffer()
      const buf = await ctx.decodeAudioData(ab.slice(0))
      setTracks((prev) =>
        prev.map((tr, i) =>
          i === ti ? { ...tr, buffer: buf, label: file.name, sampleKind: 'user' } : tr
        )
      )
    } catch {
      /* decode failed */
    }
  }

  const handlePlayPause = async () => {
    if (isPlaying) {
      stopTransport()
      return
    }
    await startTransport()
  }

  const handleSaveRecording = async () => {
    if (!pendingBlob) return
    setSaveBusy(true)
    setSaveMsg(null)
    const r = await addCompositionFromBlob(
      saveName || `Loop ${new Date().toLocaleString()}`,
      pendingBlob
    )
    setSaveBusy(false)
    if (r.ok) {
      setPendingBlob(null)
      setSaveName('')
      setSaveMsg('Saved — open Sound settings → Your sequencer loops.')
      setLibraryCount(loadCompositions().length)
    } else {
      setSaveMsg(r.error)
    }
  }

  const discardPending = () => {
    setPendingBlob(null)
    setSaveName('')
    setSaveMsg(null)
  }

  const downloadPending = () => {
    if (!pendingBlob) return
    const u = URL.createObjectURL(pendingBlob)
    const a = document.createElement('a')
    a.href = u
    a.download = `${(saveName || 'mm-loop').replace(/[/\\]/g, '-')}.webm`
    a.click()
    URL.revokeObjectURL(u)
  }

  const railW = 'w-[16.5rem]'

  return (
    <div className="space-y-6">
      <audio ref={phraseAudioRef} className="hidden" preload="metadata" />
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.wav,.mp3,.m4a,.ogg,.webm"
        className="hidden"
        onChange={onFile}
      />

      <Card className="p-4 bg-neutral-950/90 border-neutral-800 text-neutral-100 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">Phrase analyzer tape</p>
            <p className="text-xs text-neutral-400 mt-1">
              Three practitioner pools. Each pool records up to <strong className="text-neutral-200">10 seconds</strong> with pause/resume fill, then compare for pronunciation precision.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-neutral-700/80 bg-neutral-900/70 p-1">
              {pools.map((pool, i) => (
                <Button
                  key={i}
                  type="button"
                  size="sm"
                  variant={activePool === i ? 'secondary' : 'ghost'}
                  className="h-7 px-2 text-[10px]"
                  onClick={() => setActivePool(i)}
                >
                  P{i + 1} {pool.durationSec > 0 ? `${pool.durationSec.toFixed(1)}s` : ''}
                </Button>
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              variant={phraseRecActive ? 'destructive' : 'outline'}
              className="gap-1.5 border-neutral-700"
              onClick={() => void startOrResumePhraseRecord()}
            >
              <Circle className={cn('h-3.5 w-3.5', phraseRecActive && 'fill-red-500 text-red-500')} />
              {phraseRecActive ? 'Recording...' : phraseRecPaused ? 'Resume' : 'Record'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5 border-neutral-700"
              onClick={pausePhraseRecord}
              disabled={!phraseRecActive}
            >
              <Pause className="h-3.5 w-3.5" />
              Pause
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5 border-neutral-700"
              onClick={finalizePhrasePool}
              disabled={!phraseRecActive && !phraseRecPaused}
            >
              <Square className="h-3.5 w-3.5" />
              Finish pool
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5 border-neutral-700"
              onClick={() => void togglePhrasePlayback()}
              disabled={!pools[activePool]?.blob}
            >
              {phrasePlayActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {phrasePlayActive ? 'Pause' : 'Play'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="gap-1 text-neutral-300"
              onClick={resetPhrase}
              disabled={!pools[activePool]?.blob}
            >
              <Rewind className="h-3.5 w-3.5" />
              Zero
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="gap-1 text-neutral-300"
              onClick={playAllPoolsTogether}
              disabled={!pools.some((p) => p.blob)}
            >
              <Disc3 className="h-3.5 w-3.5" />
              Play all 3
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-[10px] uppercase tracking-widest text-neutral-500 shrink-0">
            Playback speed
          </Label>
          <Slider
            value={[phraseRate]}
            min={0.1}
            max={2}
            step={0.05}
            onValueChange={([v]) => setPhraseRate(v)}
            className="max-w-sm"
          />
          <span className="text-xs tabular-nums text-neutral-400 w-12">{phraseRate.toFixed(2)}x</span>
        </div>
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-3">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 rounded-full border border-neutral-700 bg-neutral-950 shadow-inner">
              <div
                className="absolute inset-2 rounded-full border border-neutral-800 bg-neutral-900"
                style={{
                  transform: `rotate(${(phrasePos / Math.max(0.001, phraseDuration || POOL_RECORD_MS / 1000)) * 720}deg)`,
                }}
              />
              <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-500" />
            </div>
            <div className="flex-1">
              <div className="mb-2 h-2 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-amber-400/80"
                  style={{
                    width: `${Math.min(
                      100,
                      (phrasePos / Math.max(0.001, phraseDuration || POOL_RECORD_MS / 1000)) * 100
                    )}%`,
                  }}
                />
              </div>
              <Slider
                value={[phrasePos]}
                min={0}
                max={Math.max(phraseDuration || POOL_RECORD_MS / 1000, 0.1)}
                step={0.01}
                onValueChange={([v]) => jogPhrase(v)}
                disabled={!pools[activePool]?.blob}
              />
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-neutral-500">
                <span>Tape jog</span>
                <span className="tabular-nums">
                  {phrasePos.toFixed(2)}s / {(phraseDuration || POOL_RECORD_MS / 1000).toFixed(2)}s
                </span>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="gap-1 text-neutral-300"
              onClick={() => jogPhrase(phrasePos + 0.1)}
              disabled={!pools[activePool]?.blob}
            >
              <RotateCw className="h-3.5 w-3.5" />
              +0.1s
            </Button>
          </div>
          <div className="mt-3 space-y-1">
            <Label className="text-[10px] uppercase tracking-widest text-neutral-500">
              Pool {activePool + 1} appraisal notes
            </Label>
            <Input
              value={pools[activePool]?.notes || ''}
              onChange={(e) =>
                setPools((prev) =>
                  prev.map((p, i) => (i === activePool ? { ...p, notes: e.target.value } : p))
                )
              }
              placeholder="Mark pronunciation misses, tonal drift, consonant failures..."
              className="bg-neutral-950 border-neutral-700"
            />
          </div>
          <div className="mt-2 flex gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={resetActivePool}>
              Reset pool {activePool + 1}
            </Button>
          </div>
        </div>
        {phraseError && <p className="text-xs text-red-400">{phraseError}</p>}
      </Card>

      <Card className="p-4 bg-neutral-950/90 border-neutral-800 text-neutral-100 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={isPlaying ? 'secondary' : 'default'}
              size="sm"
              className="gap-1.5"
              onClick={() => void handlePlayPause()}
              disabled={presetsLoading && !tracks.some((t) => t.buffer)}
            >
              {isPlaying ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isPlaying ? 'Stop' : 'Play'}
            </Button>
            <Button
              type="button"
              variant={armRecord ? 'destructive' : 'outline'}
              size="sm"
              className="gap-1.5 border-neutral-600"
              disabled={recordingActive}
              onClick={() => setArmRecord((a) => !a)}
            >
              <Circle
                className={cn('h-3.5 w-3.5', armRecord && 'fill-red-500 text-red-500')}
              />
              {armRecord ? 'Recording armed' : 'Arm record'}
            </Button>
          </div>
          <div className="flex items-center gap-3 min-w-[160px] flex-1 max-w-xs">
            <Label className="text-[10px] uppercase tracking-widest text-neutral-500 shrink-0">
              BPM
            </Label>
            <Slider value={[bpm]} min={5} max={120} step={1} onValueChange={([v]) => setBpm(v)} disabled={isPlaying} />
            <span className="text-xs tabular-nums text-neutral-400 w-8">{bpm}</span>
          </div>
        </div>
        <p className="text-[10px] text-neutral-500 leading-relaxed">
          Nine lanes match the nine wheels — each loads an MM planet drone preset so you can hit{' '}
          <strong className="text-neutral-300">Play</strong> immediately. Each step fires{' '}
          <strong className="text-neutral-300">attack → sustain (per lane) → release</strong>; keep sustain near zero for key-like taps
          or lift it slightly for pad feel while avoiding full drone hang. Replace lanes with your own clips when you like; patterns
          persist.
        </p>
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          {presetsLoading && (
            <span className="flex items-center gap-1.5 text-amber-200/90">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading preset drones…
            </span>
          )}
          {presetError && <span className="text-red-400">{presetError}</span>}
        </div>
        {recordingActive && (
          <p className="text-xs text-red-400 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Recording… press Stop to finish.
          </p>
        )}
      </Card>

      <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/80 p-3">
        <div className="min-w-[980px] space-y-2">
          <div className={cn('flex gap-1 items-center', `pl-[16.5rem]`)}>
            {Array.from({ length: STEPS }, (_, s) => (
              <div
                key={s}
                className={cn(
                  'w-7 h-5 rounded text-[10px] font-mono flex items-center justify-center border border-transparent',
                  currentStep === s && isPlaying
                    ? 'bg-amber-500/30 text-amber-200'
                    : 'text-neutral-600'
                )}
              >
                {s + 1}
              </div>
            ))}
          </div>
          {tracks.map((tr, ti) => (
            <div
              key={ti}
              className={cn(
                'flex gap-2 items-stretch rounded-lg border border-neutral-800/80 bg-neutral-900/45',
                currentStep >= 0 && isPlaying && tr.steps[currentStep]
                  ? 'ring-1 ring-amber-500/30 border-amber-700/40'
                  : ''
              )}
            >
              <div className={cn(railW, 'shrink-0 flex flex-col gap-1.5 p-2 border-r border-neutral-800')}>
                <div className="flex items-start gap-2">
                  <span
                    className="h-3 w-3 rounded-full shrink-0 mt-1"
                    style={{ backgroundColor: TRACK_COLORS[ti] }}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider leading-none block">
                      W{ti + 1}
                    </span>
                    <p className="text-[13px] font-semibold text-neutral-100 leading-snug">
                      {clockTitles[ti]}
                    </p>
                    <p className="text-[11px] text-neutral-400 leading-tight truncate" title={tr.label}>
                      {MM_DRONE_PLANET_LABELS[ti]} · {tr.label}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-neutral-300 hover:text-violet-300"
                    aria-label={`Preview wheel ${ti + 1} while held`}
                    onMouseDown={() => void startLanePreview(ti)}
                    onMouseUp={stopLanePreview}
                    onMouseLeave={stopLanePreview}
                    onTouchStart={() => void startLanePreview(ti)}
                    onTouchEnd={stopLanePreview}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-neutral-400 hover:text-amber-200"
                    onClick={() => onPickFile(ti)}
                    aria-label={`Import sample wheel ${ti + 1}`}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-neutral-500 hover:text-amber-300"
                    onClick={() => clearTrackSteps(ti)}
                    aria-label={`Clear steps wheel ${ti + 1}`}
                  >
                    <Disc3 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-neutral-500 hover:text-emerald-400"
                    onClick={() => void restorePreset(ti)}
                    aria-label={`Restore preset drone wheel ${ti + 1}`}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <span className="text-[9px] uppercase tracking-widest text-neutral-500 ml-1">Sustain</span>
                </div>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[tr.sustainMs]}
                    min={PAD_SUSTAIN_MIN_MS}
                    max={PAD_SUSTAIN_MAX_MS}
                    step={5}
                    onValueChange={([v]) => setTrackSustainMs(ti, v)}
                  />
                  <span className="text-[10px] text-neutral-300 tabular-nums w-12">{tr.sustainMs}ms</span>
                </div>
              </div>
              <div className="flex items-center gap-1 px-2">
                {tr.steps.map((on, si) => {
                  const traveling =
                    currentStep === si &&
                    (isPlaying || lanePreviewTrack === ti)
                  return (
                  <button
                    key={si}
                    type="button"
                    onClick={() => toggleStep(ti, si)}
                    aria-pressed={on}
                    className={cn(
                      'w-7 h-8 rounded-md border transition-colors shrink-0',
                      traveling && !on ? 'border-white/40 bg-white/10' : '',
                      traveling && on ? 'ring-2 ring-white/45 ring-offset-0 brightness-125' : '',
                      on
                        ? 'border-transparent shadow-inner'
                        : 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800/80'
                    )}
                    style={
                      on
                        ? {
                            backgroundColor: traveling
                              ? TRACK_COLORS[ti]
                              : `${TRACK_COLORS[ti]}59`,
                            boxShadow: traveling
                              ? `inset 0 0 0 1px ${TRACK_COLORS[ti]}, 0 0 12px ${TRACK_COLORS[ti]}aa`
                              : `inset 0 0 0 1px ${TRACK_COLORS[ti]}99`,
                          }
                        : undefined
                    }
                  />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {pendingBlob && (
        <Card className="p-4 border-amber-900/50 bg-amber-950/20 space-y-3">
          <p className="text-sm font-medium text-amber-100">Recording ready</p>
          <p className="text-xs text-amber-100/70">
            Save to your Sound library or download the file.
          </p>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[200px] space-y-1">
              <Label className="text-[10px] text-amber-200/80">Name</Label>
              <Input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Morning haze loop"
                className="bg-neutral-950 border-amber-900/40"
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleSaveRecording()}
              disabled={saveBusy}
              className="gap-1.5"
            >
              {saveBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Save to Sound panel
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={downloadPending} className="gap-1">
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={discardPending}>
              Discard
            </Button>
          </div>
          {saveMsg && <p className="text-xs text-amber-200/90">{saveMsg}</p>}
        </Card>
      )}

      <p className="text-[11px] text-neutral-500">
        Design sustained tones in{' '}
        <Link href="/synth-lab" className="text-violet-400 hover:underline">
          Synth lab
        </Link>
        ; bounce or capture audio, then import on the matching wheel. These layers sit under the same symbolic map as
        timed practice — rhythm here is composition homework, not distraction.
      </p>
    </div>
  )
}
