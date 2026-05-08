# My Record — Build Brief
### Phase 2.1 — Cursor Implementation Brief
**Version 1.0 | 2026-05-08**

---

## What This Is

My Record is the first form of the Learner's Passport — the place where the user can see everything the platform holds that belongs to them, assembled into a single coherent view. It is not a settings page. It is not a dashboard. It is a reflection space: unhurried, personal, oriented toward self-appraisal.

Four panels. Everything read from data already written in Phase 1.

---

## New Route: `/record`

### File: `app/record/page.tsx`

```tsx
'use client'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { MyRecordView } from '@/components/record/MyRecordView'

export default function RecordPage() {
  return (
    <ProtectedRoute>
      <div className="h-full overflow-y-auto bg-transparent ml-16">
        <div className="max-w-3xl px-4 sm:px-6 py-8 pb-16">
          <MyRecordView />
        </div>
      </div>
    </ProtectedRoute>
  )
}
```

---

## New Dock Entry

### File: `components/AppDock.tsx`

Add after the Synth Lab entry:

```typescript
import { ScrollText } from 'lucide-react'

{ title: 'My Record', href: '/record', icon: ScrollText },
```

`ScrollText` is the passport/personal record glyph. If unavailable in the installed lucide version, use `BookUser` or `ClipboardList`.

---

## Main Component: `components/record/MyRecordView.tsx`

Composes four section components. Fetches all data at this level and passes it down — one load state for the whole page.

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { getUserPhraseSummaries, PhraseSummary } from '@/lib/phraseProgress'
import { computeNodeAffinityProfile, NodeAffinityProfile } from '@/lib/nodeAffinity'
import { ScrollText } from 'lucide-react'

import { LexiconPanel } from './LexiconPanel'
import { PhraseHistoryPanel } from './PhraseHistoryPanel'
import { AffinityPanel } from './AffinityPanel'
import { ResearchStatusPanel } from './ResearchStatusPanel'

export function MyRecordView() {
  const { user, profile } = useAuth()
  const [phrases, setPhrases] = useState<PhraseSummary[]>([])
  const [affinity, setAffinity] = useState<NodeAffinityProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) return
    Promise.all([
      getUserPhraseSummaries(user.uid),
      computeNodeAffinityProfile(user.uid),
    ]).then(([p, a]) => {
      setPhrases(p)
      setAffinity(a)
      setLoading(false)
    })
  }, [user?.uid])

  return (
    <div className="space-y-8">
      {/* Page header */}
      <header className="border-b border-black/8 pb-5 dark:border-white/8">
        <div className="flex items-center gap-2 text-gray-400 mb-2">
          <ScrollText className="h-4 w-4" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">My Record</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Your practice record
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
          Everything the platform holds that belongs to you.
        </p>
      </header>

      <LexiconPanel profile={profile} />
      <PhraseHistoryPanel phrases={phrases} loading={loading} />
      <AffinityPanel profile={affinity} loading={loading} />
      <ResearchStatusPanel consentRecord={profile?.researchConsent} />
    </div>
  )
}
```

---

## Panel 1 — `components/record/LexiconPanel.tsx`

Personal vocabulary summary. Reads from the user's profile for the count; links to the full glossary Personal Lexicon tab for the detail.

Data source: query `glossary` collection where `source === 'user' && personal === true && user_id === uid`. Count and wheel distribution only — do not load all entries on this page.

```
YOUR WORDS
──────────────────────────────────────────────

  47 personal words across 6 wheels

  ROOT ████████░░░░░░░  12
  SACRAL ██░░░░░░░░░░░░   4
  SOLAR PLEXUS ███████░░░░░░░  10
  HEART ████████████░░  18
  THROAT ███░░░░░░░░░░░   3
  THIRD EYE ░░░░░░░░░░░░░░   0
  ...

  [Open your personal lexicon →]
```

Design:
- Section label: `text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400`
- Word count: `text-3xl font-bold` + `text-sm text-gray-500 ml-2`
- Wheel bars: horizontal, each bar in that wheel's colour, height `h-1.5`, proportional fill, label + count alongside
- Wheels with zero words: shown at low opacity, not hidden
- Link: goes to `/glossary` with a URL param or hash that activates the My Words tab: `/glossary?tab=personal`
- Empty state (no personal words yet): `"This is your space. Any word you use belongs here."` + link to Add your word

---

## Panel 2 — `components/record/PhraseHistoryPanel.tsx`

All phrases the user has practiced, ordered by most recently used. Each entry shows the progression arc in miniature.

Data source: `getUserPhraseSummaries(uid)` from `lib/phraseProgress.ts` — already built in Phase 1.4.

```
PHRASE PROGRESS
──────────────────────────────────────────────

  re|mem|ber|ing               ▁▃▅▆▇█   84%  ↑ 12 sessions
  con|scious|ness              ▁▂▄▅▅▆   71%   8 sessions
  so|ma|tic                    ▁▁▂▃▄▄   52%   5 sessions
  pres|ence                    ▁▁▁▂▂    38%   4 sessions
```

Design:
- Each row: phrase text (left), micro sparkline (centre), latest score % (right), session count (muted)
- Sparkline: inline SVG, 48px wide × 16px tall, same line style as `PhraseProgressCurve` (Phase 1.4)
- Score colour: emerald if ≥ 70, amber if 40–69, neutral below 40
- Row hover: subtle background tint
- Max 10 phrases shown; if more exist, a `"Show all (N) →"` link expands or goes to a future full history view
- Empty state: `"Complete a phrase session in the sequencer to start your record."` with a link to `/sequencer`

---

## Panel 3 — `components/record/AffinityPanel.tsx`

The full node affinity map with supporting context.

Data source: `computeNodeAffinityProfile(uid)` from `lib/nodeAffinity.ts` — already built in Phase 1.5.

Reuse `NodeAffinityMap` from `components/sequencer/NodeAffinityMap.tsx`.

```
PRACTICE MAP — LAST 28 DAYS
──────────────────────────────────────────────
  23 sessions · 1,847 steps

  [NodeAffinityMap — full 3×3 grid]

  Your practice has been centred on HEART and THROAT.
  These nodes carry your most sustained engagement.
```

The interpretive line at the bottom is generated from the profile data:
- Find the 1–2 dominant nodes (affinity > 20%)
- State their names in a single plain sentence
- No evaluation. No suggestion to change. Just the observation.

If total sessions < 3: `"Your practice map is taking shape. Keep going."` — no interpretive line yet.

Empty state: same as `NodeAffinityMap` empty state.

---

## Panel 4 — `components/record/ResearchStatusPanel.tsx`

Plain-language account of the user's research participation status.

Data source: `profile.researchConsent` from `useAuth()`.

```
RESEARCH PARTICIPATION
──────────────────────────────────────────────

  Usage patterns      Contributing  ·  since 3 May 2026
  Practice progress   Not contributing

  Your wheel assignments and session patterns are
  contributing anonymously to a cross-linguistic
  study of somatic-semantic associations.

  You can change your choices at any time.
  [Manage in Settings →]
```

States:
- Both off / never asked: `"You haven't opted in to research participation yet."` + `[Learn more →]` (opens Research Participation flow)
- B on, C off: show contributing message for B only
- Both on: show both contributing messages
- `neverAsk === true`: `"You've chosen not to participate in research. That's completely fine."` — no link, no nudge

The link `[Manage in Settings →]` goes to `/settings` (which opens the SettingsDialog with the Research Participation tab).

No persuasion. No percentage bars showing "how much" they've contributed. No gamification. This section is informational only.

---

## Files to Create

```
app/record/page.tsx
components/record/MyRecordView.tsx
components/record/LexiconPanel.tsx
components/record/PhraseHistoryPanel.tsx
components/record/AffinityPanel.tsx
components/record/ResearchStatusPanel.tsx
```

## Files to Modify

```
components/AppDock.tsx    — add My Record nav entry
```

## Files NOT to Touch

```
phraseAcousticAnalysis.ts
StepSequencer.tsx
SolarSystemResonance.tsx
lib/researchLogging.ts
app/sequencer/page.tsx
```

---

## Design Principles for This Page

**No evaluation.** Nothing on this page tells the user they are doing well or poorly. It shows them what is. The consistency score is their own benchmark — it is not graded against a standard.

**No gamification.** No streaks, no badges, no level indicators. Those mechanics attach extrinsic motivation to intrinsic practice. The record stands on its own.

**No compression.** The user's vocabulary is shown as a distribution, not a number to maximise. The practice map shows where they have been, not where they should go.

**Unhurried.** The page has no call to action beyond the links to the relevant tools. It is a space to read, not to act.

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Phase 2.1 of PASSPORT_ROADMAP.md*
*Companion: LEARNERS_PASSPORT_CONCEPT.md, INTRINSIC_VALIDITY_NOTE.md*
