# Passport Identity — Build Brief
### Phase 3.4 — Cursor Implementation Brief
**Version 1.0 | 2026-05-08**

---

## What This Is

The Learner's Passport needs a portable identity — an identifier that travels with the user across platforms, that institutions can reference without contacting the originating platform, and that the user holds independently of their Mind Mechanism account.

Phase 3.4 derives this identifier from the user's existing passport key (already in IndexedDB from Phase 3.1/3.2). No new key material is generated. The passport identity is a deterministic, public identifier derived from the user's encryption key — analogous to how a blockchain wallet address is derived from a private key. It is safe to share publicly. It cannot be reversed to the key.

---

## The Identifier

The Passport ID is a 16-character uppercase hex string derived from the user's AES-256-GCM key fingerprint (already computed in `passportCrypto.ts`).

```typescript
// Passport ID = first 16 chars of SHA-256(keyFingerprint + 'mm-passport-id')
// uppercase for readability
```

Format: `MM-XXXX-XXXX-XXXX` — 16 hex chars split into groups of 4, prefixed with `MM-`.

Example: `MM-3A7F-C291-BE04-F6D8`

This is not a secret. It is a public reference. It appears in the user's My Record view, in their data export, and in any future institutional access requests. It identifies the Passport, not the person.

---

## New File: `lib/passportIdentity.ts`

```typescript
import { getOrCreatePassportKey, getKeyFingerprint } from './passportCrypto'
import { doc, setDoc, getDoc, type Firestore } from 'firebase/firestore'
import { db } from './firebase'

async function derivePassportId(fingerprint: string): Promise<string> {
  const raw = fingerprint + 'mm-passport-id'
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  const hex = Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16)
    .toUpperCase()
  return `MM-${hex.slice(0,4)}-${hex.slice(4,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}`
}

export async function getOrCreatePassportId(uid: string): Promise<string | null> {
  if (!db) return null

  // Check if already stored in passport silo
  const metaRef = doc(db as Firestore, 'passport', uid)
  const snap = await getDoc(metaRef)
  if (snap.exists() && snap.data().passport_id) {
    return snap.data().passport_id as string
  }

  // Derive from key
  const key = await getOrCreatePassportKey()
  if (!key) return null
  const fingerprint = await getKeyFingerprint(key)
  const passportId = await derivePassportId(fingerprint)

  // Store in silo
  await setDoc(metaRef, { passport_id: passportId }, { merge: true })

  return passportId
}
```

---

## Surface in My Record

### File: `components/record/MyRecordView.tsx`

Add the Passport ID to the page header — directly below the subtitle, before the Export button:

```tsx
import { getOrCreatePassportId } from '@/lib/passportIdentity'

// In useEffect, alongside phrase/affinity fetch:
getOrCreatePassportId(user.uid).then(setPassportId)

// In the header:
{passportId && (
  <div className="mt-3 flex items-center gap-2">
    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
      Passport ID
    </span>
    <span className="font-mono text-xs text-gray-700 dark:text-gray-300 tracking-wider">
      {passportId}
    </span>
    <button
      onClick={() => navigator.clipboard.writeText(passportId)}
      className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      title="Copy to clipboard"
    >
      Copy
    </button>
  </div>
)}
```

---

## Surface in Data Export

### File: `lib/dataExport.ts`

Add `passport_id` to the export:

```typescript
// In exportUserData, alongside account fields:
const passportId = await getOrCreatePassportId(uid)

// In the assembled export object:
account: {
  username: profile?.username ?? '',
  tier: profile?.tier ?? 'open',
  member_since: authCreationTime ?? null,
  passport_id: passportId ?? null,
},
```

---

## Surface in Research Status Panel

### File: `components/record/ResearchStatusPanel.tsx`

When the user has consented to research participation, show their Passport ID alongside the consent record — this is the identifier that links their (anonymised) research contributions to their Passport:

```
Your Passport ID: MM-3A7F-C291-BE04-F6D8
This identifier links your research contributions
to your Passport without revealing your identity.
```

---

## Firestore — Passport Meta Update

The `passport_id` field is added to the existing `passport/{uid}` document via `setDoc` merge. No new collections required.

Update the Firestore security rule to explicitly protect this field — it is already covered by the existing `match /passport/{uid}/{document=**}` rule from Phase 3.1, so no rule change is needed.

---

## What the Passport ID Is Not

- It is not a login credential
- It is not linked to the user's email or Firebase UID in any public record
- It cannot be used to access the user's data — it is a reference, not a key
- It is not stored in the research dataset — the `user_hash` in `research_b_events` is separate and unlinked to the Passport ID in any queryable way

---

## Files to Create

```
lib/passportIdentity.ts
```

## Files to Modify

```
components/record/MyRecordView.tsx         — Passport ID in header
lib/dataExport.ts                          — passport_id in account section
components/record/ResearchStatusPanel.tsx  — show ID alongside consent record
```

## Files NOT to Touch

```
phraseAcousticAnalysis.ts
StepSequencer.tsx
SolarSystemResonance.tsx
app/api/consent-anchor/route.ts
lib/researchLogging.ts
lib/lexiconAnchor.ts
```

---

## What Completes With This

Phase 3 is complete when 3.4 ships:

| Step | What it delivers |
|---|---|
| 3.1 Silo + Encryption | Personal narrative encrypted before Firestore |
| 3.2 Key Infrastructure | PassportKeyProvider, phrase notes encrypted, key rotation |
| 3.3 Lexicon Anchoring | Vocabulary ownership provable on-chain |
| 3.4 Passport Identity | Portable identifier derived from user's key |

The Passport is now structurally sovereign. The user holds their key, their vocabulary is encrypted and ownership-anchored, and they carry a portable identity that works across platforms. Phase 4 — the access economy — builds on this foundation.

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Phase 3.4 of PASSPORT_ROADMAP.md — final step of Phase 3*
*Companion: LEARNERS_PASSPORT_CONCEPT.md, BLOCKCHAIN_SOVEREIGNTY_NOTE.md*
