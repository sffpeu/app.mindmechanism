# Holder-Controlled Key Infrastructure — Build Brief
### Phase 3.2 — Cursor Implementation Brief
**Version 1.0 | 2026-05-08**

---

## What This Is

Phase 3.1 built the encryption primitives and attached them to the Personal Lexicon. Phase 3.2 makes the key a first-class citizen of the application architecture — initialised at sign-in, available throughout the app without repeated IndexedDB reads, and extended to cover phrase pool notes. The Passport silo becomes the primary write target for encrypted personal data.

Four changes:

1. **PassportKeyProvider** — React context holding the decrypted key in memory for the session
2. **Key initialisation at sign-in** — the key exists before the user writes their first personal word
3. **Phrase notes encryption** — pool appraisal notes are personal narrative, encrypted before Firestore write
4. **Silo as primary write target** — phrase progress moves to `passport/{uid}/phrases/` as primary, with backward-compatible reads

---

## 1. PassportKeyProvider

### New file: `components/passport/PassportKeyProvider.tsx`

A context provider that loads the passport key once on mount (when the user is authenticated) and makes it available via `usePassportKey()` throughout the app. Components no longer call `getOrCreatePassportKey()` directly — they consume the context.

```typescript
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { getOrCreatePassportKey, getKeyFingerprint } from '@/lib/passportCrypto'

interface PassportKeyContextValue {
  key: CryptoKey | null
  fingerprint: string | null
  ready: boolean      // true once the key load attempt has completed (key may still be null)
  regenerate: () => Promise<void>   // force new key generation (for key rotation — Phase 3+)
}

const PassportKeyContext = createContext<PassportKeyContextValue>({
  key: null,
  fingerprint: null,
  ready: false,
  regenerate: async () => {},
})

export function PassportKeyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [key, setKey] = useState<CryptoKey | null>(null)
  const [fingerprint, setFingerprint] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!user?.uid) {
      setKey(null)
      setFingerprint(null)
      setReady(false)
      return
    }

    getOrCreatePassportKey()
      .then(async k => {
        setKey(k)
        setFingerprint(await getKeyFingerprint(k))
        setReady(true)
      })
      .catch(() => {
        setKey(null)
        setReady(true)  // ready = true even on failure — avoids infinite loading states
      })
  }, [user?.uid])

  const regenerate = async () => {
    const k = await generatePassportKey()  // import from passportCrypto
    setKey(k)
    setFingerprint(await getKeyFingerprint(k))
  }

  return (
    <PassportKeyContext.Provider value={{ key, fingerprint, ready, regenerate }}>
      {children}
    </PassportKeyContext.Provider>
  )
}

export function usePassportKey(): PassportKeyContextValue {
  return useContext(PassportKeyContext)
}
```

### Mount in `app/LayoutContent.tsx`

Wrap the authenticated shell with `PassportKeyProvider`:

```tsx
import { PassportKeyProvider } from '@/components/passport/PassportKeyProvider'

// Inside the authenticated section of LayoutContent:
<PassportKeyProvider>
  {/* existing app shell */}
</PassportKeyProvider>
```

The provider is a no-op when the user is not authenticated — the key stays null and `ready` stays false.

### Update `lib/glossary.ts`

The encrypt/decrypt calls in Phase 3.1 used `getOrCreatePassportKey()` directly. Update them to accept a `key` parameter passed from the calling component via `usePassportKey()`:

```typescript
// Before: key fetched inside the function
// After: key passed as parameter
export async function addUserWord(
  word: Omit<GlossaryWord, 'id' | 'created_at'>,
  options?: {
    researchContext?: { uid: string; profile: UserProfile | null }
    passportKey?: CryptoKey   // from usePassportKey().key
  }
): Promise<GlossaryWord | null>
```

The `passportKey` is optional — if absent, personal fields are written unencrypted (backward compatible). All callers that have access to the key (which is now any component inside `PassportKeyProvider`) should pass it.

---

## 2. Phrase Pool Notes Encryption

### Context

The `notes` field on each phrase pool in `StepSequencer.tsx` is the user's appraisal of their own take — personal, narrative, unstructured. Currently it is written to Firestore as plaintext inside the session document.

### Where the notes are written

In `app/sequencer/page.tsx`, inside `handlePoolFinished`, the session document write includes:

```typescript
// Current write to users/{uid}/phraseProgress/{ph}/sessions/{sessionId}
// notes is not currently written — check if poolIndex's notes should be passed
```

Check the current `handlePoolFinished` signature — it receives `{ poolIndex, blob, durationSec }`. The notes for the pool are in `StepSequencer`'s local state. To encrypt them, notes must be passed out via `onPoolFinished`.

### Update `StepSequencer` props

Add `notes` to the `onPoolFinished` payload:

```typescript
// In StepSequencer.tsx — update the callback
onPoolFinished({ poolIndex, blob, durationSec, notes: pools[poolIndex].notes })
```

Update the type in the parent's `handlePoolFinished`:

```typescript
const handlePoolFinished = async ({
  blob,
  poolIndex,
  durationSec,
  notes,
}: {
  poolIndex: number
  blob: Blob
  durationSec: number
  notes: string
}) => { ... }
```

### Encrypt notes before Firestore write

In `handlePoolFinished`, after computing `compare`, encrypt notes using the key from `usePassportKey()`:

```typescript
const { key: passportKey } = usePassportKey()

// In handlePoolFinished:
let encryptedNotes: string | undefined
let notesEncrypted = false
if (notes.trim() && passportKey) {
  encryptedNotes = await encryptField(notes.trim(), passportKey)
  notesEncrypted = true
}

// Add to Firestore session write:
{
  ...existingFields,
  notes: encryptedNotes ?? notes.trim() ?? null,
  notesEncrypted,
}
```

Add `notes?: string` and `notesEncrypted?: boolean` to the `PhraseSession` type in `lib/phraseProgress.ts`. Decrypt on read if `notesEncrypted === true` using the key from context.

---

## 3. Silo as Primary Write Target for Phrase Progress

### Current write path

```
users/{uid}/phraseProgress/{phraseHash}/sessions/{sessionId}
users/{uid}/phraseProgress/{phraseHash}  (summary document)
```

### New primary write path

```
passport/{uid}/phrases/{phraseHash}/sessions/{sessionId}
passport/{uid}/phrases/{phraseHash}  (summary document)
```

### Migration approach

Write to **both** paths during the transition period. Reads check the silo first; fall back to the legacy path. This ensures no data loss and gives existing sessions time to be migrated.

In `app/sequencer/page.tsx`, `handlePoolFinished` — write session document to both paths:

```typescript
// Primary: silo
const siloSessionRef = doc(
  db, 'passport', user.uid, 'phrases', ph, 'sessions', sessionId
)
// Legacy: backward compat
const legacySessionRef = doc(
  db, 'users', user.uid, 'phraseProgress', ph, 'sessions', sessionId
)

await Promise.all([
  setDoc(siloSessionRef, sessionData),
  setDoc(legacySessionRef, sessionData),  // write to both during transition
])
```

Update `lib/phraseProgress.ts` — `getPhraseSessionHistory` and `getUserPhraseSummaries` to check silo first:

```typescript
export async function getPhraseSessionHistory(
  uid: string,
  phraseHash: string,
  maxSessions = 20
): Promise<PhraseSession[]> {
  if (!db) return []

  // Try silo first
  const siloRef = collection(db, 'passport', uid, 'phrases', phraseHash, 'sessions')
  const siloQ = query(siloRef, orderBy('createdAt', 'desc'), limit(maxSessions))
  const siloSnap = await getDocs(siloQ)

  if (!siloSnap.empty) {
    return siloSnap.docs.map(d => ({ sessionId: d.id, ...d.data() } as PhraseSession)).reverse()
  }

  // Fall back to legacy path
  const legacyRef = collection(db, 'users', uid, 'phraseProgress', phraseHash, 'sessions')
  const legacyQ = query(legacyRef, orderBy('createdAt', 'desc'), limit(maxSessions))
  const legacySnap = await getDocs(legacyQ)
  return legacySnap.docs.map(d => ({ sessionId: d.id, ...d.data() } as PhraseSession)).reverse()
}
```

---

## 4. Key Rotation

### When needed

- User suspects their key has been compromised
- User gets a new device and wants to establish a fresh key
- Periodic rotation preference

### Mechanism

Add to `lib/passportCrypto.ts`:

```typescript
export async function rotatePassportKey(
  oldKey: CryptoKey,
  getAllEncryptedData: () => Promise<Array<{ ref: any; fields: Record<string, string> }>>
): Promise<CryptoKey> {
  // 1. Generate new key
  const newKey = await generatePassportKey()

  // 2. Re-encrypt all encrypted fields with new key
  const records = await getAllEncryptedData()
  await Promise.all(records.map(async ({ ref, fields }) => {
    const reEncrypted: Record<string, string> = {}
    for (const [field, ciphertext] of Object.entries(fields)) {
      const plain = await decryptField(ciphertext, oldKey)
      reEncrypted[field] = await encryptField(plain, newKey)
    }
    await updateDoc(ref, reEncrypted)
  }))

  return newKey
}
```

Surface a "Rotate encryption key" option in Settings > Encryption Key, behind a confirmation step. This is an advanced operation — clearly label it as such. Do not make it prominent. The primary actions are backup and restore.

---

## 5. Firestore Security Rules Update

Extend the `passport/` rules from Phase 3.1 to cover the phrases subcollection:

```javascript
match /passport/{uid}/{document=**} {
  allow read, write: if request.auth.uid == uid
}
```

The wildcard already covers `phrases/`, `phrases/{phraseHash}/sessions/`, and any future subcollections. No change needed if Phase 3.1 rules were written this way — confirm and leave as is.

---

## Files to Create

```
components/passport/PassportKeyProvider.tsx
```

## Files to Modify

```
app/LayoutContent.tsx                    — mount PassportKeyProvider
lib/glossary.ts                          — accept passportKey param, remove internal key fetch
lib/phraseProgress.ts                    — silo-first reads, add notes field + decryption
lib/passportCrypto.ts                    — add rotatePassportKey, export generatePassportKey
components/StepSequencer.tsx             — include notes in onPoolFinished payload
app/sequencer/page.tsx                   — use usePassportKey(), encrypt notes, dual-write to silo
components/settings/AccountSettings.tsx  — add key rotation option (advanced, behind confirmation)
```

## Files NOT to Touch

```
phraseAcousticAnalysis.ts
SolarSystemResonance.tsx
lib/researchLogging.ts
app/api/consent-anchor/route.ts
lib/consentAnchor.ts
```

---

## What Phase 3.2 Delivers

The passport key is now a session-level resource — loaded once at sign-in, available throughout the app via context. Encryption happens transparently at every write point that handles personal narrative. The silo is the primary address for phrase progress data. Key rotation is possible.

The platform's database now holds:
- `own_definition`: ciphertext
- `context`: ciphertext
- phrase pool `notes`: ciphertext
- Everything else: plaintext (non-sensitive operational data)

The key that decrypts all of this exists only in the user's browser. The platform cannot read the ciphertext. The backup file the user downloaded is the recovery path.

**Phase 3.3 follows:** Personal Lexicon Ownership Anchoring — a merkle root of the user's encrypted lexicon committed to Polygon, giving them cryptographic proof of ownership that predates any platform dispute.

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Phase 3.2 of PASSPORT_ROADMAP.md*
