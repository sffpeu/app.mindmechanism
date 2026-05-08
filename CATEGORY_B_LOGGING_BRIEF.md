# Category B Anonymised Logging — Build Brief
### Phase 1.3 — Cursor Implementation Brief
**Version 1.0 | 2026-05-08**

---

## What This Is

Phase 1.2 built the consent gate. Phase 1.3 is what goes through it.

Category B is the anonymised behavioural logging that powers the Universal Hypothesis research stream: which somatic wheels users assign vocabulary to, across languages. Every event is gated behind explicit consent (`researchConsent.categoryB.granted === true`). No event fires without it. No word text is ever written. No user ID is stored in plain form.

Reference: `DATA_COLLECTION_PROTOCOL.md` Category B definition. Field names must match exactly.

---

## New File: `lib/researchLogging.ts`

This is the sole location for all Category B write logic. No research logging is scattered across components. Everything flows through this module.

```typescript
import { collection, addDoc, Firestore } from 'firebase/firestore'
import { db } from './firebase'
import { RESEARCH_PROTOCOL_VERSION } from './researchProtocol'
import type { UserProfile } from './FirebaseAuthContext'

// Bins an ISO timestamp to the start of its week (Monday 00:00:00 UTC)
// Never logs a more precise timestamp than this
function binToWeek(isoString: string): string {
  const d = new Date(isoString)
  const day = d.getUTCDay()
  const diff = (day === 0 ? -6 : 1 - day)
  d.setUTCDate(d.getUTCDate() + diff)
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10) // 'YYYY-MM-DD'
}

// One-way hash of uid — prevents direct re-identification
// Uses SubtleCrypto — available in all modern browsers and Next.js edge/server
async function hashUid(uid: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(uid + '_mm_b_2026')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 24)
}

function hasConsentB(profile: UserProfile | null): boolean {
  return profile?.researchConsent?.categoryB?.granted === true
}

// ─── Event Types ──────────────────────────────────────────────────────────────

export interface CategoryBWheelEvent {
  event_type: 'wheel_assignment'
  user_hash: string           // 24-char hex, one-way hash of uid
  wheel_assigned: number      // 0–8
  word_language: string       // ISO 639-1
  word_grade: number          // vocabulary complexity grade
  week: string                // 'YYYY-MM-DD' — Monday of the event's week
  protocol_version: string
  research_excluded: boolean  // set to true if consent later withdrawn
}

export interface CategoryBSessionEvent {
  event_type: 'sequencer_session'
  user_hash: string
  node_usage: Record<number, number>  // { 0: 12, 3: 8, ... } — counts per node (0–8)
  total_steps_fired: number
  week: string
  protocol_version: string
  research_excluded: false
}

// ─── Log Functions ────────────────────────────────────────────────────────────

export async function logWheelAssignment(
  uid: string,
  profile: UserProfile | null,
  payload: {
    wheelIndex: number        // clock_id 0–8
    language: string          // word's language field
    grade: number             // word's grade field
  }
): Promise<void> {
  if (!hasConsentB(profile)) return
  if (!db) return

  const user_hash = await hashUid(uid)
  const event: CategoryBWheelEvent = {
    event_type: 'wheel_assignment',
    user_hash,
    wheel_assigned: payload.wheelIndex,
    word_language: payload.language || 'und',  // 'und' = undetermined (ISO 639-2)
    word_grade: payload.grade ?? 0,
    week: binToWeek(new Date().toISOString()),
    protocol_version: RESEARCH_PROTOCOL_VERSION,
    research_excluded: false,
  }

  const ref = collection(db as Firestore, 'research_b_events')
  await addDoc(ref, event)
}

export async function logSequencerSession(
  uid: string,
  profile: UserProfile | null,
  payload: {
    nodeUsage: Record<number, number>  // how many steps fired per node in this session
    totalStepsFired: number
  }
): Promise<void> {
  if (!hasConsentB(profile)) return
  if (!db) return
  if (payload.totalStepsFired === 0) return  // nothing to log for empty sessions

  const user_hash = await hashUid(uid)
  const event: CategoryBSessionEvent = {
    event_type: 'sequencer_session',
    user_hash,
    node_usage: payload.nodeUsage,
    total_steps_fired: payload.totalStepsFired,
    week: binToWeek(new Date().toISOString()),
    protocol_version: RESEARCH_PROTOCOL_VERSION,
    research_excluded: false,
  }

  const ref = collection(db as Firestore, 'research_b_events')
  await addDoc(ref, event)
}
```

**On the uid hash:** The salt `'_mm_b_2026'` is a fixed application-level constant, not a secret. It is sufficient to prevent casual reverse lookup while keeping the implementation simple and client-side. Per-export-batch salting (as specified in DATA_COLLECTION_PROTOCOL.md) applies at the point of research export, not at collection time. At collection time we need a stable identifier to link events from the same user across sessions.

---

## Hook Point 1 — Glossary Word Write

### File: `lib/glossary.ts`

The `addUserWord` and `updateUserWord` functions are the natural hook points. Log a `wheel_assignment` event when:
- A word is **added** with a `clock_id` set (not null/undefined)
- A word is **updated** and the update includes a `clock_id` change

The logging call receives `uid` and `profile` as parameters. These must be threaded in from the calling component. Do not call `useAuth()` inside `lib/glossary.ts` — it is not a React component. The caller passes them.

### Signature change for `addUserWord`:

```typescript
export async function addUserWord(
  word: Omit<GlossaryWord, 'id' | 'created_at'>,
  researchContext?: { uid: string; profile: UserProfile | null }
): Promise<GlossaryWord | null>
```

Inside the function, after the `addDoc` succeeds:

```typescript
if (researchContext && word.clock_id != null) {
  await logWheelAssignment(researchContext.uid, researchContext.profile, {
    wheelIndex: word.clock_id,
    language: word.language ?? 'und',
    grade: word.grade ?? 0,
  })
}
```

### Same pattern for `updateUserWord`:

```typescript
export async function updateUserWord(
  id: string,
  updates: Partial<GlossaryWord>,
  researchContext?: { uid: string; profile: UserProfile | null }
): Promise<GlossaryWord | null>
```

Only log if `updates.clock_id != null` — i.e. a wheel assignment is part of this update.

### Callers to update

Find all call sites of `addUserWord` and `updateUserWord` in the codebase and pass `{ uid: user.uid, profile }` from the local `useAuth()` context. The parameter is optional — if not passed, no logging occurs and the function behaves as before.

---

## Hook Point 2 — Sequencer Session End

### File: `components/StepSequencer.tsx`

Track node usage during playback. At session end (when the user stops playback or the phrase pool completes), log the session event.

**Inside StepSequencer**, add session tracking state:

```typescript
const sessionNodeUsage = useRef<Record<number, number>>({})
const sessionStepCount = useRef<number>(0)
```

**In the step playback logic** (wherever `playHitsAtStep` fires per step), increment:

```typescript
// For each active lane that fires at this step:
sessionNodeUsage.current[laneIndex] = (sessionNodeUsage.current[laneIndex] ?? 0) + 1
sessionStepCount.current += 1
```

**On stop/session end** (wherever the transport Stop is triggered):

```typescript
if (sessionStepCount.current > 0) {
  logSequencerSession(user.uid, profile, {
    nodeUsage: { ...sessionNodeUsage.current },
    totalStepsFired: sessionStepCount.current,
  })
}
// Reset for next session
sessionNodeUsage.current = {}
sessionStepCount.current = 0
```

`user` and `profile` come from `useAuth()` which is already available in `StepSequencer.tsx`.

---

## Firestore Collection: `research_b_events`

New top-level collection. Documents are append-only — no updates, no deletes (except consent withdrawal flagging, below).

### Document shape (both event types share the collection):

```
research_b_events/{auto-id}
  event_type: 'wheel_assignment' | 'sequencer_session'
  user_hash: string
  week: string
  protocol_version: string
  research_excluded: boolean
  // wheel_assignment fields:
  wheel_assigned?: number
  word_language?: string
  word_grade?: number
  // sequencer_session fields:
  node_usage?: Record<string, number>
  total_steps_fired?: number
```

---

## Consent Withdrawal — Flagging Existing Records

When a user sets `researchConsent.categoryB.granted = false` (via the Settings toggle built in Phase 1.2), their existing `research_b_events` records must be flagged `research_excluded: true`.

Add a function to `lib/researchLogging.ts`:

```typescript
export async function excludeUserResearchData(uid: string): Promise<void> {
  if (!db) return
  const user_hash = await hashUid(uid)

  const ref = collection(db as Firestore, 'research_b_events')
  const q = query(ref, where('user_hash', '==', user_hash), where('research_excluded', '==', false))
  const snap = await getDocs(q)

  const batch = writeBatch(db as Firestore)
  snap.docs.forEach(d => batch.update(d.ref, { research_excluded: true }))
  await batch.commit()
}
```

Call `excludeUserResearchData(uid)` from `ResearchParticipationSettings.tsx` when Category B is toggled off.

This satisfies the protocol requirement: "Withdrawal revokes future collection and flags existing records for exclusion from research aggregations."

---

## Firebase Security Rules Addition

Add to Firestore security rules:

```javascript
match /research_b_events/{eventId} {
  // Only authenticated users may write, and only their own hash
  // The rule cannot verify the hash server-side — we rely on the
  // client-side consent check in researchLogging.ts
  // Full server-side enforcement requires a Cloud Function — Phase 2
  allow write: if request.auth != null;
  allow read: if false;  // No client reads — research data is write-only from client
}
```

Note: full server-side consent enforcement (verifying the user's consent flag before writing) requires a Cloud Function intermediary. That is Phase 2 infrastructure. For Phase 1.3, the consent check is enforced client-side in `researchLogging.ts`. The security rule prevents unauthenticated writes and blocks all client reads.

---

## What This Does NOT Build

- Category C logging (acoustic data) — separate brief, requires DPIA completion first
- Practice frequency as a stored field — it is derived at query time from `sequencer_session` event density, not stored per-event
- The research dashboard showing users their contribution (Phase 2.3)
- Cloud Function consent enforcement (Phase 2)
- On-chain anchoring (Phase 2.4)

---

## Files to Create

```
lib/researchLogging.ts    — all Category B write logic
```

## Files to Modify

```
lib/glossary.ts                                  — add researchContext param to addUserWord + updateUserWord
components/StepSequencer.tsx                     — add session tracking + logSequencerSession on stop
components/settings/ResearchParticipationSettings.tsx — call excludeUserResearchData on categoryB toggle-off
```

## Files NOT to Touch

```
phraseAcousticAnalysis.ts
SolarSystemResonance.tsx
app/sequencer/page.tsx      — unless strictly necessary to pass researchContext to a glossary call
```

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Reference: DATA_COLLECTION_PROTOCOL.md — Category B definition, anonymisation standard, withdrawal protocol*
*Phase 1.3 of PASSPORT_ROADMAP.md*
