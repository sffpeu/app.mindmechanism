# Longitudinal Phrase Progress — Build Brief
### Phase 1.4 — Cursor Implementation Brief
**Version 1.0 | 2026-05-08**

---

## What This Is

The per-session phrase data is already being written to Firestore at `users/{uid}/phraseProgress/{phraseHash}/sessions/{sessionId}`. Phase 1.4 makes that data useful — to the user and to the research programme.

Two things are built here:

1. **A phrase summary document** — written alongside each session, giving efficient access to the user's per-phrase headline stats without loading all sessions
2. **A progression curve component** — shown in the sequencer page after a session completes, displaying the user's consistency score trajectory across all sessions for the current phrase

This is the first moment the user sees themselves improving. That is the intrinsic motivation payload.

---

## 1. Phrase Summary Document

### Current write location

Sessions write to:
```
users/{uid}/phraseProgress/{phraseHash}/sessions/{sessionId}
```

The `phraseHash` document itself (`users/{uid}/phraseProgress/{phraseHash}`) does not currently have any fields set — it is implicitly created by the subcollection.

### Add a summary write alongside every session write

In `app/sequencer/page.tsx`, inside `handlePoolFinished`, after the session `setDoc`, add a `setDoc` (with merge) to the parent document:

```typescript
// Alongside the existing session write:
await setDoc(
  doc(db as Firestore, 'users', user.uid, 'phraseProgress', ph),
  {
    phrase: sequencer.sequence.mantraText.trim(),
    ipaText: sequencer.sequence.ipaText.trim(),
    latestScore: compare.consistencyScore,
    latestSessionAt: Date.now(),
    sessionCount: increment(1),          // Firestore FieldValue.increment
    bestScore: null,                     // see note below
    firstSessionAt: serverTimestamp(),   // only set on first write if using merge
  },
  { merge: true }
)
```

**On `bestScore`:** Firestore has no `Math.max` server-side operation. Use a Cloud Function or client-side conditional: before writing, read the current `bestScore` and only update it if `compare.consistencyScore > currentBest`. Since this is non-critical and the document is already being read as part of the session flow, a client-side conditional is acceptable at this stage.

Simplified approach — read then write:

```typescript
const summaryRef = doc(db as Firestore, 'users', user.uid, 'phraseProgress', ph)
const summarySnap = await getDoc(summaryRef)
const currentBest = summarySnap.exists() ? (summarySnap.data().bestScore ?? 0) : 0

await setDoc(summaryRef, {
  phrase: sequencer.sequence.mantraText.trim(),
  ipaText: sequencer.sequence.ipaText.trim(),
  latestScore: compare.consistencyScore,
  latestSessionAt: Date.now(),
  sessionCount: increment(1),
  bestScore: Math.max(currentBest, compare.consistencyScore),
  ...(summarySnap.exists() ? {} : { firstSessionAt: Date.now() }),
}, { merge: true })
```

### Summary document shape

```
users/{uid}/phraseProgress/{phraseHash}
  phrase: string                  — the phrase text
  ipaText: string                 — IPA notation
  latestScore: number             — most recent consistency score (0–100)
  bestScore: number               — highest score achieved
  sessionCount: number            — total completed sessions
  firstSessionAt: number          — epoch ms of first session
  latestSessionAt: number         — epoch ms of most recent session
```

---

## 2. Read Function — `lib/phraseProgress.ts`

New file. All phrase progress reads live here.

```typescript
import { collection, doc, getDoc, getDocs, orderBy, query, limit } from 'firebase/firestore'
import { db } from './firebase'

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

// All phrase summaries for a user — for the My Record view (Phase 2)
export async function getUserPhraseSummaries(uid: string): Promise<PhraseSummary[]> {
  if (!db) return []
  const ref = collection(db, 'users', uid, 'phraseProgress')
  const snap = await getDocs(ref)
  return snap.docs
    .map(d => ({ phraseHash: d.id, ...d.data() } as PhraseSummary))
    .filter(s => s.sessionCount > 0)
    .sort((a, b) => b.latestSessionAt - a.latestSessionAt)
}

// Session history for a single phrase — for the progression curve
export async function getPhraseSessionHistory(
  uid: string,
  phraseHash: string,
  maxSessions = 20
): Promise<PhraseSession[]> {
  if (!db) return []
  const ref = collection(db, 'users', uid, 'phraseProgress', phraseHash, 'sessions')
  const q = query(ref, orderBy('createdAt', 'desc'), limit(maxSessions))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({
    sessionId: d.id,
    ...d.data()
  } as PhraseSession)).reverse()  // chronological order for the chart
}
```

---

## 3. Progression Curve Component — `components/sequencer/PhraseProgressCurve.tsx`

A compact visual showing consistency score across sessions for the current phrase. Shown in the sequencer page immediately after a session completes — sits between the pattern comparison block and the StepSequencer.

### Design

No third-party chart library. Build with SVG directly — it is simple enough.

The curve is a small sparkline-style chart:
- Height: 80px fixed
- Width: fills its container
- X axis: sessions (oldest left, newest right), evenly spaced
- Y axis: consistency score 0–100, no labels
- Line: smooth polyline in the active wheel's colour (or neutral if no wheel assigned)
- Latest point: filled circle, slightly larger
- Best score: subtle horizontal dashed line
- Session count: `"7 sessions"` in `text-[10px] text-gray-400` above the chart

```
7 sessions                                      Best: 84
 ┌────────────────────────────────────────────────────┐
 │                                          ●         │ — — — — — — — (best score line)
 │                             ╱‾‾‾‾‾╲    ╱           │
 │              ╱‾‾╲    ╱‾‾‾‾╱       ╲──╱             │
 │   ╱‾╲   ╱‾‾╱    ╲──╱                               │
 │  ╱   ╲─╱                                           │
 └────────────────────────────────────────────────────┘
```

### Component props

```typescript
interface PhraseProgressCurveProps {
  sessions: PhraseSession[]    // from getPhraseSessionHistory
  bestScore: number
  phraseText: string
}
```

### Loading state

Show a ghosted placeholder (same dimensions, subtle pulse animation) while sessions are loading. If `sessions.length < 2`, show a single neutral message: `"Complete another session to see your progression."` — do not render the chart with a single point.

### Empty state (no sessions yet)

Not shown — this component only renders after `handlePoolFinished` has fired at least once.

---

## 4. Integration in `app/sequencer/page.tsx`

After the pattern comparison block and before the StepSequencer, add:

```tsx
{/* Phrase progression — shown after first session */}
{phraseHash && user?.uid && (
  <PhraseProgressCurve
    uid={user.uid}
    phraseHash={phraseHash}
  />
)}
```

The component fetches its own data (the session history) on mount and refreshes after each `handlePoolFinished` call. Pass a `refreshKey` prop that changes after each pool completion to trigger a refetch:

```tsx
const [progressRefreshKey, setProgressRefreshKey] = useState(0)

// In handlePoolFinished, after the writes:
setProgressRefreshKey(k => k + 1)
```

`phraseHash` is already derived in the component from `sequencer.sequence.mantraText` and `sequencer.sequence.ipaText` — expose it as state or derive it inline.

---

## 5. `phraseHash` Function — Move to Shared Location

The `phraseHash` function is currently defined inline in `app/sequencer/page.tsx`. Move it to `lib/phraseProgress.ts` so it can be used from both the sequencer page and any future My Record view without duplication.

```typescript
// In lib/phraseProgress.ts
export function phraseHash(key: string): string {
  // simple djb2 hash — same implementation as currently in page.tsx
  let hash = 5381
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) + hash) ^ key.charCodeAt(i)
  }
  return Math.abs(hash).toString(36)
}
```

---

## Files to Create

```
lib/phraseProgress.ts                          — summary + session read functions + phraseHash
components/sequencer/PhraseProgressCurve.tsx   — SVG sparkline component
```

## Files to Modify

```
app/sequencer/page.tsx    — add summary write, mount PhraseProgressCurve, move phraseHash usage
```

## Files NOT to Touch

```
phraseAcousticAnalysis.ts
StepSequencer.tsx         — unless strictly needed for the refreshKey pattern
lib/researchLogging.ts
SolarSystemResonance.tsx
```

---

## What This Does NOT Build

- The My Record view (Phase 2.1) — which will use `getUserPhraseSummaries` across all phrases
- Category C research logging of consistency scores (requires DPIA first)
- Phrase comparison across users (research aggregation — later phase)

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Phase 1.4 of PASSPORT_ROADMAP.md*
*Companion: PHRASE_DIAGNOSTIC_BRIEF.md (existing acoustic analysis spec)*
