'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Play,
  Square,
  Disc3,
  Upload,
  Trash2,
  Circle,
  Download,
  Loader2,
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

export const STEPS = 16
export const TRACKS = 8

const PATTERN_KEY = 'mm-sequencer-pattern-v1'

const TRACK_COLORS = [
  '#c5ab6e',
  '#888888',
  '#e3bb76',
  '#2d5a27',
  '#ae4d28',
  '#d39c7e',
  '#b8e1e2',
  '#3f54ba',
] as const

export type SequencerTrack = {
  steps: boolean[]
  fileName: string | null
  buffer: AudioBuffer | null
}

function emptyTrack(): SequencerTrack {
  return {
    steps: Array.from({ length: STEPS }, () => false),
    fileName: null,
    buffer: null,
  }
}

function loadPersistedPattern(): { bpm: number; stepMasks: boolean[][] | null } {
  if (typeof window === 'undefined') return { bpm: 118, stepMasks: null }
  try {
    const raw = localStorage.getItem(PATTERN_KEY)
    if (!raw) return { bpm: 118, stepMasks: null }
    const o = JSON.parse(raw) as { bpm?: number; tracks?: { steps: boolean[] }[] }
    const bpm =
      typeof o.bpm === 'number' ? Math.max(60, Math.min(180, Math.round(o.bpm))) : 118
    if (!o.tracks || !Array.isArray(o.tracks)) return { bpm, stepMasks: null }
    const masks = o.tracks.map((t) =>
      Array.isArray(t.steps) && t.steps.length === STEPS ? t.steps.map(Boolean) : null
    )
    const stepMasks = masks.every((m) => m) ? (masks as boolean[][]) : null
    return { bpm, stepMasks }
  } catch {
    return { bpm: 118, stepMasks: null }
  }
}

function savePersistedPattern(bpm: number, tracks: SequencerTrack[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      PATTERN_KEY,
      JSON.stringify({
        bpm,
        tracks: tracks.map((t) => ({ steps: t.steps })),
      })
    )
  } catch {
    /* quota */
  }
}

export default function StepSequencer() {
  const [tracks, setTracks] = useState<SequencerTrack[]>(() => {
    const { stepMasks } = loadPersistedPattern()
    return Array.from({ length: TRACKS }, (_, i) => {
      const t = emptyTrack()
      if (stepMasks?.[i]) t.steps = [...stepMasks[i]!]
      return t
    })
  })
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

  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const recDestRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  const tracksRef = useRef(tracks)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recChunksRef = useRef<BlobPart[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const uploadTrackRef = useRef<number | null>(null)

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

  const playHitsAtStep = useCallback((stepIdx: number) => {
    const ctx = ctxRef.current
    const master = masterRef.current
    if (!ctx || !master) return
    const list = tracksRef.current
    for (let t = 0; t < TRACKS; t++) {
      const tr = list[t]
      if (!tr.steps[stepIdx] || !tr.buffer) continue
      const src = ctx.createBufferSource()
      src.buffer = tr.buffer
      const g = ctx.createGain()
      g.gain.value = 0.72
      src.connect(g)
      g.connect(master)
      src.start(0)
    }
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
      void ctxRef.current?.close()
    }
  }, [])

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

  const clearTrackSteps = (track: number) => {
    setTracks((prev) =>
      prev.map((tr, ti) =>
        ti === track ? { ...tr, steps: Array.from({ length: STEPS }, () => false) } : tr
      )
    )
  }

  const clearSample = (track: number) => {
    setTracks((prev) =>
      prev.map((tr, ti) =>
        ti === track ? { ...tr, buffer: null, fileName: null } : tr
      )
    )
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
          i === ti ? { ...tr, buffer: buf, fileName: file.name } : tr
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

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.wav,.mp3,.m4a,.ogg,.webm"
        className="hidden"
        onChange={onFile}
      />

      <Card className="p-4 bg-neutral-950/90 border-neutral-800 text-neutral-100 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={isPlaying ? 'secondary' : 'default'}
              size="sm"
              className="gap-1.5"
              onClick={() => void handlePlayPause()}
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
            <Slider
              value={[bpm]}
              min={60}
              max={180}
              step={1}
              onValueChange={([v]) => setBpm(v)}
              disabled={isPlaying}
            />
            <span className="text-xs tabular-nums text-neutral-400 w-8">{bpm}</span>
          </div>
        </div>
        <p className="text-[10px] text-neutral-500 leading-relaxed">
          Sixteenth-note steps (one bar). Arm record → Play → Stop to capture a loop into{' '}
          <strong className="text-neutral-300">Sound → Your sequencer loops</strong> ({libraryCount}/
          {MAX_COMPOSITIONS}). Step patterns persist; re-import samples after refresh.
        </p>
        {recordingActive && (
          <p className="text-xs text-red-400 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Recording… press Stop to finish.
          </p>
        )}
      </Card>

      <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/80 p-3">
        <div className="min-w-[720px] space-y-1.5">
          <div className="flex gap-1 items-center pl-[7.5rem]">
            {Array.from({ length: STEPS }, (_, s) => (
              <div
                key={s}
                className={cn(
                  'w-8 h-5 rounded text-[9px] font-mono flex items-center justify-center',
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
            <div key={ti} className="flex gap-1.5 items-center">
              <div className="w-[7rem] shrink-0 flex flex-col gap-1 pr-1">
                <div className="flex items-center gap-1">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: TRACK_COLORS[ti] }}
                  />
                  <span className="text-[10px] font-semibold text-neutral-300 truncate max-w-[4.5rem]">
                    P{ti + 1}
                  </span>
                </div>
                <div className="flex gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-neutral-400 hover:text-amber-200"
                    onClick={() => onPickFile(ti)}
                    aria-label={`Import sample track ${ti + 1}`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-neutral-500 hover:text-amber-300"
                    onClick={() => clearTrackSteps(ti)}
                    aria-label={`Clear steps track ${ti + 1}`}
                  >
                    <Disc3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-neutral-500 hover:text-red-400"
                    onClick={() => clearSample(ti)}
                    disabled={!tr.buffer}
                    aria-label={`Remove sample track ${ti + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <span className="text-[8px] text-neutral-600 truncate" title={tr.fileName || ''}>
                  {tr.fileName || '—'}
                </span>
              </div>
              {tr.steps.map((on, si) => (
                <button
                  key={si}
                  type="button"
                  onClick={() => toggleStep(ti, si)}
                  aria-pressed={on}
                  className={cn(
                    'w-8 h-10 rounded-md border transition-colors shrink-0',
                    on
                      ? 'border-transparent shadow-inner'
                      : 'border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800/80'
                  )}
                  style={
                    on
                      ? {
                          backgroundColor: `${TRACK_COLORS[ti]}cc`,
                          boxShadow: `inset 0 0 0 1px ${TRACK_COLORS[ti]}`,
                        }
                      : undefined
                  }
                />
              ))}
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
        Design sounds in{' '}
        <Link href="/synth-lab" className="text-violet-400 hover:underline">
          Synth lab
        </Link>
        ; capture to file externally if needed, then import samples on any pad here.
      </p>
    </div>
  )
}
