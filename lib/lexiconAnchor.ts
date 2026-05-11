import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query as firestoreQuery,
  where,
  orderBy,
  type Firestore,
} from 'firebase/firestore'
import { db } from './firebase'
import { RESEARCH_PROTOCOL_VERSION } from './researchProtocol'

async function sha256hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Identity fields only — encrypted narrative is excluded so verification never needs the passport key. */
async function hashWord(word: {
  id: string
  word: string
  clock_id?: number | null
  language?: string | null
  created_at: string
}): Promise<string> {
  const canonical = [
    word.id,
    word.word.trim().toLowerCase(),
    word.clock_id ?? 'null',
    word.language ?? 'null',
    word.created_at,
  ].join('|')
  return sha256hex(canonical)
}

async function buildMerkleRoot(leaves: string[]): Promise<string> {
  if (leaves.length === 0) return sha256hex('empty')
  let level = [...leaves].sort()
  while (level.length > 1) {
    const next: string[] = []
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i]
      const right = level[i + 1] ?? left
      next.push(await sha256hex(left + right))
    }
    level = next
  }
  return level[0]
}

export interface LexiconAnchorRecord {
  merkleRoot: string
  wordCount: number
  anchoredAt: string
  txHash: string | null
  chainId: number
  protocolVersion: string
}

export async function computeLexiconMerkleRoot(uid: string): Promise<{
  root: string
  wordCount: number
  leaves: string[]
} | null> {
  if (!db) return null

  const ref = collection(db as Firestore, 'glossary')
  const q = firestoreQuery(ref, where('user_id', '==', uid))
  const snap = await getDocs(q)

  const words = snap.docs
    .map((d) => {
      const data = d.data() as Record<string, unknown>
      if (data.personal !== true) return null
      return {
        id: d.id,
        word: String(data.word ?? ''),
        clock_id: (data.clock_id as number | null | undefined) ?? null,
        language: (data.language as string | null | undefined) ?? null,
        created_at: String(data.created_at ?? ''),
      }
    })
    .filter((w): w is NonNullable<typeof w> => w !== null && w.created_at.length > 0)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))

  if (words.length === 0) return null

  const leaves = await Promise.all(words.map(hashWord))
  const root = await buildMerkleRoot(leaves)

  return { root, wordCount: words.length, leaves }
}

export async function anchorLexicon(uid: string): Promise<LexiconAnchorRecord | null> {
  if (!db) return null

  const computed = await computeLexiconMerkleRoot(uid)
  if (!computed) return null

  let txHash: string | null = null
  try {
    const res = await fetch('/api/consent-anchor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consentHash: computed.root }),
    })
    if (res.ok) {
      const data = (await res.json()) as { txHash?: string }
      txHash = data.txHash ?? null
    }
  } catch {
    /* best-effort chain */
  }

  const anchoredAt = new Date().toISOString()
  const record: LexiconAnchorRecord = {
    merkleRoot: computed.root,
    wordCount: computed.wordCount,
    anchoredAt,
    txHash,
    chainId: 137,
    protocolVersion: RESEARCH_PROTOCOL_VERSION,
  }

  const anchorId = anchoredAt.replace(/[:.]/g, '-')
  const anchorRef = doc(db as Firestore, 'passport', uid, 'lexiconAnchors', anchorId)
  await setDoc(anchorRef, record)

  const metaRef = doc(db as Firestore, 'passport', uid)
  await setDoc(
    metaRef,
    {
      latest_lexicon_anchor: record.merkleRoot,
      latest_lexicon_anchor_tx: txHash,
      latest_lexicon_anchor_at: record.anchoredAt,
      latest_lexicon_word_count: computed.wordCount,
    },
    { merge: true }
  )

  return record
}

export async function getLexiconAnchorHistory(uid: string): Promise<LexiconAnchorRecord[]> {
  if (!db) return []
  try {
    const cref = collection(db as Firestore, 'passport', uid, 'lexiconAnchors')
    const q = firestoreQuery(cref, orderBy('anchoredAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => d.data() as LexiconAnchorRecord)
  } catch {
    return []
  }
}

export async function verifyLexiconAnchor(uid: string, anchor: LexiconAnchorRecord): Promise<boolean> {
  const computed = await computeLexiconMerkleRoot(uid)
  if (!computed) return false
  return computed.root === anchor.merkleRoot
}

/** Fire after a personal word add once `lexicon_count` on `passport/{uid}` reflects the new total. */
export function maybeAutoAnchor(uid: string, currentWordCount: number): void {
  if (currentWordCount > 0 && currentWordCount % 10 === 0) {
    void anchorLexicon(uid)
  }
}
