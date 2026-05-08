# Research Participant Dashboard — Build Brief
### Phase 2.3 — Cursor Implementation Brief
**Version 1.0 | 2026-05-08**

---

## What This Is

The Research Participant Dashboard makes the research real to the user. A consenting user has been contributing anonymously to the Universal Hypothesis dataset — this is where they can see what they've contributed, what the research is trying to find out, and where the dataset stands. It is a window into the science, not a gamification layer.

It appears only for users with active Category B consent. It is read-only and carries no call to action.

---

## Architecture: Two Data Sources

The dashboard draws from two places:

**1. The user's own contribution summary** — stored at `users/{uid}/researchContribution/summary`, maintained by the logging functions. Shows their personal contribution count.

**2. A public research status document** — stored at `research_status/public` in Firestore, readable without authentication, manually maintained by the operator. Shows the wider dataset state.

---

## Part A — Contribution Summary Document

### Update `lib/researchLogging.ts`

Add a contribution counter write alongside every research event. After each successful `addDoc` to `research_b_events`, increment the user's contribution summary:

```typescript
import { doc, setDoc, increment as fsIncrement } from 'firebase/firestore'

async function incrementContribution(
  uid: string,
  field: 'wheel_assignment_count' | 'session_count'
): Promise<void> {
  if (!db) return
  const ref = doc(db, 'users', uid, 'researchContribution', 'summary')
  await setDoc(ref, {
    [field]: fsIncrement(1),
    contributing_since_b: field === 'wheel_assignment_count'
      ? undefined  // only set on first write via merge + serverTimestamp
      : undefined,
    last_contribution_at: Date.now(),
  }, { merge: true })
}
```

Call `incrementContribution(uid, 'wheel_assignment_count')` inside `logWheelAssignment` after the event write.
Call `incrementContribution(uid, 'session_count')` inside `logSequencerSession` after the event write.

For `contributing_since`: use a separate conditional write — only set it if the document doesn't already exist:

```typescript
// On first contribution only:
const summaryRef = doc(db, 'users', uid, 'researchContribution', 'summary')
const snap = await getDoc(summaryRef)
if (!snap.exists()) {
  await setDoc(summaryRef, { contributing_since: Date.now() }, { merge: true })
}
```

### Contribution summary document shape

```
users/{uid}/researchContribution/summary
  wheel_assignment_count: number    — total wheel assignments logged
  session_count: number             — total sequencer sessions logged
  contributing_since: number        — epoch ms of first contribution
  last_contribution_at: number      — epoch ms of most recent contribution
```

### Read function — add to `lib/researchLogging.ts`

```typescript
export interface UserContributionSummary {
  wheelAssignmentCount: number
  sessionCount: number
  contributingSince: number | null
  lastContributionAt: number | null
}

export async function getUserContributionSummary(uid: string): Promise<UserContributionSummary> {
  const empty = { wheelAssignmentCount: 0, sessionCount: 0, contributingSince: null, lastContributionAt: null }
  if (!db) return empty
  const ref = doc(db, 'users', uid, 'researchContribution', 'summary')
  const snap = await getDoc(ref)
  if (!snap.exists()) return empty
  const d = snap.data()
  return {
    wheelAssignmentCount: d.wheel_assignment_count ?? 0,
    sessionCount: d.session_count ?? 0,
    contributingSince: d.contributing_since ?? null,
    lastContributionAt: d.last_contribution_at ?? null,
  }
}
```

---

## Part B — Public Research Status Document

### Firestore path: `research_status/public`

This document is manually maintained by the operator. It is publicly readable (Firestore security rule: `allow read: if true`). It holds the current state of the Universal Hypothesis research programme.

**Initial document** (write manually via Firebase console before deploying):

```json
{
  "hypothesis": "The nine-wheel somatic taxonomy is cross-linguistically consistent — speakers of different languages will assign words with semantically similar somatic qualities to the same wheel at rates significantly above chance.",
  "status": "accumulating",
  "status_label": "Accumulating data",
  "consenting_users": 0,
  "language_families_represented": 0,
  "total_wheel_assignments": 0,
  "threshold_users_required": 500,
  "threshold_families_required": 8,
  "pre_registered": false,
  "first_publication_target": null,
  "last_updated": "2026-05-08"
}
```

`status` values: `"accumulating"` | `"approaching_threshold"` | `"pre_registered"` | `"under_analysis"` | `"published"`

The operator updates this document manually as milestones are reached. No automation required at this stage.

### Read function — add to `lib/research.ts` (existing file)

```typescript
export interface ResearchStatusPublic {
  hypothesis: string
  status: string
  statusLabel: string
  consentingUsers: number
  languageFamiliesRepresented: number
  totalWheelAssignments: number
  thresholdUsersRequired: number
  thresholdFamiliesRequired: number
  preRegistered: boolean
  lastUpdated: string
}

export async function getPublicResearchStatus(): Promise<ResearchStatusPublic | null> {
  if (!db) return null
  const ref = doc(db, 'research_status', 'public')
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const d = snap.data()
  return {
    hypothesis: d.hypothesis ?? '',
    status: d.status ?? 'accumulating',
    statusLabel: d.status_label ?? 'Accumulating data',
    consentingUsers: d.consenting_users ?? 0,
    languageFamiliesRepresented: d.language_families_represented ?? 0,
    totalWheelAssignments: d.total_wheel_assignments ?? 0,
    thresholdUsersRequired: d.threshold_users_required ?? 500,
    thresholdFamiliesRequired: d.threshold_families_required ?? 8,
    preRegistered: d.pre_registered ?? false,
    lastUpdated: d.last_updated ?? '',
  }
}
```

---

## Part C — Dashboard Component

### File: `components/record/ResearchDashboard.tsx`

Shown only when `profile.researchConsent.categoryB.granted === true`. If consent is off, renders nothing.

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { getUserContributionSummary, UserContributionSummary } from '@/lib/researchLogging'
import { getPublicResearchStatus, ResearchStatusPublic } from '@/lib/research'

export function ResearchDashboard() {
  const { user, profile } = useAuth()
  const hasConsent = profile?.researchConsent?.categoryB?.granted === true
  const [contribution, setContribution] = useState<UserContributionSummary | null>(null)
  const [status, setStatus] = useState<ResearchStatusPublic | null>(null)

  useEffect(() => {
    if (!user?.uid || !hasConsent) return
    Promise.all([
      getUserContributionSummary(user.uid),
      getPublicResearchStatus(),
    ]).then(([c, s]) => {
      setContribution(c)
      setStatus(s)
    })
  }, [user?.uid, hasConsent])

  if (!hasConsent) return null

  return <ResearchDashboardContent contribution={contribution} status={status} />
}
```

### Layout

```
THE RESEARCH
──────────────────────────────────────────────

THE HYPOTHESIS
"The nine somatic wheels carry consistent
meaning across languages and cultures."
This is what we're testing. We don't yet
know if it's true.

─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

YOUR CONTRIBUTION
  47  wheel assignments
   8  sequencer sessions
      Contributing since 3 May 2026

─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

THE DATASET  ·  last updated 8 May 2026
  [███░░░░░░░░░░░░░░░░░░░]  12 / 500 users
  [██░░░░░░░░░░░░░░░░░░░░]   2 / 8 language families
  Status: Accumulating data

  When the dataset reaches threshold,
  hypotheses will be pre-registered with
  the Open Science Framework before any
  analysis begins.
```

### Design details

**Hypothesis block:** The hypothesis in quotes, italic, `text-sm`. Below it: "This is what we're testing. We don't yet know if it's true." in `text-xs text-gray-500`. This honesty is intentional — the user is a participant in a genuine open question, not a validation exercise.

**Contribution block:** Large numbers (`text-3xl font-bold`) for the counts. `text-xs text-gray-400` labels. "Contributing since" as a date string.

If contribution counts are zero (consent just granted, no events yet): "Your first wheel assignment will be your first contribution." — no zeros shown.

**Dataset progress bars:** Two thin bars (`h-1`) in neutral colour showing current vs. threshold. The numbers alongside. Below the bars, the `statusLabel` from the public document. The progress toward threshold is shown without urgency — no percentage, no "X% of the way there." Just the raw count against the target.

**Pre-registration note:** Shown at all times as a commitment: "When the dataset reaches threshold, hypotheses will be pre-registered with the Open Science Framework before any analysis begins." This is not conditional — it is always true and always stated.

If `preRegistered === true`, replace with: "Hypotheses have been pre-registered. View the pre-registration →" with a link to the OSF record (add `pre_registration_url` field to the public document when this happens).

---

## Surface in My Record

### File: `components/record/MyRecordView.tsx`

Add `ResearchDashboard` as the fifth panel, after `ResearchStatusPanel`:

```tsx
import { ResearchDashboard } from './ResearchDashboard'

// After ResearchStatusPanel:
<ResearchDashboard />
```

It renders nothing if the user has no Category B consent — no empty state, no prompt to consent. The `ResearchStatusPanel` (Phase 2.1) already handles the consent status and the link to Settings. The dashboard simply does not appear until the user has opted in.

---

## Firestore Security Rules Addition

```javascript
match /research_status/{docId} {
  allow read: if true    // public — no auth required
  allow write: if false  // operator writes via Firebase console only
}

match /users/{uid}/researchContribution/{docId} {
  allow read, write: if request.auth.uid == uid
}
```

---

## Files to Create

```
components/record/ResearchDashboard.tsx
```

## Files to Modify

```
lib/researchLogging.ts            — add incrementContribution + getUserContributionSummary
lib/research.ts                   — add getPublicResearchStatus
components/record/MyRecordView.tsx — mount ResearchDashboard as fifth panel
```

## Manual Step (operator — before deploy)

Create `research_status/public` document in Firebase console with the initial JSON above. Set Firestore security rule to allow public reads on this path.

## Files NOT to Touch

```
phraseAcousticAnalysis.ts
StepSequencer.tsx
SolarSystemResonance.tsx
app/sequencer/page.tsx
lib/nodeAffinity.ts
lib/phraseProgress.ts
```

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Phase 2.3 of PASSPORT_ROADMAP.md*
*Companion: RESEARCH_PRINCIPLES.md — the hard rules that govern what this dashboard reports*
