# Node Affinity Profile — Build Brief
### Phase 1.5 — Cursor Implementation Brief
**Version 1.0 | 2026-05-08**

---

## What This Is

The node affinity profile is the user's somatic practice map — which of the nine wheels they return to across sessions, expressed as a proportional distribution. It is a personal reflection tool, not an evaluation. It shows the user where their practice has been living.

This is **Category A operational data** — it is always written, regardless of research consent, because it belongs to the user's own record. It does not leave their account. It is not aggregated with other users' data. It is displayed back to them as a self-portrait of their practice.

The research stream (Category B `sequencer_session` events — Phase 1.3) captures the same underlying data for anonymised aggregation. That is a separate write to a separate collection. This brief is solely about the user's own affinity record.

---

## Data Architecture

### Session log — always written on sequencer stop

```
users/{uid}/nodeAffinityLog/{sessionId}
  timestamp: number              — epoch ms
  nodeFires: Record<string, number>  — { '0': 4, '3': 12, '7': 2 } — fires per node this session
  totalFires: number             — sum of all nodeFires values
```

Only sessions where `totalFires > 0` are written. Empty sessions are not logged.

The `sessionId` is the ISO timestamp string at stop time — same pattern as phrase session IDs.

### Affinity profile — computed, not stored

The affinity vector is derived client-side from the session log. No pre-computed profile document is stored — the computation is cheap, the dataset is small, and computing it fresh ensures the rolling window is always accurate.

**Rolling window:** 28 days (4 weeks). Sessions older than 28 days are excluded from the current profile but remain in the log for historical reference.

**Affinity vector:** For each node 0–8, the proportion of total fires in the window attributed to that node. Values sum to 1.0. Nodes with zero fires have affinity 0.

```
affinityVector[i] = nodeFires[i] / totalFiresInWindow
```

---

## 1. New File: `lib/nodeAffinity.ts`

```typescript
import { collection, addDoc, getDocs, orderBy, query, where, Timestamp } from 'firebase/firestore'
import { db } from './firebase'

export interface NodeAffinitySession {
  sessionId: string
  timestamp: number
  nodeFires: Record<number, number>
  totalFires: number
}

export interface NodeAffinityProfile {
  vector: number[]        // 9 values, index = wheel 0–8, sum = 1.0
  totalSessions: number   // sessions in the rolling window
  totalFires: number      // total step fires in the rolling window
  windowDays: number      // always 28
  computedAt: number      // epoch ms
}

const WINDOW_MS = 28 * 24 * 60 * 60 * 1000  // 28 days

export async function logNodeAffinitySession(
  uid: string,
  nodeFires: Record<number, number>
): Promise<void> {
  if (!db) return
  const totalFires = Object.values(nodeFires).reduce((a, b) => a + b, 0)
  if (totalFires === 0) return

  const ref = collection(db, 'users', uid, 'nodeAffinityLog')
  await addDoc(ref, {
    timestamp: Date.now(),
    nodeFires,
    totalFires,
  })
}

export async function computeNodeAffinityProfile(uid: string): Promise<NodeAffinityProfile> {
  const empty: NodeAffinityProfile = {
    vector: Array(9).fill(0),
    totalSessions: 0,
    totalFires: 0,
    windowDays: 28,
    computedAt: Date.now(),
  }

  if (!db) return empty

  const cutoff = Date.now() - WINDOW_MS
  const ref = collection(db, 'users', uid, 'nodeAffinityLog')
  const q = query(ref, where('timestamp', '>=', cutoff), orderBy('timestamp', 'asc'))
  const snap = await getDocs(q)

  if (snap.empty) return empty

  const totals: Record<number, number> = {}
  let grandTotal = 0
  let sessionCount = 0

  snap.docs.forEach(d => {
    const data = d.data()
    const fires = data.nodeFires as Record<string, number>
    Object.entries(fires).forEach(([node, count]) => {
      const n = parseInt(node)
      totals[n] = (totals[n] ?? 0) + count
      grandTotal += count
    })
    sessionCount++
  })

  const vector = Array.from({ length: 9 }, (_, i) =>
    grandTotal > 0 ? (totals[i] ?? 0) / grandTotal : 0
  )

  return {
    vector,
    totalSessions: sessionCount,
    totalFires: grandTotal,
    windowDays: 28,
    computedAt: Date.now(),
  }
}
```

---

## 2. Hook into StepSequencer

### File: `components/StepSequencer.tsx`

The Phase 1.3 brief already specified adding session tracking refs. If that was implemented, these refs exist:

```typescript
const sessionNodeUsage = useRef<Record<number, number>>({})
const sessionStepCount = useRef<number>(0)
```

If not, add them now.

**In `playHitsAtStep`** (wherever steps fire during playback), increment per-node:

```typescript
// trackIndex is already the wheel index (0–8)
sessionNodeUsage.current[trackIndex] = (sessionNodeUsage.current[trackIndex] ?? 0) + 1
sessionStepCount.current += 1
```

**On transport Stop**, after the existing research logging call, add:

```typescript
await logNodeAffinitySession(user.uid, { ...sessionNodeUsage.current })
// reset
sessionNodeUsage.current = {}
sessionStepCount.current = 0
```

`user` comes from `useAuth()` — already present in `StepSequencer.tsx`.

---

## 3. Node Affinity Display Component

### File: `components/sequencer/NodeAffinityMap.tsx`

A compact nine-segment visual. Each segment represents one wheel. The segment size or fill reflects the wheel's proportion of total practice activity in the rolling window.

### Layout

A 3×3 grid mapping the nine wheels in their MM positions:

```
[ ROOT  ]  [ SACRAL ]  [ SOLAR PLEXUS ]
[ HEART ]  [ THROAT ]  [ THIRD EYE    ]
[ M CROWN] [ F CROWN]  [ ETH. HEART   ]
```

Each cell:
- A small square tile (equal width, responsive)
- Background: the wheel's colour at low opacity (8–12%) when affinity > 0; neutral when 0
- Fill bar: a vertical or horizontal fill inside the tile proportional to affinity (0–100%)
- Wheel name: `text-[9px] uppercase tracking-widest` in the wheel's colour
- Affinity value: `text-[11px] font-semibold` showing percentage (e.g. `34%`)
- If affinity is 0: tile is ghosted, no percentage shown

The dominant node — highest affinity value — gets a subtle ring or highlight treatment.

### Empty state

If `totalFires === 0` (no sessions in the last 28 days):

```
Your practice map builds as you use the sequencer.
Each session shapes the picture.
```

Centred, `text-xs text-gray-400`.

### Props

```typescript
interface NodeAffinityMapProps {
  profile: NodeAffinityProfile
}
```

The component does not fetch — it receives a computed profile. The parent fetches.

### Colour mapping

Use the existing wheel colour system in the codebase. The same colours used for wheel assignments in the glossary apply here. Reference `lib/clockTitles.ts` or `lib/sequencer.ts` for the colour values per wheel index.

---

## 4. Integration in `app/sequencer/page.tsx`

Fetch the affinity profile on mount and after each sequencer session:

```typescript
const [affinityProfile, setAffinityProfile] = useState<NodeAffinityProfile | null>(null)

useEffect(() => {
  if (!user?.uid) return
  computeNodeAffinityProfile(user.uid).then(setAffinityProfile)
}, [user?.uid])

// In handlePoolFinished, after existing writes:
if (user?.uid) {
  computeNodeAffinityProfile(user.uid).then(setAffinityProfile)
}
```

Mount the component below the phrase progression curve and above the StepSequencer:

```tsx
{affinityProfile && (
  <div className="mb-6 rounded-2xl border border-black/8 bg-white/60 px-5 py-5 shadow-sm dark:border-white/8 dark:bg-neutral-950/60">
    <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
      Your practice map — last 28 days
    </p>
    <NodeAffinityMap profile={affinityProfile} />
    {affinityProfile.totalSessions > 0 && (
      <p className="mt-3 text-[10px] text-gray-400">
        {affinityProfile.totalSessions} session{affinityProfile.totalSessions !== 1 ? 's' : ''} · {affinityProfile.totalFires.toLocaleString()} steps
      </p>
    )}
  </div>
)}
```

---

## Files to Create

```
lib/nodeAffinity.ts                           — session log write + profile computation
components/sequencer/NodeAffinityMap.tsx      — 3×3 grid visual
```

## Files to Modify

```
components/StepSequencer.tsx    — session tracking + logNodeAffinitySession on stop
app/sequencer/page.tsx          — fetch profile + mount NodeAffinityMap
```

## Files NOT to Touch

```
phraseAcousticAnalysis.ts
SolarSystemResonance.tsx
lib/researchLogging.ts
lib/phraseProgress.ts
```

---

## What Completes With This

Phase 1 of the Passport Roadmap is complete when this ships:

| Step | What it delivers |
|---|---|
| 1.1 Personal Lexicon | User's own vocabulary, in their own language |
| 1.2 Research Consent | Legal gate — freely given, granular, withdrawable |
| 1.3 Category B Logging | Universal Hypothesis dataset begins accumulating |
| 1.4 Phrase Progress | User sees their own consistency trajectory |
| 1.5 Node Affinity | User sees their somatic practice distribution |

The user now has a personal record — vocabulary, progression, somatic map. The research programme has its consent infrastructure and its first data stream. Phase 2 assembles these into a unified My Record view and begins the on-chain consent anchoring.

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Phase 1.5 of PASSPORT_ROADMAP.md — final step of Phase 1*
