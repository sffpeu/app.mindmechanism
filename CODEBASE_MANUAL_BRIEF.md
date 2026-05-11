# Codebase Manual — Build Brief
### Documentation Pass — Cursor Implementation Brief
**Version 1.0 | 2026-05-11**

---

## What This Is

A full manual of every function, hook, component, and API route in the codebase. One document. Written in plain language. No assumptions about prior knowledge. The goal is that any person — or any AI — can pick this up and immediately understand what the system does, how it's organised, and where to find anything.

---

## Output File

Create a single file: `CODEBASE_MANUAL.md` in the project root.

---

## Structure

The manual has four parts:

### Part 1 — Architecture Overview
A short plain-language description of the system:
- What Mind Mechanism is
- How the codebase is organised (Next.js app router, Firebase, TypeScript)
- The key namespaces: `lib/`, `components/`, `app/api/`, `contexts/`, `types/`
- The Passport silo concept (why `passport/{uid}/` is separate)
- The portal system (Consumer / Academic / Corporate — one codebase, config-driven)

### Part 2 — Library Functions (`lib/`)
For every exported function in every file under `lib/`, document:

```
## lib/[filename].ts

### functionName(param: type, ...): ReturnType
**Phase:** [which phase introduced this]
**Purpose:** One sentence — what it does.
**Parameters:**
  - param — what it is
**Returns:** what comes back
**Side effects:** any Firestore writes, IndexedDB reads, API calls, chain transactions
**Called by:** which components or other lib functions use this (if known)
```

Cover every file including:
- `accessRequests.ts`
- `consentAnchor.ts`
- `credentialRequests.ts`
- `dataExport.ts`
- `detectPortal.ts`
- `firebase.ts`
- `FirebaseAuthContext.tsx`
- `glossary.ts`
- `lexiconAnchor.ts`
- `nodeAffinity.ts`
- `nodeTiers.ts`
- `passportCrypto.ts`
- `passportIdentity.ts`
- `passportKeyRotation.ts`
- `passportSilo.ts`
- `phraseProgress.ts`
- `portalConfig.ts`
- `researchLogging.ts`
- `researchProtocol.ts`
- `urbanPatwa.ts` (if built)
- Any other files present

### Part 3 — Components (`components/`)
For every component, document:

```
## components/[folder]/[ComponentName].tsx

**Portal:** Consumer | Academic | Corporate | All
**Phase:** [which phase introduced this]
**Purpose:** One sentence — what it renders or does.
**Props:** list key props and what they control
**Data sources:** what Firestore collections or lib functions it reads
**Writes:** any mutations it triggers
**Shown when:** any conditional rendering rules (auth state, portal, feature flags)
```

Cover all component folders:
- `record/` — MyRecordView, ExportButton, ResearchDashboard, LexiconPanel, NodeAffinityMap, AccessPanel, CredentialsPanel, ResearchStatusPanel, PassportKeySetup
- `academic/` — UrbanPatwaMatrix, AcademicPracticeSelector (if built)
- `landing/` — HeroSection, FeatureStrip, ResearchCallout
- `legal/` — DatenschutzContent
- `passport/` — PassportKeyProvider
- `research/` — ResearchConsentFlow
- `sequencer/` — PhraseProgressCurve, any others present
- `settings/` — AccountSettings, any others present
- `glossary/` — GlossaryVisualWordPanel, any others present
- Any other component folders present

### Part 4 — API Routes (`app/api/`)
For every route file, document:

```
## app/api/[route]/route.ts

**Method:** GET | POST | PUT | DELETE
**Auth required:** yes | no
**Phase:** [which phase introduced this]
**Purpose:** One sentence.
**Request body:** fields expected
**Response:** what it returns on success
**Error states:** known error conditions and status codes
**External calls:** any third-party services called (Polygon, Firebase Admin, etc.)
```

Cover:
- `consent-anchor/route.ts`
- `passport-read/route.ts`
- Any other routes present

---

## Tone and Style

- Plain language throughout. No jargon that isn't explained.
- Short sentences. One idea per line where possible.
- If a function's purpose isn't immediately obvious from its name, explain *why* it exists — not just what it does.
- Where a function has a legal or privacy implication (encryption, hashing, chain writes), note it explicitly.

---

## What to Do When a File Is Missing

If a file listed above does not exist in the codebase, note it:

```
## lib/urbanPatwa.ts
*Not yet built — see URBAN_PATWA_BRIEF.md*
```

Do not invent documentation for files that don't exist.

---

## Output

One file: `CODEBASE_MANUAL.md` in the project root.

When done, commit and push to `origin/main`. Confirm with `git log --oneline -3`.

---

## Files to Create

```
CODEBASE_MANUAL.md
```

## Files NOT to Touch

Everything else. This is a read-only documentation pass. No code changes.

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Documentation pass — no phase number*
*Purpose: complete inventory of the system as built*
