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
}

function num(v: unknown): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (v && typeof v === 'object' && 'toMillis' in v && typeof (v as { toMillis: () => number }).toMillis === 'function') {
    return (v as { toMillis: () => number }).toMillis()
  }
  return 0
}

export async function getUserPhraseSummaries(uid: string): Promise<PhraseSummary[]> {
  if (!db) return []
  const ref = collection(db as Firestore, 'users', uid, 'phraseProgress')
  const snap = await getDocs(ref)
  return snap.docs
    .map((d) => {
      const data = d.data()
      return {
        phraseHash: d.id,
        phrase: typeof data.phrase === 'string' ? data.phrase : '',
        ipaText: typeof data.ipaText === 'string' ? data.ipaText : '',
        latestScore: num(data.latestScore),
        bestScore: num(data.bestScore),
        sessionCount: num(data.sessionCount),
        firstSessionAt: num(data.firstSessionAt),
        latestSessionAt: num(data.latestSessionAt),
      } as PhraseSummary
    })
    .filter((s) => s.sessionCount > 0)
    .sort((a, b) => b.latestSessionAt - a.latestSessionAt)
}

export async function getPhraseSummaryDoc(
  uid: string,
  phraseHash: string
): Promise<Omit<PhraseSummary, 'phraseHash'> | null> {
  if (!db) return null
  const ref = doc(db as Firestore, 'users', uid, 'phraseProgress', phraseHash)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const data = snap.data()
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
  maxSessions = 20
): Promise<PhraseSession[]> {
  if (!db) return []
  const ref = collection(db as Firestore, 'users', uid, 'phraseProgress', phraseHash, 'sessions')
  const q = query(ref, orderBy('createdAt', 'desc'), limit(maxSessions))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => {
      const data = d.data()
      return {
        sessionId: d.id,
        consistencyScore: num(data.consistencyScore),
        rhythmMatchPct: num(data.rhythmMatchPct),
        stressHitCount: num(data.stressHitCount),
        stressMissCount: num(data.stressMissCount),
        createdAt: num(data.createdAt),
      } as PhraseSession
    })
    .reverse()
}
