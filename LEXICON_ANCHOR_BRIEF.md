# Personal Lexicon Ownership Anchoring — Build Brief
### Phase 3.3 — Cursor Implementation Brief
**Version 1.0 | 2026-05-08**

---

## What This Is

The user's personal lexicon is theirs. Phase 3.3 makes that ownership cryptographically provable.

At defined intervals — on every tenth word added, and on explicit user request — a merkle root of the user's personal lexicon is computed and anchored on-chain via the existing Polygon relay (Phase 2.4). The user receives a transaction hash. At any point, they can recompute the merkle root from their current lexicon and verify it matches the hash on chain. If it matches, the record is intact and unaltered.

No new infrastructure required. The Polygon relay (`app/api/consent-anchor/route.ts`) and the `consentAnchor.ts` client are already live.

---

## What a Merkle Root Proves

A merkle root is a single hash that represents a set of data. If any item in the set changes, the root changes. If you hash the same set in the same order and get the same root, the set is identical to what was hashed before.

For the personal lexicon: each word contributes a hash of its core identity fields. The merkle root of all word hashes is a fingerprint of the entire lexicon at a point in time. Anchoring that fingerprint on chain proves:
- The lexicon contained these words at this timestamp
- No word has been silently added, removed, or altered since the anchor

---

## New File: `lib/lexiconAnchor.ts`

```typescript
import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from './firebase'
import { RESEARCH_PROTOCOL_VERSION } from './researchProtocol'

// ── Merkle helpers ────────────────────────────────────────────────────────────

async function sha256hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Hash a single word's identity fields — excludes encrypted content
// so the root can be verified without the encryption key
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

// Build merkle root from an array of leaf hashes
// Simple binary tree: pair hashes, hash pairs, repeat until one root remains
async function buildMerkleRoot(leaves: string[]): Promise<string> {
  if (leaves.length === 0) return sha256hex('empty')
  let level = [...leaves].sort() // sort for determinism
  while (level.length > 1) {
    const next: string[] = []
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i]
      const right = level[i + 1] ?? left // odd node hashes with itself
      next.push(await sha256hex(left + right))
    }
    level = next
  }
  return level[0]
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface LexiconAnchorRecord {
  merkleRoot: string
  wordCount: number
  anchoredAt: string      // ISO 8601
  txHash: string | null   // null if anchor failed (record still written locally)
  chainId: number         // 137 = Polygon PoS
  protocolVersion: string
}

// Compute the current merkle root from the user's personal lexicon
export async function computeLexiconMerkleRoot(uid: string): Promise<{
  root: string
  wordCount: number
  leaves: string[]
} | null> {
  if (!db) return null

  const ref = collection(db, 'glossary')
  const q = query(
    ref,
    where('user_id', '==', uid),
    where('personal', '==', true),
    orderBy('created_at', 'asc')
  )
  const snap = await getDocs(q)
  if (snap.empty) return null

  const words = snap.docs.map(d => ({ id: d.id, ...d.data() } as any))
  const leaves = await Promise.all(words.map(hashWord))
  const root = await buildMerkleRoot(leaves)

  return { root, wordCount: words.length, leaves }
}

// Anchor the current lexicon root on-chain and record the result
export async function anchorLexicon(uid: string): Promise<LexiconAnchorRecord | null> {
  if (!db) return null

  const computed = await computeLexiconMerkleRoot(uid)
  if (!computed) return null

  // Call the existing consent-anchor relay — reuse the same endpoint
  // The route accepts any 64-char hex hash
  let txHash: string | null = null
  try {
    const res = await fetch('/api/consent-anchor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consentHash: computed.root }),
    })
    if (res.ok) {
      const data = await res.json()
      txHash = data.txHash ?? null
    }
  } catch {
    // non-blocking — record still written without txHash
  }

  const record: LexiconAnchorRecord = {
    merkleRoot: computed.root,
    wordCount: computed.wordCount,
    anchoredAt: new Date().toISOString(),
    txHash,
    chainId: 137,
    protocolVersion: RESEARCH_PROTOCOL_VERSION,
  }

  // Store the anchor record in the passport silo
  const anchorRef = doc(
    db, 'passport', uid, 'lexiconAnchors',
    new Date().toISOString().replace(/[:.]/g, '-')
  )
  await setDoc(anchorRef, record)

  // Update the passport meta document with the latest anchor
  const metaRef = doc(db, 'passport', uid)
  await setDoc(metaRef, {
    latest_lexicon_anchor: record.merkleRoot,
    latest_lexicon_anchor_tx: txHash,
    latest_lexicon_anchor_at: record.anchoredAt,
    latest_lexicon_word_count: computed.wordCount,
  }, { merge: true })

  return record
}

// Read the anchor history for a user (for display in My Record)
export async function getLexiconAnchorHistory(uid: string): Promise<LexiconAnchorRecord[]> {
  if (!db) return []
  const ref = collection(db, 'passport', uid, 'lexiconAnchors')
  const q = query(ref, orderBy('anchoredAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data() as LexiconAnchorRecord)
}

// Verify the current lexicon matches a stored anchor
export async function verifyLexiconAnchor(
  uid: string,
  anchor: LexiconAnchorRecord
): Promise<boolean> {
  const computed = await computeLexiconMerkleRoot(uid)
  if (!computed) return false
  return computed.root === anchor.merkleRoot
}

// Auto-anchor trigger — call after every word add
// Only fires on every 10th word to avoid excessive chain writes
export async function maybeAutoAnchor(uid: string, currentWordCount: number): Promise<void> {
  if (currentWordCount > 0 && currentWordCount % 10 === 0) {
    anchorLexicon(uid) // fire and forget — non-blocking
  }
}
```

---

## Hook into Glossary Writes

### File: `lib/glossary.ts`

After a successful personal word add, call `maybeAutoAnchor`:

```typescript
import { maybeAutoAnchor } from './lexiconAnchor'

// In addUserWord, after the addDoc and existing research/silo calls:
if (word.personal && researchContext?.uid) {
  const count = /* get current personal word count — read from passport meta or pass in */
  await maybeAutoAnchor(researchContext.uid, count)
}
```

The simplest approach for `count`: read `passport/{uid}.lexicon_count` from the silo meta document (already maintained by `bumpPassportLexiconCount` from Phase 3.1).

---

## Surface in My Record

### File: `components/record/LexiconPanel.tsx`

Add an anchor section below the wheel distribution bars.

**When a valid anchor exists:**
```
OWNERSHIP RECORD
Last anchored: 8 May 2026  ·  47 words  ·  [Verify on Polygon ↗]
[Anchor now]
```

**When no anchor exists yet:**
```
[Anchor my lexicon]
Prove ownership of your vocabulary on the Polygon blockchain.
```

The `[Anchor now]` / `[Anchor my lexicon]` button calls `anchorLexicon(uid)` and shows a loading state while the transaction is submitted. On success, shows the tx hash link. On failure (chain unavailable), shows: "Anchored locally — chain confirmation pending."

**Verification:**
Below the anchor record, a subtle `[Verify integrity →]` link runs `verifyLexiconAnchor` against the latest anchor and shows either:
- `✓ Lexicon matches anchor` — in emerald
- `⚠ Lexicon has changed since last anchor` — in amber, with `[Anchor updated lexicon]`

---

## Firestore Security Rules Addition

```javascript
match /passport/{uid}/lexiconAnchors/{anchorId} {
  allow read, write: if request.auth.uid == uid
}
```

Add inside the existing `match /passport/{uid}/{document=**}` rule from Phase 3.1.

---

## Files to Create

```
lib/lexiconAnchor.ts
```

## Files to Modify

```
lib/glossary.ts                      — call maybeAutoAnchor after personal word adds
components/record/LexiconPanel.tsx   — anchor button + verification + tx link
```

## Files NOT to Touch

```
app/api/consent-anchor/route.ts   — reused as-is, no changes
phraseAcousticAnalysis.ts
StepSequencer.tsx
SolarSystemResonance.tsx
lib/researchLogging.ts
```

---

## What This Delivers

After Phase 3.3:
- Every 10 personal words added, the lexicon is silently anchored on-chain
- The user can manually anchor at any time from My Record
- The user can verify their current lexicon matches any historical anchor
- A "Verify on Polygon ↗" link makes the proof independently accessible
- The `passport/{uid}/lexiconAnchors/` subcollection is a permanent ownership history

The user's vocabulary is provably theirs. Not by the operator's assertion. By the chain.

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Phase 3.3 of PASSPORT_ROADMAP.md*
*Companion: BLOCKCHAIN_SOVEREIGNTY_NOTE.md, LEARNERS_PASSPORT_CONCEPT.md*
