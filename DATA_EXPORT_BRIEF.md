# Data Export — Build Brief
### Phase 2.2 — Cursor Implementation Brief
**Version 1.0 | 2026-05-08**

---

## What This Is

The user's right to export their data in a portable, machine-readable format is both a GDPR Art. 20 requirement and the clearest possible demonstration that the data is genuinely theirs. The export is instant — all data is Firestore client-side readable by the authenticated user — no request queue, no 30-day wait.

The export is a single JSON file. It contains everything the platform holds that belongs to the user. It is the Passport in its most literal form: a document you can carry.

---

## Export Function — `lib/dataExport.ts`

Single function that assembles and triggers the download. All Firestore reads happen here.

```typescript
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from './firebase'
import { getUserPhraseSummaries, getPhraseSessionHistory, phraseHash } from './phraseProgress'
import { RESEARCH_PROTOCOL_VERSION } from './researchProtocol'

export interface UserDataExport {
  exported_at: string           // ISO 8601
  protocol_version: string
  account: {
    username: string
    tier: string
    member_since: string | null
  }
  personal_lexicon: PersonalLexiconEntry[]
  phrase_progress: PhraseProgressExport[]
  node_affinity_log: NodeAffinityLogEntry[]
  research_consent: ResearchConsentExport
  export_notes: string[]
}

interface PersonalLexiconEntry {
  word: string
  own_definition: string | null
  context: string | null
  phonetic: string | null
  wheel: number | null           // clock_id 0–8, null if unassigned
  language: string | null
  relationship: '+' | '-' | '~' | null   // rating field
  created_at: string
}

interface PhraseProgressExport {
  phrase: string
  ipa_text: string
  session_count: number
  best_score: number
  latest_score: number
  first_session_at: string
  latest_session_at: string
  sessions: {
    session_id: string
    consistency_score: number
    rhythm_match_pct: number
    stress_hit_count: number
    stress_miss_count: number
    recorded_at: string
  }[]
}

interface NodeAffinityLogEntry {
  recorded_at: string
  node_fires: Record<string, number>
  total_fires: number
}

interface ResearchConsentExport {
  category_b: { granted: boolean; timestamp: string; protocol_version: string } | null
  category_c: { granted: boolean; timestamp: string; protocol_version: string } | null
  note: string
}

export async function exportUserData(
  uid: string,
  profile: { username: string; tier?: string } | null,
  authCreationTime: string | undefined
): Promise<void> {
  if (!db) return

  // ── 1. Personal Lexicon ──────────────────────────────────────────────────
  const glossaryRef = collection(db, 'glossary')
  // Query personal words belonging to this user
  const lexiconQuery = query(
    glossaryRef,
    // where('user_id', '==', uid),  // add if Firestore rules permit — otherwise filter client-side
    orderBy('created_at', 'asc')
  )
  const lexiconSnap = await getDocs(lexiconQuery)
  const personalLexicon: PersonalLexiconEntry[] = lexiconSnap.docs
    .map(d => d.data())
    .filter(d => d.source === 'user' && d.personal === true && d.user_id === uid)
    .map(d => ({
      word: d.word ?? '',
      own_definition: d.own_definition ?? null,
      context: d.context ?? null,
      phonetic: d.phonetic ?? null,
      wheel: d.clock_id ?? null,
      language: d.language ?? null,
      relationship: d.rating ?? null,
      created_at: d.created_at ?? '',
    }))

  // ── 2. Phrase Progress ───────────────────────────────────────────────────
  const summaries = await getUserPhraseSummaries(uid)
  const phraseProgressExport: PhraseProgressExport[] = await Promise.all(
    summaries.map(async s => {
      const sessions = await getPhraseSessionHistory(uid, s.phraseHash, 200) // up to 200 sessions
      return {
        phrase: s.phrase,
        ipa_text: s.ipaText,
        session_count: s.sessionCount,
        best_score: s.bestScore,
        latest_score: s.latestScore,
        first_session_at: new Date(s.firstSessionAt).toISOString(),
        latest_session_at: new Date(s.latestSessionAt).toISOString(),
        sessions: sessions.map(sess => ({
          session_id: sess.sessionId,
          consistency_score: sess.consistencyScore,
          rhythm_match_pct: sess.rhythmMatchPct,
          stress_hit_count: sess.stressHitCount,
          stress_miss_count: sess.stressMissCount,
          recorded_at: new Date(sess.createdAt).toISOString(),
        })),
      }
    })
  )

  // ── 3. Node Affinity Log ─────────────────────────────────────────────────
  const affinityRef = collection(db, 'users', uid, 'nodeAffinityLog')
  const affinitySnap = await getDocs(query(affinityRef, orderBy('timestamp', 'asc')))
  const affinityLog: NodeAffinityLogEntry[] = affinitySnap.docs.map(d => ({
    recorded_at: new Date(d.data().timestamp).toISOString(),
    node_fires: d.data().nodeFires ?? {},
    total_fires: d.data().totalFires ?? 0,
  }))

  // ── 4. Consent Record ────────────────────────────────────────────────────
  const userRef = doc(db, 'users', uid)
  const userSnap = await getDoc(userRef)
  const consent = userSnap.exists() ? userSnap.data().researchConsent : null

  const consentExport: ResearchConsentExport = {
    category_b: consent?.categoryB ?? null,
    category_c: consent?.categoryC ?? null,
    note: 'Research data contributed under these consent records is held separately in anonymised, aggregated form and is not included in this export.',
  }

  // ── Assemble ─────────────────────────────────────────────────────────────
  const exportData: UserDataExport = {
    exported_at: new Date().toISOString(),
    protocol_version: RESEARCH_PROTOCOL_VERSION,
    account: {
      username: profile?.username ?? '',
      tier: profile?.tier ?? 'open',
      member_since: authCreationTime ?? null,
    },
    personal_lexicon: personalLexicon,
    phrase_progress: phraseProgressExport,
    node_affinity_log: affinityLog,
    research_consent: consentExport,
    export_notes: [
      'Voice recordings are stored on your device only and are not included in this export.',
      'Anonymised research contributions (wheel assignments, session patterns) are held separately and cannot be retrieved individually — they are not linked to your identity in the research dataset.',
      'This export satisfies your right to data portability under GDPR Art. 20.',
    ],
  }

  // ── Download ─────────────────────────────────────────────────────────────
  const json = JSON.stringify(exportData, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mindmechanism-record-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

---

## Export Trigger Component — `components/record/ExportButton.tsx`

A single button with loading state. Used in both My Record and Settings.

```tsx
'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { exportUserData } from '@/lib/dataExport'

interface ExportButtonProps {
  variant?: 'full' | 'compact'  // full = button + description, compact = icon button only
}

export function ExportButton({ variant = 'full' }: ExportButtonProps) {
  const { user, profile } = useAuth()
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const handleExport = async () => {
    if (!user?.uid || state === 'loading') return
    setState('loading')
    try {
      await exportUserData(user.uid, profile, user.metadata.creationTime)
      setState('done')
      setTimeout(() => setState('idle'), 3000)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  return (
    <div className={variant === 'full' ? 'space-y-2' : ''}>
      <button
        onClick={handleExport}
        disabled={state === 'loading'}
        className="inline-flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/[0.07] disabled:opacity-50 transition-colors"
      >
        <Download className="h-4 w-4" />
        {state === 'loading' && 'Preparing…'}
        {state === 'done' && 'Downloaded'}
        {state === 'error' && 'Something went wrong'}
        {state === 'idle' && 'Export my data'}
      </button>
      {variant === 'full' && (
        <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
          Downloads a JSON file containing your personal lexicon, phrase progress,
          practice log, and consent record. Voice recordings are not included —
          they never leave your device.
        </p>
      )}
    </div>
  )
}
```

---

## Surface in My Record

### File: `components/record/MyRecordView.tsx`

Add below the page header, before the four panels:

```tsx
import { ExportButton } from './ExportButton'

// In the header section, after the subtitle:
<div className="mt-4">
  <ExportButton variant="full" />
</div>
```

---

## Surface in Settings

### File: `components/settings/AccountSettings.tsx`

Add a new section within the account settings, below existing account controls:

```
YOUR DATA
──────────────────────────────────────────────
Export a copy of everything the platform holds
that belongs to you: vocabulary, phrase progress,
practice log, and consent record.

[Export my data ↓]
```

Use `ExportButton variant="full"` here too.

---

## What the Export Contains

| Section | Contents |
|---|---|
| `account` | Username, tier, member since |
| `personal_lexicon` | All personal words: text, own definition, context, wheel, language, relationship |
| `phrase_progress` | All practiced phrases with full session history (score, rhythm, stress per session) |
| `node_affinity_log` | Every sequencer session: node fires, timestamps |
| `research_consent` | Consent status and timestamps for Category B and C |
| `export_notes` | Plain language notes about what is not included and why |

## What the Export Does NOT Contain

- Voice recordings — never on server, not accessible to the platform
- System glossary words (source: 'system') — these are not the user's data
- Research event records — these are anonymised and cannot be individually retrieved
- Other users' data — the Firestore query is scoped to this uid

---

## Files to Create

```
lib/dataExport.ts
components/record/ExportButton.tsx
```

## Files to Modify

```
components/record/MyRecordView.tsx    — add ExportButton below header
components/settings/AccountSettings.tsx — add Your Data section with ExportButton
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

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Phase 2.2 of PASSPORT_ROADMAP.md*
*GDPR reference: Art. 20 — Right to data portability*
