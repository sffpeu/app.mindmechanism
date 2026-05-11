import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  type Firestore,
} from 'firebase/firestore'
import { db } from './firebase'
import { decryptField } from '@/lib/passportCrypto'

/** Stable id for `mantra|ipa` — matches legacy sequencer paths (`p_<int>`). */
export function phraseHash(key: string): string {
  let h = 0
  for (let i = 0; i < key.length; i++) {
    h = (h << 5) - h + key.charCodeAt(i)
    h |= 0
  }
  return `p_${Math.abs(h)}`
}

export interface PhraseSummary {
  phraseHash: string
  phrase: string
  ipaText: string
  latestScore: number
  bestScore: number
  sessionCount: number
  firstSessionAt: number
  latestSessionAt: number
}

export interface PhraseSession {
  sessionId: string
  consistencyScore: number
  rhythmMatchPct: number
  stressHitCount: number
  stressMissCount: number
  createdAt: number
  notes?: string | null
  notesEncrypted?: boolean
}

function num(v: unknown): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (v && typeof v === 'object' && 'toMillis' in v && typeof (v as { toMillis: () => number }).toMillis === 'function') {
    return (v as { toMillis: () => number }).toMillis()
  }
  return 0
}

function mapSummaryDoc(
  phraseHash: string,
  data: Record<string, unknown>
): PhraseSummary {
  return {
    phraseHash,
    phrase: typeof data.phrase === 'string' ? data.phrase : '',
    ipaText: typeof data.ipaText === 'string' ? data.ipaText : '',
    latestScore: num(data.latestScore),
    bestScore: num(data.bestScore),
    sessionCount: num(data.sessionCount),
    firstSessionAt: num(data.firstSessionAt),
    latestSessionAt: num(data.latestSessionAt),
  }
}

async function mapSessionDoc(
  id: string,
  data: Record<string, unknown>,
  passportKey: CryptoKey | null | undefined
): Promise<PhraseSession> {
  const notesEncrypted = data.notesEncrypted === true
  const rawNotes = typeof data.notes === 'string' ? data.notes : data.notes == null ? null : String(data.notes)
  let notes: string | null | undefined = rawNotes ?? undefined
  if (notesEncrypted && rawNotes && passportKey) {
    try {
      notes = await decryptField(rawNotes, passportKey)
    } catch {
      /* leave ciphertext */
    }
  }
  return {
    sessionId: id,
    consistencyScore: num(data.consistencyScore),
    rhythmMatchPct: num(data.rhythmMatchPct),
    stressHitCount: num(data.stressHitCount),
    stressMissCount: num(data.stressMissCount),
    createdAt: num(data.createdAt),
    notes: notes ?? undefined,
    notesEncrypted: notesEncrypted || undefined,
  }
}

export async function getUserPhraseSummaries(uid: string): Promise<PhraseSummary[]> {
  if (!db) return []
  const legacyRef = collection(db as Firestore, 'users', uid, 'phraseProgress')
  const siloRef = collection(db as Firestore, 'passport', uid, 'phrases')

  const [legacySnap, siloSnap] = await Promise.all([getDocs(legacyRef), getDocs(siloRef)])

  const byId = new Map<string, PhraseSummary>()
  legacySnap.docs.forEach((d) => {
    byId.set(d.id, mapSummaryDoc(d.id, d.data() as Record<string, unknown>))
  })
  siloSnap.docs.forEach((d) => {
    byId.set(d.id, mapSummaryDoc(d.id, d.data() as Record<string, unknown>))
  })

  return [...byId.values()]
    .filter((s) => s.sessionCount > 0)
    .sort((a, b) => b.latestSessionAt - a.latestSessionAt)
}

export async function getPhraseSummaryDoc(
  uid: string,
  phraseHash: string
): Promise<Omit<PhraseSummary, 'phraseHash'> | null> {
  if (!db) return null
  const siloRef = doc(db as Firestore, 'passport', uid, 'phrases', phraseHash)
  const legacyRef = doc(db as Firestore, 'users', uid, 'phraseProgress', phraseHash)

  const siloSnap = await getDoc(siloRef)
  if (siloSnap.exists()) {
    const data = siloSnap.data() as Record<string, unknown>
    return {
      phrase: typeof data.phrase === 'string' ? data.phrase : '',
      ipaText: typeof data.ipaText === 'string' ? data.ipaText : '',
      latestScore: num(data.latestScore),
      bestScore: num(data.bestScore),
      sessionCount: num(data.sessionCount),
      firstSessionAt: num(data.firstSessionAt),
      latestSessionAt: num(data.latestSessionAt),
    }
  }

  const legacySnap = await getDoc(legacyRef)
  if (!legacySnap.exists()) return null
  const data = legacySnap.data() as Record<string, unknown>
  return {
    phrase: typeof data.phrase === 'string' ? data.phrase : '',
    ipaText: typeof data.ipaText === 'string' ? data.ipaText : '',
    latestScore: num(data.latestScore),
    bestScore: num(data.bestScore),
    sessionCount: num(data.sessionCount),
    firstSessionAt: num(data.firstSessionAt),
    latestSessionAt: num(data.latestSessionAt),
  }
}

export async function getPhraseSessionHistory(
  uid: string,
  phraseHash: string,
  maxSessions = 20,
  passportKey?: CryptoKey | null
): Promise<PhraseSession[]> {
  if (!db) return []

  const siloRef = collection(db as Firestore, 'passport', uid, 'phrases', phraseHash, 'sessions')
  const siloQ = query(siloRef, orderBy('createdAt', 'desc'), limit(maxSessions))
  const siloSnap = await getDocs(siloQ)

  let docs = siloSnap.docs
  if (docs.length === 0) {
    const legacyRef = collection(db as Firestore, 'users', uid, 'phraseProgress', phraseHash, 'sessions')
    const legacyQ = query(legacyRef, orderBy('createdAt', 'desc'), limit(maxSessions))
    const legacySnap = await getDocs(legacyQ)
    docs = legacySnap.docs
  }

  const sessions = await Promise.all(
    docs.map((d) => mapSessionDoc(d.id, d.data() as Record<string, unknown>, passportKey))
  )
  return sessions.reverse()
}
