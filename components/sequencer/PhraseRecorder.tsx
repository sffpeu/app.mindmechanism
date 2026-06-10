'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Play,
  Square,
  Circle,
  Download,
  Loader2,
  Pause,
  RotateCw,
  Rewind,
  Activity,
  ClipboardCopy,
  Mic2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Card } from '@/components/ui/card'
import {
  analyzePhraseBlob,
  exportPhraseReadoutJson,
  type PhraseAcousticReport,
  type PhraseTranscriptWord,
} from '@/lib/phraseAcousticAnalysis'
import { transcribePhraseBlob } from '@/lib/phraseTranscribeClient'
import { MANDALA_NODES } from '@/data/mandalaNodes'
import { getAllWords } from '@/lib/glossary'
import { saveVoiceNote, type VoiceNoteTarget } from '@/lib/voiceNoteStorage'
import type { GlossaryWord } from '@/types/Glossary'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { useEffectiveNodeTier } from '@/lib/useEffectiveNodeTier'
import { filterGlossaryWordsByTier } from '@/lib/nodeTiers'
import { WHEEL_HEX } from '@/lib/wheelColors'

const POOL_RECORD_MS = 10000
const PRACTICE_POOLS = 3
const POOL_COLORS = [WHEEL_HEX[0], WHEEL_HEX[4], WHEEL_HEX[7]] as const

function sparkPolylinePoints(curve: number[], width: number, height: number): string {
  if (!curve.length) return ''
  return curve
    .map((v, i) => {
      const x = (i / Math.max(1, curve.length - 1)) * width
      const y = height - 2 - v * (height - 4)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

type PhrasePool = {
  blob: Blob | null
  url: string | null
  durationSec: number
  notes: string
  acousticReadout?: PhraseAcousticReport | null
  acousticReadoutError?: string | null
  transcriptWords?: PhraseTranscriptWord[] | null
  transcriptText?: string | null
  transcriptLanguage?: string | null
  transcribeError?: string | null
}

type PhraseRecorderProps = {
  mantraText?: string
  onPoolFinished?: (payload: { poolIndex: number; blob: Blob; durationSec: number; notes: string }) => void
}

export default function PhraseRecorder({ mantraText, onPoolFinished }: PhraseRecorderProps = {}) {
  const { user } = useAuth()
  const nodeTier = useEffectiveNodeTier()

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
  const [phraseReadoutBusy, setPhraseReadoutBusy] = useState(false)
  const [phraseTranscribeBusy, setPhraseTranscribeBusy] = useState(false)
  const [readoutExportMsg, setReadoutExportMsg] = useState<string | null>(null)
  const [referenceTarget, setReferenceTarget] = useState('')
  const [listeningCue, setListeningCue] = useState('')
  const [attachOpen, setAttachOpen] = useState(false)
  const [attachTab, setAttachTab] = useState<'deck-card' | 'glossary'>('deck-card')
  const [attachSearch, setAttachSearch] = useState('')
  const [attachLabel, setAttachLabel] = useState('')
  const [attachSaving, setAttachSaving] = useState(false)
  const [attachMsg, setAttachMsg] = useState<string | null>(null)
  const [attachGlossaryWords, setAttachGlossaryWords] = useState<GlossaryWord[]>([])
  const [selectedTarget, setSelectedTarget] = useState<VoiceNoteTarget | null>(null)

  const phraseRecorderRef = useRef<MediaRecorder | null>(null)
  const phraseChunksRef = useRef<BlobPart[]>([])
  const phraseStreamRef = useRef<MediaStream | null>(null)
  const phraseAudioRef = useRef<HTMLAudioElement | null>(null)
  const phraseStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const phraseTickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recordedMsRef = useRef(0)

  useEffect(() => {
    recordedMsRef.current = recordedMs
  }, [recordedMs])

  useEffect(() => {
    setReadoutExportMsg(null)
  }, [activePool])

  useEffect(() => {
    if (!attachOpen || attachTab !== 'glossary') return
    let active = true
    void getAllWords().then((rows) => {
      if (active) setAttachGlossaryWords(filterGlossaryWordsByTier(rows, nodeTier, user?.uid))
    })
    return () => { active = false }
  }, [attachOpen, attachTab, nodeTier, user?.uid])

  useEffect(() => {
    return () => {
      if (phraseStopTimerRef.current) clearTimeout(phraseStopTimerRef.current)
      if (phraseTickRef.current) clearInterval(phraseTickRef.current)
      if (phraseRecorderRef.current && phraseRecorderRef.current.state !== 'inactive') {
        phraseRecorderRef.current.stop()
      }
      phraseStreamRef.current?.getTracks().forEach((t) => t.stop())
      pools.forEach((p) => {
        if (p.url) URL.revokeObjectURL(p.url)
      })
    }
  }, [pools])

  const stopPhrasePlayback = useCallback(() => {
    const audio = phraseAudioRef.current
    if (!audio) return
    audio.pause()
    setPhrasePlayActive(false)
  }, [])

  const finalizePhrasePool = useCallback(() => {
    setPhraseError(null)
    if (phraseStopTimerRef.current) {
      clearTimeout(phraseStopTimerRef.current)
      phraseStopTimerRef.current = null
    }
    if (phraseTickRef.current) {
      clearInterval(phraseTickRef.current)
      phraseTickRef.current = null
    }
    const recorder = phraseRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      try {
        if (recorder.state === 'paused') recorder.resume()
        if (typeof recorder.requestData === 'function') recorder.requestData()
      } catch { /* ignore */ }
      try {
        recorder.stop()
      } catch {
        setPhraseError('Could not finish recording. Try Record again.')
      }
    }
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
        const blob = new Blob(phraseChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        const url = URL.createObjectURL(blob)
        const nextDurationSec = Math.min(POOL_RECORD_MS / 1000, recordedMsRef.current / 1000)
        const poolNotes = pools[activePool]?.notes ?? ''
        setPools((prev) =>
          prev.map((pool, idx) => {
            if (idx !== activePool) return pool
            if (pool.url) URL.revokeObjectURL(pool.url)
            return {
              ...pool,
              blob,
              url,
              durationSec: nextDurationSec,
              acousticReadout: null,
              acousticReadoutError: null,
              transcriptWords: null,
              transcriptText: null,
              transcriptLanguage: null,
              transcribeError: null,
            }
          })
        )
        onPoolFinished?.({ poolIndex: activePool, blob, durationSec: nextDurationSec, notes: poolNotes })
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
          recordedMsRef.current = next
          if (next >= POOL_RECORD_MS) finalizePhrasePool()
          return next
        })
      }, 100)
    } catch {
      setPhraseRecActive(false)
      setPhraseError('Microphone access is required to capture a phrase.')
    }
  }, [activePool, finalizePhrasePool, onPoolFinished, pools, recordedMs, stopPhrasePlayback])

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
      audio.volume = 1
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

  const runAcousticReadout = useCallback(async () => {
    const blob = pools[activePool]?.blob
    if (!blob) return
    const ap = activePool
    setReadoutExportMsg(null)
    setPhraseReadoutBusy(true)
    setPools((prev) => prev.map((p, i) => (i === ap ? { ...p, acousticReadoutError: null } : p)))
    try {
      const tw = pools[activePool]?.transcriptWords
      const report = await analyzePhraseBlob(blob, { transcriptWords: tw && tw.length > 0 ? tw : undefined })
      setPools((prev) => prev.map((p, i) => (i === ap ? { ...p, acousticReadout: report, acousticReadoutError: null } : p)))
    } catch {
      setPools((prev) =>
        prev.map((p, i) =>
          i === ap
            ? { ...p, acousticReadout: null, acousticReadoutError: 'Readout failed while decoding this take. Try again, or record a shorter clip.' }
            : p
        )
      )
    } finally {
      setPhraseReadoutBusy(false)
    }
  }, [activePool, pools])

  const runServerTranscribeAndAlign = useCallback(async () => {
    const blob = pools[activePool]?.blob
    if (!blob) return
    const ap = activePool
    setReadoutExportMsg(null)
    setPhraseTranscribeBusy(true)
    setPools((prev) => prev.map((p, i) => (i === ap ? { ...p, transcribeError: null } : p)))
    try {
      const { words, text, language } = await transcribePhraseBlob(blob)
      setPools((prev) =>
        prev.map((p, i) =>
          i === ap ? { ...p, transcriptWords: words, transcriptText: text, transcriptLanguage: language, transcribeError: null } : p
        )
      )
      try {
        const report = await analyzePhraseBlob(blob, { transcriptWords: words })
        setPools((prev) =>
          prev.map((p, i) => (i === ap ? { ...p, acousticReadout: report, acousticReadoutError: null } : p))
        )
      } catch {
        setPools((prev) =>
          prev.map((p, i) =>
            i === ap ? { ...p, acousticReadout: null, acousticReadoutError: 'Transcript received, but local acoustic merge failed. Try Run readout.' } : p
          )
        )
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Transcription failed.'
      setPools((prev) => prev.map((p, i) => (i === ap ? { ...p, transcribeError: msg } : p)))
    } finally {
      setPhraseTranscribeBusy(false)
    }
  }, [activePool, pools])

  const copyReadoutExport = useCallback(async () => {
    const read = pools[activePool]?.acousticReadout
    if (!read) return
    const text = exportPhraseReadoutJson(read, {
      channelIndex: activePool,
      notes: pools[activePool]?.notes,
      poolDurationSec: pools[activePool]?.durationSec,
      transcriptText: pools[activePool]?.transcriptText,
      transcriptWords: pools[activePool]?.transcriptWords,
    })
    try {
      await navigator.clipboard.writeText(text)
      setReadoutExportMsg('Copied readout JSON to clipboard.')
      window.setTimeout(() => setReadoutExportMsg(null), 3200)
    } catch {
      setReadoutExportMsg('Clipboard blocked — use Download JSON.')
      window.setTimeout(() => setReadoutExportMsg(null), 4200)
    }
  }, [activePool, pools])

  const downloadReadoutExport = useCallback(() => {
    const read = pools[activePool]?.acousticReadout
    if (!read) return
    const text = exportPhraseReadoutJson(read, {
      channelIndex: activePool,
      notes: pools[activePool]?.notes,
      poolDurationSec: pools[activePool]?.durationSec,
      transcriptText: pools[activePool]?.transcriptText,
      transcriptWords: pools[activePool]?.transcriptWords,
    })
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mm-phrase-p${activePool + 1}-readout.json`
    a.click()
    URL.revokeObjectURL(url)
    setReadoutExportMsg('Download started.')
    window.setTimeout(() => setReadoutExportMsg(null), 2800)
  }, [activePool, pools])

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

  const resetActivePool = useCallback(() => {
    const pool = pools[activePool]
    if (pool?.url) URL.revokeObjectURL(pool.url)
    setPools((prev) =>
      prev.map((p, i) =>
        i === activePool
          ? { blob: null, url: null, durationSec: 0, notes: '', acousticReadout: null, acousticReadoutError: null, transcriptWords: null, transcriptText: null, transcriptLanguage: null, transcribeError: null }
          : p
      )
    )
    setPhrasePos(0)
    setPhraseDuration(0)
    setRecordedMs(0)
  }, [activePool, pools])

  const openAttachModal = useCallback(() => {
    const pool = pools[activePool]
    if (!pool?.blob) return
    setAttachMsg(null)
    setAttachSearch('')
    setSelectedTarget(null)
    setAttachLabel(mantraText?.trim() || pool.transcriptText?.trim() || pool.notes?.trim() || `Pool ${activePool + 1}`)
    setAttachOpen(true)
  }, [activePool, mantraText, pools])

  const confirmAttachVoiceNote = useCallback(async () => {
    const pool = pools[activePool]
    if (!pool?.blob || !selectedTarget) return
    setAttachSaving(true)
    setAttachMsg(null)
    try {
      await saveVoiceNote({
        target: selectedTarget,
        blob: pool.blob,
        mime: pool.blob.type || 'audio/webm',
        durationSec: pool.durationSec || Math.max(0, recordedMsRef.current / 1000),
        label: attachLabel.trim() || `Pool ${activePool + 1}`,
        createdAt: Date.now(),
        sessionContext: `phrase-pool-${activePool + 1}`,
      })
      const attachedName =
        selectedTarget.kind === 'glossary'
          ? attachGlossaryWords.find((w) => w.id === selectedTarget.wordId)?.word ?? 'word'
          : MANDALA_NODES.find((n) => n.id === selectedTarget.nodeId)?.term ?? 'card'
      setAttachMsg(`Attached to ${attachedName}.`)
      setAttachOpen(false)
    } catch {
      setAttachMsg('Attach failed. Try again.')
    } finally {
      setAttachSaving(false)
    }
  }, [activePool, attachGlossaryWords, attachLabel, pools, selectedTarget])

  const selectedPoolColor = POOL_COLORS[activePool] ?? '#56c1ff'
  const poolSecondsLeft = Math.max(0, Math.ceil((POOL_RECORD_MS - Math.min(POOL_RECORD_MS, recordedMs)) / 1000))
  const phraseReadout = pools[activePool]?.acousticReadout ?? null
  const phraseReadoutErr = pools[activePool]?.acousticReadoutError

  return (
    <>
      <audio ref={phraseAudioRef} className="hidden" preload="metadata" />

      <Card className="p-4 bg-white/60 border-black/8 dark:bg-neutral-950/60 dark:border-white/8 space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-neutral-500">
          Record &amp; analyse
        </p>

        <div className="rounded-lg border border-amber-300/50 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-950/20 p-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-200/90">
            Guided practice scaffold
          </p>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-100/80 leading-relaxed">
            Use a clear reference before recording — IPA, practitioner model, or your target phrase. This tape is for self-observation, not diagnosis.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-amber-700/70 dark:text-amber-200/70">
                Reference target
              </Label>
              <Input
                value={referenceTarget}
                onChange={(e) => setReferenceTarget(e.target.value)}
                placeholder="e.g. /rɪˈmɛm.bə.rɪŋ/ or practitioner model cue"
                className="bg-white dark:bg-neutral-950 border-amber-300/60 dark:border-amber-900/60"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-amber-700/70 dark:text-amber-200/70">
                Listening cue
              </Label>
              <Input
                value={listeningCue}
                onChange={(e) => setListeningCue(e.target.value)}
                placeholder="e.g. Consonant at start of 2nd syllable"
                className="bg-white dark:bg-neutral-950 border-amber-300/60 dark:border-amber-900/60"
              />
            </div>
          </div>
          <p className="text-[10px] text-amber-700/70 dark:text-amber-200/70 leading-relaxed">
            Phrase recordings stay on this device for the current session unless you explicitly attach a local note. If your intent is therapeutic, review with a qualified practitioner.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 dark:text-neutral-500">Phrase analyzer tape</p>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
              Three independent channels (P1–P3). Each records up to <strong className="text-gray-700 dark:text-neutral-200">10 seconds</strong> with pause/resume.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-black/8 dark:border-neutral-700/80 bg-white/70 dark:bg-neutral-900/70 p-1">
              {pools.map((pool, i) => (
                <Button
                  key={i}
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[10px] border"
                  style={{
                    borderColor: activePool === i ? `${POOL_COLORS[i]}aa` : 'transparent',
                    color: activePool === i ? POOL_COLORS[i] : undefined,
                    backgroundColor: activePool === i ? `${POOL_COLORS[i]}22` : 'transparent',
                  }}
                  onClick={() => setActivePool(i)}
                >
                  P{i + 1}
                  {pool.durationSec > 0 ? ` ${pool.durationSec.toFixed(1)}s` : ''}
                </Button>
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              variant={phraseRecActive ? 'destructive' : 'outline'}
              className="gap-1.5"
              onClick={() => void startOrResumePhraseRecord()}
            >
              <Circle className={cn('h-3.5 w-3.5', phraseRecActive && 'fill-red-500 text-red-500')} />
              {phraseRecActive ? 'Recording…' : phraseRecPaused ? 'Resume' : 'Record'}
            </Button>
            <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={pausePhraseRecord} disabled={!phraseRecActive}>
              <Pause className="h-3.5 w-3.5" />
              Pause
            </Button>
            <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={finalizePhrasePool} disabled={!phraseRecActive && !phraseRecPaused}>
              <Square className="h-3.5 w-3.5" />
              Finish
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              style={{ borderColor: `${selectedPoolColor}99`, color: selectedPoolColor, backgroundColor: `${selectedPoolColor}14` }}
              onClick={() => void togglePhrasePlayback()}
              disabled={!pools[activePool]?.blob}
            >
              {phrasePlayActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {phrasePlayActive ? 'Pause' : 'Play'}
            </Button>
            <Button type="button" size="sm" variant="ghost" className="gap-1" onClick={resetPhrase} disabled={!pools[activePool]?.blob}>
              <Rewind className="h-3.5 w-3.5" />
              Zero
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Label className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-neutral-500 shrink-0">
            Playback speed
          </Label>
          <Slider value={[phraseRate]} min={0.1} max={2} step={0.05} onValueChange={([v]) => setPhraseRate(v)} className="max-w-sm" />
          <span className="text-xs tabular-nums text-gray-400 dark:text-neutral-400 w-12">{phraseRate.toFixed(2)}x</span>
          <div
            className="ml-auto h-12 w-16 rounded-md border flex items-center justify-center text-3xl font-black tabular-nums"
            style={{ borderColor: `${selectedPoolColor}99`, color: selectedPoolColor, backgroundColor: `${selectedPoolColor}14` }}
            aria-live="polite"
          >
            {poolSecondsLeft}
          </div>
          <span className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-neutral-500 -ml-1">sec left</span>
        </div>

        <div className="rounded-xl border border-black/8 dark:border-neutral-800/80 bg-gray-50/60 dark:bg-neutral-900/60 p-3">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 rounded-full border border-black/10 dark:border-neutral-700 bg-white dark:bg-neutral-950 shadow-inner">
              <div
                className="absolute inset-2 rounded-full border border-black/6 dark:border-neutral-800 bg-gray-100 dark:bg-neutral-900"
                style={{ transform: `rotate(${(phrasePos / Math.max(0.001, phraseDuration || POOL_RECORD_MS / 1000)) * 720}deg)` }}
              />
              <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-400 dark:bg-neutral-500" />
            </div>
            <div className="flex-1">
              <div className="mb-2 h-2 rounded-full bg-black/10 dark:bg-neutral-800 overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    backgroundColor: selectedPoolColor,
                    width: `${Math.min(100, (phrasePos / Math.max(0.001, phraseDuration || POOL_RECORD_MS / 1000)) * 100)}%`,
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
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-400 dark:text-neutral-500">
                <span>Tape jog</span>
                <span className="tabular-nums">
                  {phrasePos.toFixed(2)}s / {(phraseDuration || POOL_RECORD_MS / 1000).toFixed(2)}s
                </span>
              </div>
            </div>
            <Button type="button" size="sm" variant="ghost" className="gap-1" onClick={() => jogPhrase(phrasePos + 0.1)} disabled={!pools[activePool]?.blob}>
              <RotateCw className="h-3.5 w-3.5" />
              +0.1s
            </Button>
          </div>

          <div className="mt-3 space-y-1">
            <Label className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-neutral-500">
              Pool {activePool + 1} appraisal notes
            </Label>
            <Input
              value={pools[activePool]?.notes || ''}
              onChange={(e) => setPools((prev) => prev.map((p, i) => (i === activePool ? { ...p, notes: e.target.value } : p)))}
              placeholder="Mark pronunciation misses, tonal drift, consonant failures…"
              className="bg-white dark:bg-neutral-950 border-black/10 dark:border-neutral-700"
            />
          </div>
          <div className="mt-2 flex gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={resetActivePool}>
              Reset pool {activePool + 1}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={openAttachModal} disabled={!pools[activePool]?.blob}>
              Attach to card / glossary
            </Button>
          </div>

          <div className="mt-4 pt-4 border-t border-black/6 dark:border-neutral-800/90 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400 dark:text-neutral-500 flex items-center gap-1.5">
                  <Activity className="h-3 w-3 shrink-0" />
                  Acoustic scaffolding
                </p>
                <p className="text-[10px] text-gray-400 dark:text-neutral-500 mt-1 max-w-xl leading-relaxed">
                  A <strong className="text-gray-600 dark:text-neutral-400">defensible readout</strong> of where loudness and pitch rise together against this clip&apos;s baseline — scaffolding for owned output, not a verdict on fluency. Optional <strong className="text-gray-600 dark:text-neutral-400">server ASR</strong> (Whisper, word timestamps) indexes the same local metrics by token.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  type="button" size="sm" variant="outline" className="gap-1.5"
                  disabled={!pools[activePool]?.blob || phraseReadoutBusy || phraseTranscribeBusy}
                  onClick={() => void runAcousticReadout()}
                >
                  {phraseReadoutBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
                  Run readout
                </Button>
                <Button
                  type="button" size="sm" variant="outline" className="gap-1.5"
                  disabled={!pools[activePool]?.blob || phraseReadoutBusy || phraseTranscribeBusy}
                  onClick={() => void runServerTranscribeAndAlign()}
                >
                  {phraseTranscribeBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mic2 className="h-3.5 w-3.5" />}
                  ASR + align
                </Button>
              </div>
            </div>

            {pools[activePool]?.transcribeError ? (
              <p className="text-xs text-red-500">{pools[activePool].transcribeError}</p>
            ) : null}
            {pools[activePool]?.transcriptText ? (
              <div className="rounded border border-black/8 dark:border-neutral-800/80 bg-white/60 dark:bg-neutral-950/40 p-2 max-h-20 overflow-y-auto">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-neutral-500 mb-0.5">Transcript (server)</p>
                <p className="text-[10px] text-gray-700 dark:text-neutral-300 leading-relaxed">{pools[activePool].transcriptText}</p>
                {pools[activePool]?.transcriptLanguage ? (
                  <p className="text-[10px] text-gray-400 dark:text-neutral-500 mt-1">Language tag: {pools[activePool].transcriptLanguage}</p>
                ) : null}
              </div>
            ) : null}

            {phraseReadoutErr ? <p className="text-xs text-red-500">{phraseReadoutErr}</p> : null}

            {phraseReadout ? (
              <div className="space-y-3 rounded-lg border border-black/8 dark:border-neutral-800/80 bg-white/60 dark:bg-neutral-950/50 p-3">
                <p className="text-[10px] text-gray-400 dark:text-neutral-500 leading-relaxed">{phraseReadout.methodologyLine}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" size="sm" variant="outline" className="gap-1 h-7 text-[10px]" onClick={() => void copyReadoutExport()}>
                    <ClipboardCopy className="h-3 w-3" /> Copy JSON
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="gap-1 h-7 text-[10px]" onClick={downloadReadoutExport}>
                    <Download className="h-3 w-3" /> Download JSON
                  </Button>
                  {readoutExportMsg ? <span className="text-[10px] text-emerald-500">{readoutExportMsg}</span> : null}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                  {[
                    { label: 'Median F0', value: phraseReadout.summary.medianF0Hz != null ? `${phraseReadout.summary.medianF0Hz.toFixed(0)} Hz` : '—' },
                    { label: 'F0 span', value: phraseReadout.summary.f0MinHz != null && phraseReadout.summary.f0MaxHz != null ? `${phraseReadout.summary.f0MinHz.toFixed(0)}–${phraseReadout.summary.f0MaxHz.toFixed(0)} Hz` : '—' },
                    { label: 'Voiced frames', value: `${(phraseReadout.summary.voicedFrameFraction * 100).toFixed(0)}%` },
                    { label: 'Brightness', value: phraseReadout.summary.brightnessRatio.toFixed(2) },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded border border-black/8 dark:border-neutral-800/80 bg-gray-50/60 dark:bg-neutral-900/40 p-2">
                      <p className="text-gray-400 dark:text-neutral-500 uppercase tracking-wider">{label}</p>
                      <p className="text-gray-800 dark:text-neutral-200 font-semibold tabular-nums mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>

                {phraseReadout.wordAlignments.length > 0 ? (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-neutral-500 mb-1.5">
                      Word-aligned prominence (Whisper timing · local frames)
                    </p>
                    <div className="max-h-48 overflow-y-auto rounded border border-black/8 dark:border-neutral-800/80">
                      <table className="w-full text-left text-[10px]">
                        <thead>
                          <tr className="text-gray-400 dark:text-neutral-500 border-b border-black/8 dark:border-neutral-800 bg-gray-50/80 dark:bg-neutral-950/80">
                            <th className="py-1.5 px-2 font-medium">Word</th>
                            <th className="py-1.5 px-2 font-medium">Time</th>
                            <th className="py-1.5 px-2 font-medium">Prom μ</th>
                            <th className="py-1.5 px-2 font-medium">Prom max</th>
                            <th className="py-1.5 px-2 font-medium">F0</th>
                            <th className="py-1.5 px-2 font-medium">#fr</th>
                          </tr>
                        </thead>
                        <tbody>
                          {phraseReadout.wordAlignments.map((row, idx) => (
                            <tr
                              key={`${row.word}-${row.startSec}-${idx}`}
                              className="border-b border-black/6 dark:border-neutral-800/40 hover:bg-gray-50 dark:hover:bg-neutral-900/70 cursor-pointer text-gray-700 dark:text-neutral-300"
                              onClick={() => jogPhrase(row.startSec)}
                            >
                              <td className="py-1 px-2 max-w-[8rem] truncate" title={row.word}>{row.word}</td>
                              <td className="py-1 px-2 tabular-nums text-gray-400 dark:text-neutral-400">{row.startSec.toFixed(2)}–{row.endSec.toFixed(2)}s</td>
                              <td className="py-1 px-2 tabular-nums">{row.prominenceMean.toFixed(2)}</td>
                              <td className="py-1 px-2 tabular-nums">{row.prominenceMax.toFixed(2)}</td>
                              <td className="py-1 px-2 tabular-nums">{row.meanF0Hz != null ? `${row.meanF0Hz.toFixed(0)} Hz` : '—'}</td>
                              <td className="py-1 px-2 tabular-nums text-gray-400 dark:text-neutral-500">{row.frameCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}

                {phraseReadout.prominenceCurve.length > 0 ? (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-neutral-500 mb-1">
                      Prominence (solid) · energy (muted) — click graph to seek
                    </p>
                    <svg
                      className="w-full h-14 cursor-crosshair touch-manipulation"
                      viewBox="0 0 200 56"
                      preserveAspectRatio="none"
                      role="img"
                      aria-label="Seek tape: click along the waveform to jump playback time"
                      onClick={(e) => {
                        const svg = e.currentTarget
                        const rect = svg.getBoundingClientRect()
                        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)))
                        jogPhrase(ratio * phraseReadout.durationSec)
                      }}
                    >
                      <polyline fill="none" stroke="currentColor" strokeWidth="1.2" opacity={0.3} points={sparkPolylinePoints(phraseReadout.energyCurve, 200, 56)} />
                      <polyline fill="none" stroke={selectedPoolColor} strokeWidth="1.5" points={sparkPolylinePoints(phraseReadout.prominenceCurve, 200, 56)} />
                    </svg>
                  </div>
                ) : null}

                {phraseReadout.prominencePeaks.length > 0 ? (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-neutral-500 mb-1.5">
                      Acoustic prominence peaks — tap to jog tape
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {phraseReadout.prominencePeaks.map((pk) => (
                        <button
                          key={`${pk.tSec}-${pk.score}`}
                          type="button"
                          className="rounded border border-black/10 dark:border-neutral-700/90 bg-gray-50/60 dark:bg-neutral-900/60 px-2 py-1 text-[10px] text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800/80 tabular-nums"
                          onClick={() => jogPhrase(pk.tSec)}
                        >
                          {pk.tSec.toFixed(2)}s · {pk.score}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400 dark:text-neutral-500">
                    No clear prominence peaks in this take (very even level, or mostly noise / silence).
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
        {phraseError && <p className="text-xs text-red-500">{phraseError}</p>}
      </Card>

      {attachOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/15 bg-neutral-950 p-4 text-neutral-100">
            <div className="mb-3">
              <h3 className="text-sm font-semibold">Attach voice note</h3>
              <p className="text-xs text-neutral-400">Stored on this device only (IndexedDB).</p>
            </div>
            <div className="mb-3 flex gap-2">
              <Button type="button" size="sm" variant={attachTab === 'deck-card' ? 'default' : 'outline'} onClick={() => { setAttachTab('deck-card'); setSelectedTarget(null) }}>Deck card</Button>
              <Button type="button" size="sm" variant={attachTab === 'glossary' ? 'default' : 'outline'} onClick={() => { setAttachTab('glossary'); setSelectedTarget(null) }}>Glossary word</Button>
            </div>
            <Input value={attachLabel} onChange={(e) => setAttachLabel(e.target.value)} placeholder="Voice note label" className="mb-2 bg-neutral-900 border-neutral-700" />
            <Input value={attachSearch} onChange={(e) => setAttachSearch(e.target.value)} placeholder={`Search ${attachTab === 'deck-card' ? 'cards' : 'words'}…`} className="mb-2 bg-neutral-900 border-neutral-700" />
            <div className="mb-3 max-h-56 overflow-y-auto rounded border border-neutral-800">
              {attachTab === 'deck-card'
                ? MANDALA_NODES.filter((n) => n.term.toLowerCase().includes(attachSearch.toLowerCase())).map((node) => (
                    <button key={node.id} type="button" className={cn('w-full border-b border-neutral-800 px-3 py-2 text-left text-xs hover:bg-neutral-900', selectedTarget?.kind === 'deck-card' && selectedTarget.nodeId === node.id && 'bg-neutral-800')} onClick={() => setSelectedTarget({ kind: 'deck-card', nodeId: node.id })}>{node.term}</button>
                  ))
                : attachGlossaryWords.filter((w) => w.word.toLowerCase().includes(attachSearch.toLowerCase())).map((word) => (
                    <button key={word.id} type="button" className={cn('w-full border-b border-neutral-800 px-3 py-2 text-left text-xs hover:bg-neutral-900', selectedTarget?.kind === 'glossary' && selectedTarget.wordId === word.id && 'bg-neutral-800')} onClick={() => setSelectedTarget({ kind: 'glossary', wordId: word.id })}>{word.word}</button>
                  ))
              }
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={() => setAttachOpen(false)}>Cancel</Button>
              <Button type="button" size="sm" disabled={!selectedTarget || attachSaving} onClick={() => void confirmAttachVoiceNote()}>
                {attachSaving ? 'Saving…' : 'Attach'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {attachMsg && <p className="text-xs text-emerald-500 mt-2">{attachMsg}</p>}
    </>
  )
}
