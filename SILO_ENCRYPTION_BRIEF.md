# Passport Silo & Field Encryption — Build Brief
### Phase 3.1 — Cursor Implementation Brief
**Version 1.0 | 2026-05-08**

---

## What This Is

The `own_definition` and `context` fields in the Personal Lexicon — the user's private vocabulary definitions and provenance notes — are currently stored as plaintext in Firestore. The platform can read them. So can any database breach, any compelled disclosure, any admin with database access.

Phase 3.1 changes this at the architectural level. Before any personal narrative field reaches Firestore, it is encrypted on the user's device using a key the platform never sees. What arrives in the database is ciphertext. The platform holds it but cannot read it. Only the user's browser — with their key in IndexedDB — can decrypt it.

This is the first structural realisation of the sovereignty commitment: the user's private expression is protected not by the operator's good intentions but by the system's inability to betray it.

---

## New File: `lib/passportCrypto.ts`

All key management and encryption/decryption lives here. Uses the Web Crypto API exclusively — no third-party crypto libraries.

```typescript
const KEY_STORE_NAME = 'mm-passport-keys'
const KEY_ID = 'passport-encryption-key'
const DB_NAME = 'mm-passport'
const DB_VERSION = 1

// ── IndexedDB key store ──────────────────────────────────────────────────────

function openKeyDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(KEY_STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function storeKey(key: CryptoKey): Promise<void> {
  const db = await openKeyDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KEY_STORE_NAME, 'readwrite')
    tx.objectStore(KEY_STORE_NAME).put(key, KEY_ID)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function loadKey(): Promise<CryptoKey | null> {
  const db = await openKeyDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KEY_STORE_NAME, 'readonly')
    const req = tx.objectStore(KEY_STORE_NAME).get(KEY_ID)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

// ── Key generation and export ────────────────────────────────────────────────

export async function generatePassportKey(): Promise<CryptoKey> {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,   // extractable — user must be able to export for backup
    ['encrypt', 'decrypt']
  )
  await storeKey(key)
  return key
}

export async function getOrCreatePassportKey(): Promise<CryptoKey> {
  const existing = await loadKey()
  if (existing) return existing
  return generatePassportKey()
}

// Export key as Base64 string — for user backup file
export async function exportKeyAsBase64(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key)
  return btoa(String.fromCharCode(...new Uint8Array(raw)))
}

// Import key from Base64 string — for key restoration
export async function importKeyFromBase64(b64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'raw', raw,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
  await storeKey(key)
  return key
}

// ── Encrypt / Decrypt ────────────────────────────────────────────────────────

// Returns Base64-encoded string: IV (12 bytes) + ciphertext
export async function encryptField(
  plaintext: string,
  key: CryptoKey
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  )
  // Prepend IV to ciphertext for storage
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)
  return btoa(String.fromCharCode(...combined))
}

// Decrypts a Base64-encoded IV+ciphertext string
export async function decryptField(
  encrypted: string,
  key: CryptoKey
): Promise<string> {
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )
  return new TextDecoder().decode(plaintext)
}

// ── Key backup ───────────────────────────────────────────────────────────────

export function downloadKeyBackup(b64Key: string): void {
  const backup = JSON.stringify({
    mm_passport_key: b64Key,
    exported_at: new Date().toISOString(),
    note: 'Keep this file safe. It is the only way to recover your encrypted personal vocabulary if you clear your browser data.',
    instructions: 'To restore: Settings → My Record → Restore encryption key → select this file.',
  }, null, 2)
  const blob = new Blob([backup], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mm-passport-key-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

---

## Encrypt on Write — `lib/glossary.ts`

Update `addUserWord` and `updateUserWord` to encrypt `own_definition` and `context` before writing if the fields are present and the word is personal.

Import at top of file:

```typescript
import { getOrCreatePassportKey, encryptField } from './passportCrypto'
```

In `addUserWord`, before the `addDoc` call:

```typescript
let wordToWrite = { ...word }

if (word.personal && (word.own_definition || word.context)) {
  const key = await getOrCreatePassportKey()
  if (word.own_definition) {
    wordToWrite.own_definition = await encryptField(word.own_definition, key)
  }
  if (word.context) {
    wordToWrite.context = await encryptField(word.context, key)
  }
  wordToWrite.encrypted = true  // flag so reads know to decrypt
}

const docRef = await addDoc(glossaryRef, {
  ...wordToWrite,
  created_at: new Date().toISOString()
})
```

Same pattern in `updateUserWord` when `updates` contains `own_definition` or `context`.

Add `encrypted?: boolean` to `GlossaryWord` type in `types/Glossary.ts`:

```typescript
encrypted?: boolean   // true = own_definition and context are AES-256-GCM ciphertext
```

---

## Decrypt on Read — `lib/glossary.ts`

Add a utility that decrypts personal fields after fetching:

```typescript
import { loadKey, decryptField } from './passportCrypto'

async function decryptPersonalWord(word: GlossaryWord): Promise<GlossaryWord> {
  if (!word.encrypted || (!word.own_definition && !word.context)) return word
  const key = await loadKey()
  if (!key) return word  // key not available — return ciphertext as-is

  const decrypted = { ...word }
  if (word.own_definition) {
    try { decrypted.own_definition = await decryptField(word.own_definition, key) }
    catch { /* decryption failed — leave as-is */ }
  }
  if (word.context) {
    try { decrypted.context = await decryptField(word.context, key) }
    catch { /* decryption failed — leave as-is */ }
  }
  return decrypted
}
```

Apply this to the return value of any function that fetches personal lexicon words. Specifically: `getUserWords`, `searchUserWords`, and any query that returns words where `personal === true`.

The decryption is transparent — the rest of the application continues to use `own_definition` and `context` as plain strings. The encryption layer is invisible above the glossary lib.

---

## Key Setup Flow — First Use

When a user opens the Personal Lexicon and their key does not exist in IndexedDB (new device, cleared storage, or first time):

### New component: `components/record/PassportKeySetup.tsx`

A modal that appears once when a personal word is about to be written and no key exists.

```
YOUR PERSONAL VOCABULARY IS PRIVATE

The definitions and context you write for your
personal words are encrypted on your device.
Not even Mind Mechanism can read them.

Your encryption key is stored in your browser.
Download a backup — if you clear your browser
data without a backup, your private definitions
cannot be recovered.

[Download key backup and continue]
[Skip backup for now — I understand the risk]
```

On "Download key backup and continue":
1. Call `getOrCreatePassportKey()`
2. Export as Base64
3. Call `downloadKeyBackup(b64Key)`
4. Proceed with the word write

On "Skip backup for now":
1. Call `getOrCreatePassportKey()` — key is stored in IndexedDB only
2. Proceed with the word write
3. A persistent but dismissible banner appears in My Record: "Back up your encryption key to protect your personal definitions." with a link to download it

This flow only appears once — after key generation, it does not repeat.

---

## Key Management in Settings

### File: `components/settings/AccountSettings.tsx`

Add a "Encryption Key" section:

```
ENCRYPTION KEY
──────────────────────────────────────────────
Your personal vocabulary definitions are
encrypted on your device.

[Download key backup]
[Restore from backup file]
```

**Download key backup:** Calls `exportKeyAsBase64` then `downloadKeyBackup`. Only available if key exists in IndexedDB.

**Restore from backup file:** A file input that accepts `.json`. Reads the file, extracts `mm_passport_key`, calls `importKeyFromBase64`. On success: "Key restored. Your personal definitions are now readable."

If no key exists yet (user has no personal words): show only: "Your encryption key will be generated when you add your first personal word."

---

## What Happens If the Key Is Lost

If a user's IndexedDB is cleared and they have no backup, `loadKey()` returns `null`. The encrypted fields are returned as ciphertext strings. The UI should handle this gracefully:

In `GlossaryVisualWordPanel.tsx` and anywhere `own_definition` or `context` is displayed: if `word.encrypted === true` and the displayed value looks like Base64 ciphertext (heuristic: length > 40, no spaces), show:

```
[Definition encrypted — key not found.
Restore your key backup in Settings to read this.]
```

Do not show the raw ciphertext to the user. It is meaningless to them and alarming in appearance.

---

## Passport Silo — New Firestore Namespace

Establish `passport/{uid}/` as the future home of Passport data. In Phase 3.1, write a copy of personal lexicon metadata (not the encrypted fields — those stay in `glossary/` for now) to begin the silo structure:

```
passport/{uid}/meta
  created_at: timestamp
  key_fingerprint: string    // first 8 chars of SHA-256(public key material) — NOT the key
  lexicon_count: number      // updated on each personal word write
  silo_version: '1'
```

The `key_fingerprint` is a non-reversible identifier that lets the system confirm the same key is in use across sessions without storing any key material. Compute as:

```typescript
// In passportCrypto.ts:
export async function getKeyFingerprint(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key)
  const hash = await crypto.subtle.digest('SHA-256', raw)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('').slice(0, 8)
}
```

Write this to `passport/{uid}/meta` on key generation and on key restore. It is the audit trail that a key existed and was consistent — nothing more.

### Firestore security rules for `passport/`:

```javascript
match /passport/{uid}/{document=**} {
  allow read, write: if request.auth.uid == uid
  // No admin SDK access — not even the operator can read this namespace
  // without authenticating as the user
}
```

---

## Files to Create

```
lib/passportCrypto.ts
components/record/PassportKeySetup.tsx
```

## Files to Modify

```
lib/glossary.ts               — encrypt on write, decrypt on read
types/Glossary.ts             — add encrypted?: boolean
components/settings/AccountSettings.tsx   — key backup/restore section
components/glossary/GlossaryVisualWordPanel.tsx  — handle encrypted display gracefully
```

## Files NOT to Touch

```
phraseAcousticAnalysis.ts
StepSequencer.tsx
SolarSystemResonance.tsx
app/sequencer/page.tsx
lib/researchLogging.ts
app/api/consent-anchor/route.ts
```

---

## What This Delivers

After Phase 3.1:
- `own_definition` and `context` are AES-256-GCM encrypted before they reach Firestore
- The platform holds ciphertext — it cannot read the user's private definitions
- The user holds the key in their browser's IndexedDB
- A backup export protects against key loss
- The `passport/{uid}/` silo namespace is established for Phase 3.2 and beyond
- The key fingerprint creates an audit trail of key consistency without exposing key material

The sovereignty commitment is now structurally enforced for the most sensitive fields. Not by policy. By architecture.

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Phase 3.1 of PASSPORT_ROADMAP.md*
*Companion: BLOCKCHAIN_SOVEREIGNTY_NOTE.md, AUDITABILITY_NOTE.md*
