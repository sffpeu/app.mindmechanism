import { NextRequest, NextResponse } from 'next/server'
import { verifyFirebaseRequestUid } from '@/lib/verifyFirebaseRequestUid'

/**
 * Server-side phrase transcription (OpenAI Whisper) with word-level timestamps.
 * Requires OPENAI_API_KEY. Audio never touches third parties beyond OpenAI’s STT endpoint.
 */
export const maxDuration = 60
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const uid = await verifyFirebaseRequestUid(req)
  if (!uid) {
    return NextResponse.json(
      { error: 'Sign in required to use server transcription.' },
      { status: 401 }
    )
  }

  const key = process.env.OPENAI_API_KEY?.trim()
  if (!key) {
    return NextResponse.json(
      {
        error:
          'OPENAI_API_KEY is not set. Add it to the server environment (e.g. .env.local) to enable transcription.',
      },
      { status: 503 }
    )
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid multipart body.' }, { status: 400 })
  }

  const file = form.get('file')
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Missing file field (audio blob).' }, { status: 400 })
  }

  const outbound = new FormData()
  const type = file.type || 'audio/webm'
  const ext = type.includes('wav') ? 'wav' : type.includes('mp4') ? 'm4a' : 'webm'
  outbound.append('file', file, `phrase.${ext}`)
  outbound.append('model', 'whisper-1')
  outbound.append('response_format', 'verbose_json')
  outbound.append('timestamp_granularities[]', 'word')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: outbound,
  })

  const textBody = await res.text()
  if (!res.ok) {
    let msg = textBody || res.statusText
    try {
      const j = JSON.parse(textBody) as { error?: { message?: string } }
      if (j.error?.message) msg = j.error.message
    } catch {
      /* keep msg */
    }
    return NextResponse.json(
      { error: msg },
      { status: res.status >= 400 && res.status < 600 ? res.status : 502 }
    )
  }

  let data: {
    text?: string
    language?: string
    duration?: number
    words?: Array<{ word: string; start: number; end: number }>
  }
  try {
    data = JSON.parse(textBody) as typeof data
  } catch {
    return NextResponse.json({ error: 'OpenAI returned non-JSON.' }, { status: 502 })
  }

  const words = (data.words ?? [])
    .map((w) => ({
      word: String(w.word ?? '').trim(),
      startSec: Number(w.start),
      endSec: Number(w.end),
    }))
    .filter(
      (w) =>
        w.word.length > 0 &&
        Number.isFinite(w.startSec) &&
        Number.isFinite(w.endSec) &&
        w.endSec >= w.startSec
    )

  return NextResponse.json({
    text: data.text ?? '',
    language: data.language ?? null,
    duration: typeof data.duration === 'number' ? data.duration : null,
    words,
  })
}
