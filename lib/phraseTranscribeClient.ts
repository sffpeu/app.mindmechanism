import type { PhraseTranscriptWord } from '@/lib/phraseAcousticAnalysis'

export type PhraseTranscribeResult = {
  text: string
  language: string | null
  duration: number | null
  words: PhraseTranscriptWord[]
}

/**
 * POST recorded phrase audio to the app route; returns Whisper word timestamps.
 */
export async function transcribePhraseBlob(blob: Blob): Promise<PhraseTranscribeResult> {
  const fd = new FormData()
  const type = blob.type || 'audio/webm'
  const ext = type.includes('wav') ? 'wav' : type.includes('mp4') ? 'm4a' : 'webm'
  fd.append('file', blob, `phrase.${ext}`)
  const res = await fetch('/api/phrase-transcribe', { method: 'POST', body: fd })
  const j = (await res.json().catch(() => ({}))) as {
    error?: string
    text?: string
    language?: string | null
    duration?: number | null
    words?: PhraseTranscriptWord[]
  }
  if (!res.ok) {
    throw new Error(j.error || `Transcription failed (${res.status})`)
  }
  return {
    text: j.text ?? '',
    language: j.language ?? null,
    duration: typeof j.duration === 'number' ? j.duration : null,
    words: Array.isArray(j.words) ? j.words : [],
  }
}
