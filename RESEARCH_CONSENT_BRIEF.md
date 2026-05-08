# Research Participation Consent Flow — Build Brief
### Phase 1.2 — Cursor Implementation Brief
**Version 1.0 | 2026-05-08**

---

## What This Is

The Research Participation flow is the consent infrastructure for the Mind Mechanism data collection programme. It allows users to opt in to — or decline — two categories of anonymised research data contribution. It is not a cookie banner. It is not buried in onboarding. It is a dedicated, unhurried, plain-language consent experience that appears once at the right moment and is accessible at any time thereafter from Settings.

The legal basis: GDPR Art. 6(1)(a) — freely given, specific, informed, unambiguous consent. Reference document: `DATA_COLLECTION_PROTOCOL.md` Part III.

This brief covers:
1. Data model changes (`UserProfile` + Firestore)
2. The Research Participation flow (4 screens)
3. The Settings > Research Participation section
4. Trigger logic (when the flow appears)
5. Privacy Notice update

---

## 1. Data Model

### Add to `UserProfile` in `lib/FirebaseAuthContext.tsx`

```typescript
export interface ResearchConsent {
  granted: boolean
  timestamp: string        // ISO 8601
  protocolVersion: string  // e.g. '1.0' — version of DATA_COLLECTION_PROTOCOL at point of consent
}

export interface UserProfile {
  // ... existing fields unchanged ...

  researchConsent?: {
    categoryB?: ResearchConsent   // Usage patterns (wheel assignments, node usage)
    categoryC?: ResearchConsent   // Acoustic signatures (consistency scores, speech patterns)
    neverAsk?: boolean            // User selected "Never ask again" — suppress future prompts
    lastPromptedAt?: string       // ISO 8601 — when the flow was last shown
  }
}
```

Add `researchConsent` to `emptyProfileShell()` with `undefined` (absent = not yet asked).

### Firestore write location

Consent records write to `users/{uid}` (same document as the rest of the profile). The `researchConsent` object is the sole research-consent field at this location. No research data itself is written here — this is solely the consent record.

### Protocol version constant

Add to a new file `lib/researchProtocol.ts`:

```typescript
export const RESEARCH_PROTOCOL_VERSION = '1.0'
export const CATEGORY_B_FIELDS = ['wheel_assigned', 'word_language', 'word_grade', 'node_usage_count', 'practice_frequency']
export const CATEGORY_C_FIELDS = ['consistency_score', 'rhythm_match_pct', 'stress_hit_count', 'stress_miss_count']
```

---

## 2. The Research Participation Flow

### Component: `components/research/ResearchConsentFlow.tsx`

A full-screen overlay modal (not a drawer, not a sheet — this deserves full attention). Dark backdrop. Centred card, max-width `480px`. Progress indicator across the top (4 steps). The card does not scroll — each screen is self-contained and fits within the card.

The flow is a controlled multi-step component. State: `step: 1 | 2 | 3 | 4`, `consentB: boolean | null`, `consentC: boolean | null`.

---

### Screen 1 — What this is

```
CONTRIBUTING TO THE RESEARCH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mind Mechanism is built on a testable hypothesis:
that certain words and sounds carry consistent
somatic meaning across languages and cultures.
We don't know yet whether that's true at scale.

You can help us find out — anonymously, with full
control over what you share and when you stop.

This takes 2 minutes to read. It matters.

[Continue]                    [Never ask again]

                         [Not now — remind me later]
```

- "Continue" → Screen 2
- "Never ask again" → sets `researchConsent.neverAsk = true`, closes flow, no consent granted
- "Not now — remind me later" → sets `researchConsent.lastPromptedAt` to now, closes flow

Typography: heading in `text-sm font-semibold uppercase tracking-widest text-gray-400`. Body in `text-sm text-gray-600 dark:text-gray-300 leading-relaxed`. Buttons: Continue is filled (neutral, not coloured), the two secondary options are text-only links, smaller.

---

### Screen 2 — Category B (Usage patterns)

```
OPTION 1 — USAGE PATTERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Anonymised

If you turn this on, we collect:
  · Which of the nine wheels you assign words to
  · How often you practise, in general terms
  · Which nodes you use in sequences

We do NOT collect:
  · The words themselves
  · Your name or any identifying information
  · Your location
  · Your recordings (these never leave your device)

This data is used to test whether people across
languages tend to assign similar kinds of words
to the same wheels. We publish the findings.
We do not sell the data.

[Turn on usage patterns]      [Skip this one]
```

- "Turn on usage patterns" → `consentB = true`, advance to Screen 3
- "Skip this one" → `consentB = false`, advance to Screen 3

The "We do NOT collect" list uses a distinct visual treatment — slightly muted, with a subtle left border in neutral tone (not coloured).

---

### Screen 3 — Category C (Acoustic patterns)

```
OPTION 2 — PRACTICE PROGRESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Acoustic patterns · Anonymised · Separate from Option 1

This option is separate from Option 1. You can
turn it on without Option 1, or vice versa.

If you use the phrase analyser and turn this on,
we collect numerical patterns from your recordings
— not the audio itself, which always stays on
your device.

What we collect: numbers describing where stress
and rhythm fall in your speech, and how consistent
that is across sessions.

What we use it for: to measure whether the tonal
mnemonic helps people improve pronunciation
consistency faster than practice without it.

A note: these numbers describe patterns in your
speech. We treat them with the same care as health
data. They are never used to identify you, assess
you, or make decisions about you.

[Turn on practice progress]   [Skip this one]
```

- "Turn on practice progress" → `consentC = true`, advance to Screen 4
- "Skip this one" → `consentC = false`, advance to Screen 4

---

### Screen 4 — Summary and confirmation

Dynamically shows what the user selected. No dark patterns. No second-guessing language.

```
YOUR CHOICES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usage patterns          [On / Off]
Practice progress       [On / Off]

You can change these at any time in
Settings → Research Participation.

Turning either option off stops collection
immediately. Your access is not affected.

[Confirm]
```

- "Confirm" → write consent record to Firestore, close flow

On confirm, write to `users/{uid}`:
```typescript
{
  researchConsent: {
    categoryB: consentB ? {
      granted: true,
      timestamp: new Date().toISOString(),
      protocolVersion: RESEARCH_PROTOCOL_VERSION
    } : {
      granted: false,
      timestamp: new Date().toISOString(),
      protocolVersion: RESEARCH_PROTOCOL_VERSION
    },
    categoryC: consentC ? { ... } : { ... },
    lastPromptedAt: new Date().toISOString()
  }
}
```

Both categories always write a record — whether granted or declined. The timestamp and protocol version are recorded either way. This is the audit trail.

---

## 3. Settings > Research Participation

### Add a new tab/section to `components/settings/SettingsDialog.tsx`

New component: `components/settings/ResearchParticipationSettings.tsx`

This section shows the user's current consent status and allows them to change it at any time.

```
RESEARCH PARTICIPATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usage patterns
Anonymised wheel assignments and node usage.
[Toggle: On/Off]     Last updated: [date]

Practice progress
Acoustic pattern data from phrase sessions.
[Toggle: On/Off]     Last updated: [date]

─────────────────────────────────────────

Turning either option off stops data collection
immediately. Your existing contributions are
flagged as excluded from future research
aggregations.

Your access to all features remains unchanged.

[View what this research is building →]
```

The "View what this research is building →" link goes to `/research`.

Toggle behaviour:
- Toggle off → write `granted: false` + new timestamp + same protocol version to Firestore
- Toggle on → write `granted: true` + new timestamp + same protocol version to Firestore
- Both directions are recorded. The consent log is never deleted — it only appends new states.

If `researchConsent` is absent (user has never been shown the flow), show a prompt:
```
You haven't been asked about research participation yet.
[Learn more and choose →]
```
Clicking opens the full 4-screen flow.

---

## 4. Trigger Logic

### Where it lives: `components/research/ResearchConsentTrigger.tsx`

A client component that wraps the app shell (add to `LayoutContent.tsx` or `AppDock.tsx` — whichever is the nearest always-mounted parent). It reads the user's profile and determines whether to show the flow.

**Show the flow when all of the following are true:**
1. User is authenticated
2. `profile.researchConsent` is absent OR (`neverAsk !== true` AND no consent decision has been made for either category)
3. Account age ≥ 14 days (calculate from Firebase `user.metadata.creationTime`)
4. `lastPromptedAt` is absent OR was more than 30 days ago

**Never show the flow when:**
- `neverAsk === true`
- Both `categoryB` and `categoryC` have a recorded decision (granted or declined)
- Account age < 14 days

The 14-day delay is deliberate: the user should have experienced the application before being asked to contribute to its research programme. They are consenting to something they understand, not something they just downloaded.

The trigger renders nothing visible until conditions are met — it is not a persistent UI element. When conditions are met, it mounts the `ResearchConsentFlow` modal.

---

## 5. Privacy Notice Update

### `components/info/PrivacyData.tsx`

The current privacy notice states: "Mind Mechanism does not collect, store, or transmit personal data."

This is accurate for users who have not consented to research participation. It will become partially inaccurate for users who have. The notice must be updated before the consent flow is deployed.

Replace the "What we collect" section with:

```
What we collect

Mind Mechanism operates on a local-first architecture. 
The application stores your practice records, vocabulary, 
and reflections on your device. We have no access to 
your voice recordings, which never leave your device.

With your explicit consent, we collect anonymised 
behavioural data for research purposes — specifically, 
which somatic wheels you assign vocabulary to, and 
numerical patterns from your phrase practice sessions. 
This data does not include the words themselves, any 
personally identifying information, or your audio recordings.

Research participation is entirely optional. You may 
opt in, opt out, or change your choices at any time 
in Settings → Research Participation. Your access to 
all features is not affected by your choice.

For full details of what is collected, on what legal 
basis, and how it is used, see our full Data Collection 
Protocol at [link].
```

Update the "Last updated" date. Add a link to the full `DATA_COLLECTION_PROTOCOL.md` — either hosted as a static page or linked to the repository.

Also update the GDPR rights section — it currently says "these rights are satisfied by design" (because no data was collected). This is no longer universally true. Add:

```
For users who have consented to research participation:
you have the right to access, rectify, erase, and port 
your data. To exercise these rights, contact 
future@theoneleggedpoet.com. We will respond within 30 days.
```

---

## Files to Create

```
components/research/ResearchConsentFlow.tsx     — the 4-screen modal
components/research/ResearchConsentTrigger.tsx  — the mount/timing logic
components/settings/ResearchParticipationSettings.tsx — settings section
lib/researchProtocol.ts                         — protocol version constant
```

## Files to Modify

```
lib/FirebaseAuthContext.tsx       — add ResearchConsent type + researchConsent to UserProfile
components/settings/SettingsDialog.tsx — add Research Participation tab
components/info/PrivacyData.tsx   — update privacy notice text
app/LayoutContent.tsx             — mount ResearchConsentTrigger
```

## Files NOT to touch

```
StepSequencer.tsx
phraseAcousticAnalysis.ts
SolarSystemResonance.tsx
AppDock.tsx
app/sequencer/page.tsx
```

---

## What This Does NOT Build Yet

- The actual Category B/C data logging (Phase 1.3 — a separate brief)
- The Firebase security rules enforcement of consent flags before research writes
- The on-chain consent anchoring (Phase 2.4)

The consent flow is the gate. The logging infrastructure comes next, gated behind it.

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Reference: DATA_COLLECTION_PROTOCOL.md Part III — Consent Mechanisms*
*Phase 1.2 of PASSPORT_ROADMAP.md*
