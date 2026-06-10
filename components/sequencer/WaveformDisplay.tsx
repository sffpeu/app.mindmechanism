'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  blob: Blob | null
  phrasePos: number
  phraseDuration: number
  color: string
  onSeek: (tSec: number) => void
}

const SAMPLES = 600
const VIEW_W = 600
const VIEW_H = 64
const MID = VIEW_H / 2

function buildWaveformPoints(peaks: number[], upper: boolean): string {
  if (!peaks.length) return ''
  return peaks
    .map((v, i) => {
      const x = (i / Math.max(1, peaks.length - 1)) * VIEW_W
      const y = upper ? MID - v * (MID - 2) : MID + v * (MID - 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

export function WaveformDisplay({ blob, phrasePos, phraseDuration, color, onSeek }: Props) {
  const [peaks, setPeaks] = useState<number[]>([])
  const [decoding, setDecoding] = useState(false)
  const ctxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (!blob) {
      setPeaks([])
      return
    }
    let cancelled = false
    setDecoding(true)
    const run = async () => {
      try {
        if (!ctxRef.current) ctxRef.current = new AudioContext()
        const ab = await blob.arrayBuffer()
        const audioBuffer = await ctxRef.current.decodeAudioData(ab)
        if (cancelled) return
        // Use first channel only
        const raw = audioBuffer.getChannelData(0)
        const bucketSize = Math.floor(raw.length / SAMPLES)
        const result: number[] = []
        for (let i = 0; i < SAMPLES; i++) {
          let peak = 0
          const start = i * bucketSize
          const end = Math.min(start + bucketSize, raw.length)
          for (let j = start; j < end; j++) {
            const abs = Math.abs(raw[j]!)
            if (abs > peak) peak = abs
          }
          result.push(peak)
        }
        // Normalise to 0–1
        const max = Math.max(...result, 0.0001)
        setPeaks(result.map((v) => v / max))
      } catch {
        setPeaks([])
      } finally {
        if (!cancelled) setDecoding(false)
      }
    }
    void run()
    return () => { cancelled = true }
  }, [blob])

  // Playhead position as fraction 0–1
  const playFraction = phraseDuration > 0 ? Math.min(1, phrasePos / phraseDuration) : 0
  const playX = (playFraction * VIEW_W).toFixed(1)

  if (!blob) return null

  return (
    <div className="rounded-lg border border-black/8 dark:border-neutral-800 bg-gray-50/40 dark:bg-neutral-900/40 overflow-hidden">
      {decoding ? (
        <div className="flex items-center justify-center h-16 text-[10px] uppercase tracking-widest text-gray-400 dark:text-neutral-500">
          Drawing waveform…
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
          className="w-full h-16 cursor-crosshair touch-manipulation block"
          role="img"
          aria-label="Waveform — click to seek"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)))
            onSeek(ratio * phraseDuration)
          }}
        >
          {/* Centre line */}
          <line x1="0" y1={MID} x2={VIEW_W} y2={MID} stroke="currentColor" strokeWidth="0.4" opacity={0.15} className="text-gray-500 dark:text-neutral-600" />

          {/* Upper lobe */}
          {peaks.length > 0 && (
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="1.2"
              opacity={0.85}
              points={buildWaveformPoints(peaks, true)}
            />
          )}

          {/* Lower lobe (mirrored) */}
          {peaks.length > 0 && (
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="1.2"
              opacity={0.5}
              points={buildWaveformPoints(peaks, false)}
            />
          )}

          {/* Filled area between lobes for visual density */}
          {peaks.length > 0 && (
            <polygon
              fill={color}
              opacity={0.08}
              points={[
                ...peaks.map((v, i) => {
                  const x = (i / Math.max(1, peaks.length - 1)) * VIEW_W
                  const y = MID - v * (MID - 2)
                  return `${x.toFixed(1)},${y.toFixed(1)}`
                }),
                ...peaks.slice().reverse().map((v, i, arr) => {
                  const srcIdx = arr.length - 1 - i
                  const x = (srcIdx / Math.max(1, peaks.length - 1)) * VIEW_W
                  const y = MID + v * (MID - 2)
                  return `${x.toFixed(1)},${y.toFixed(1)}`
                }),
              ].join(' ')}
            />
          )}

          {/* Playhead */}
          {phraseDuration > 0 && (
            <line
              x1={playX}
              y1="0"
              x2={playX}
              y2={VIEW_H}
              stroke="white"
              strokeWidth="1.5"
              opacity={0.7}
            />
          )}
        </svg>
      )}
    </div>
  )
}
