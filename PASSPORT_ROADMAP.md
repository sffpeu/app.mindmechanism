# Learner's Passport — Implementation Roadmap
### From Current Build to Sovereign Educational Dossier
**Version 1.0 | 2026-05-08**

---

> The Passport is not built in one motion. It is revealed in phases, each of which is independently valuable, each of which lays infrastructure the next phase requires. No phase is speculative — each delivers something real to the user while advancing the architecture toward full sovereignty. The final form is the Passport. Every step before it is a usable product.

---

## Where We Are Now

The current build already contains the raw material of the Passport. It is not assembled into the Passport's form — it is distributed across the platform as operational data. The roadmap is the process of progressively giving the user ownership of what is already, in principle, theirs.

**What exists:**
- `GlossaryWord` with `source`, `user_id`, `clock_id`, `rating`, `language` — the vocabulary record
- `phraseAcousticAnalysis.ts` (pipeline v3) — the acoustic consistency engine
- Firestore `phraseProgress` writes — the beginning of a longitudinal record
- StepSequencer with 9-lane node usage — the somatic practice record
- `personal?: boolean`, `own_definition?`, `context?` specified in PERSONAL_LEXICON_BRIEF.md — ready to build
- DATA_COLLECTION_PROTOCOL.md, RESEARCH_PRINCIPLES.md — the governance framework written

**What does not yet exist:**
- The consent layer (Research Participation flow)
- Category B anonymised logging (wheel assignments, node usage)
- Node affinity profile computation and storage
- Longitudinal phrase consistency tracking beyond single-session writes
- The Passport container — the user's unified view of their own record
- Holder-controlled key infrastructure
- On-chain consent and ownership anchoring
- Institutional access API
- The open standard publication

---

## Phase 1 — Foundations
### Personal record, consent infrastructure, longitudinal data
**Horizon: present → 6 months**

This phase builds the data infrastructure the Passport will eventually hold. Nothing here is speculative. Everything here is either already specified or follows directly from what is specified.

**1.1 — Personal Lexicon (Cursor build)**
Pass PERSONAL_LEXICON_BRIEF.md to Cursor. Four-phase build: data model → My Words tab → entry form → sequencer bridge. This is the most important single feature for Passport foundations: it creates the first data layer the user genuinely owns — their own vocabulary, their own definitions, their own wheel assignments from lived language rather than system prompts.

Deliverable: users can build a personal vocabulary record that is unambiguously theirs.

**1.2 — Research Participation Consent Flow**
Build the four-screen consent flow specified in DATA_COLLECTION_PROTOCOL.md Part III. Category B and C consent, separately obtained, separately withdrawable. Consent timestamp and protocol version recorded in Firestore. This is the legal precondition for any research data collection.

Legal checkpoint: GDPR-qualified legal review of the protocol before activation.

Deliverable: users may consent to or decline research participation without consequence to access.

**1.3 — Category B Anonymised Logging**
On consent grant, begin logging: `wheel_assigned`, `word_language`, `word_grade`, `node_usage_count`, `practice_frequency`. Anonymised per the protocol — no word text, no personally identifying fields. Firebase security rules enforce consent flag before any research field is written.

Legal checkpoint: confirm Firebase Data Processing Agreement covers research data processing.

Deliverable: the Universal Hypothesis dataset begins accumulating from first consenting user.

**1.4 — Longitudinal Phrase Progress Store**
Extend current `phraseProgress` Firestore writes to accumulate per-phrase consistency score history, not just the most recent session. The progression curve — improvement over repeated sessions — is the research metric for Stream 1. It is also the most immediately valuable personal record for the user: a visible account of their own development.

Deliverable: users can see their own consistency trajectory per phrase across sessions.

**1.5 — Node Affinity Profile Computation**
Derive per-user node affinity vectors from sequencer usage: how each of the nine lanes is used across sessions, as a proportion of total node interactions, over rolling 4-week windows. Store as a Firestore subcollection per user. Display back to the user as a personal reflection tool — "here is how your practice has been distributed" — without evaluation or interpretation.

Deliverable: users have a visual map of their somatic practice distribution.

---

## Phase 2 — The Passport Shell
### Give the user a unified view of their own record
**Horizon: 6–12 months**

Phase 1 builds the data. Phase 2 assembles it into a single coherent view the user can navigate as their own record. This is the first form of the Passport — not yet sovereign in the full architectural sense, but already the user's in experience and in frame.

**2.1 — The My Record View**
A dedicated section of the application — separate from the practice tools — where the user can see the full picture of what the platform holds on them:

- Personal Lexicon summary: total words, wheel distribution, most recent entries
- Phrase progress: consistency trajectories by phrase, practice cadence
- Node affinity: somatic distribution map, shift over time
- Institutional records (initially empty — prepared for Phase 4 writes)
- Research participation status and a plain-language account of what has been shared

This is not a settings page. It is a reflection space. The design language is calm, unhurried, and oriented toward self-appraisal rather than gamification. The user is reading their own record, not being evaluated.

**2.2 — Data Export**
Full export of the user's record in structured JSON — fulfilling GDPR Art. 20 portability rights and demonstrating that the data is genuinely theirs to take. The export includes Personal Lexicon entries in full (including `own_definition` and `context`), phrase progress history, node affinity history, and a consent record summary.

The export is the first concrete demonstration of the Passport concept to the user: here is everything. It belongs to you.

**2.3 — Research Participant Dashboard**
For consenting users: a transparent account of what has been contributed to research — how many wheel assignments, how many phrase sessions, anonymised and aggregated alongside population comparisons. Not a gamification layer. A window into the science: "here is what you've contributed and here is what it means at scale."

This is intrinsic motivation infrastructure. The user who can see their contribution in context — whose 'bare' assigned to SOLAR PLEXUS sits alongside 400 other informal English words assigned to the same wheel by speakers who share that intuition — understands viscerally what the research is building.

**2.4 — On-Chain Consent Anchoring (MVP)**
Select chain. Implement wallet generation at account creation. Begin anchoring consent events on-chain: grant/withdraw events hashed and committed with timestamp and protocol version. The user's consent record is now independently verifiable.

Technical prerequisite: chain selection criteria from BLOCKCHAIN_SOVEREIGNTY_NOTE.md. Legal prerequisite: GDPR classification of on-chain hashes as non-personal-data confirmed by legal review.

Deliverable: consent records are independently verifiable by the user without relying on platform database access.

---

## Phase 3 — Sovereignty Infrastructure
### Holder-controlled keys, silo separation, ownership anchoring
**Horizon: 12–18 months**

This phase makes the Passport structurally sovereign — not just conceptually. The user holds the keys. The platform is a contributor on session tokens. The silo is separated from operational data.

**3.1 — Passport Silo Separation**
Migrate Passport data — Personal Lexicon, phrase progress, node affinity, research contribution record — from the operational Firestore database into a dedicated, separately encrypted silo. The platform accesses this silo through the user's session token, not through its operational credentials. The silo has its own audit log, separate from the platform's operational logs.

This is primarily an architectural migration. The user experience is unchanged. The structural change is significant: the platform no longer holds the Passport data as part of its operational state. It holds access rights granted by the user.

**3.2 — Holder-Controlled Key Infrastructure**
Generate the user's Passport encryption keys at account creation and provide a mechanism for the user to hold them independently of the platform: hardware wallet integration, or a custodial key management service the user selects and controls. The platform holds no persistent copy of the user's Passport keys.

This is the moment the Passport becomes genuinely sovereign. Before this point, the user's data is safe because the platform's practices are good. After this point, the user's data is safe because the architecture makes it so — regardless of what happens to the platform.

**3.3 — Personal Lexicon Ownership Anchoring**
Extend on-chain infrastructure to anchor a merkle root of the user's Personal Lexicon at defined intervals (e.g. on each significant update). The user holds a reference to their ownership record. If they export their lexicon and the entries match the hash they hold, the record is verified. This is the first use of the chain for something beyond consent records — it is ownership proof of the user's created vocabulary.

**3.4 — Passport Identity — Portable Identifier**
Issue each Passport a portable identifier — derived from the holder's wallet address, not from their platform account. This identifier travels with the Passport across platforms. An institution that reads a Passport can verify the holder's identity through the identifier without needing to contact the originating platform. The Passport is now portable in principle — it can exist independently of Mind Mechanism as the issuing platform.

---

## Phase 4 — The Access Economy
### Tiered access, institutional reads and writes, pricing
**Horizon: 18–24 months**

Phase 3 makes the Passport sovereign. Phase 4 makes it economically active. The holder can now grant access to institutions under defined terms, at a price they set, with a record of every access event.

**4.1 — Institutional Access Request Flow**
Build the access request and grant interface: an institution submits a scoped request (which sections, what purpose, what duration); the holder approves or denies it; approved access is issued as a time-limited, scope-limited session token; the access event is logged in the holder's audit log and anchored on-chain.

Initial use case: an academic partner requesting access to phrase consistency scores for a specific language for a defined research project. The holder grants or denies. If granted, the access is scoped to exactly what was requested.

**4.2 — Access Pricing Mechanism**
The holder may attach a price to institutional access — in money, in reciprocal data contribution, or in zero (for access they grant freely). For monetary pricing, the platform provides payment infrastructure that routes payment to the holder before access is granted. The platform takes a defined fee for facilitating the transaction. The holder receives the remainder.

This is the trade model in practice. The first real transaction where a user's data generates value that flows to the user.

**4.3 — Institutional Write Access**
An institution may request permission to write credentials, assessments, or records into the holder's Passport. The holder approves the write, reviews what has been written, and may annotate or dispute any institutional record. The institution's write is clearly marked as institutional provenance — it does not override the holder's own record. It sits alongside it.

Initial use case: a language school completing a course writes a completion credential into the learner's Passport. The learner can show it to a future employer by granting a scoped read. The school cannot alter it once written. The learner cannot alter it either — but can annotate it with their own account of the same period.

**4.4 — First Academic Research Output**
At this phase, the Universal Hypothesis dataset should be approaching the minimum threshold for a publishable finding (500 consenting users per language family, 8 typologically distinct families). Pre-register the primary hypothesis on OSF with on-chain timestamp. Conduct analysis. Publish the finding — positive, null, or mixed — with open data under CC BY 4.0.

This is the moment the research integrity commitment is publicly demonstrated. The publication is the credibility event that unlocks institutional partnerships, academic engagement, and the enterprise market's serious attention.

---

## Phase 5 — Open Standard
### Specification publication, third-party integration, standard stewardship
**Horizon: 24–30 months**

**5.1 — Passport Specification Publication**
Publish the Learner's Passport as an open standard: the data model, the sovereignty framework, the access tier model, the key management architecture, the on-chain anchoring protocol, the portable identifier scheme. Everything needed for a third party to implement a Passport-compatible system.

The specification is published before the MM platform reaches the scale at which competitors have strong incentive to copy it. The benchmark is established before the contest begins.

**5.2 — Reference Implementation**
The MM platform is the reference implementation of the standard. The specification links to the MM codebase as the canonical example. Academic and institutional partners who examine the standard find a live system that has already proven it in production.

**5.3 — Partnership Programme**
Formal engagement with educational institutions, academic partners, clinical practitioners, and enterprise clients under the institutional access model. The data sharing agreements, the access tier infrastructure, and the audit trail are all operational. The due diligence process finds the evidence already structured.

**5.4 — Governance Body**
At sufficient adoption, establish a stewardship body for the standard — open membership, academic and institutional representation, the operator as one voice among several. The standard must not be owned by any single commercial interest, including its creator. The moat is not exclusivity. The moat is having built it first and having done so in a manner that earns the trust of every subsequent participant.

---

## The Full Arc

```
Phase 1 — Foundations          Personal record + consent infrastructure + longitudinal data
Phase 2 — Passport Shell       Unified user view + export + research transparency + consent anchoring
Phase 3 — Sovereignty          Holder-controlled keys + silo separation + ownership anchoring
Phase 4 — Access Economy       Institutional access + pricing + writes + first research publication
Phase 5 — Open Standard        Specification + reference implementation + partnerships + governance
```

Each phase is independently valuable. Phase 1 is a better practice application. Phase 2 is a transparent personal record. Phase 3 is a sovereign data container. Phase 4 is an economic instrument. Phase 5 is an industry standard.

The Passport is all five simultaneously. The user who completes Phase 5 does not have a different product from the user who began in Phase 1. They have the same record, completed.

---

## What This Requires That Is Not Technical

**Legal review at every phase transition.** The GDPR interaction with on-chain data, the DPIA for acoustic data, the TTDSG compliance, the sovereign framework legal opinion — none of these can be substituted by documentation alone. A GDPR-qualified lawyer must review before Categories B and C activate, before the silo separation deploys, before the first institutional access transaction occurs.

**Academic partnership before Phase 4.** The research publication that unlocks institutional trust requires an academic co-author or institutional affiliation for publication in peer-reviewed venues. Begin building those relationships in Phase 2, when the research dashboard makes the dataset's quality visible.

**The Datenschutzerklärung in German.** Before any German-resident user is invited to consent to Category B or C, the Privacy Notice must exist in German. This is not optional.

**The specification must be published by an entity with standing.** The open standard in Phase 5 carries more weight if it is published alongside an academic paper, an institutional endorsement, or a formal submission to a standards body. Plan the publication event, not just the document.

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Companion to: LEARNERS_PASSPORT_CONCEPT.md, DATA_SOVEREIGNTY_STRATEGIC_BRIEF.md, BLOCKCHAIN_SOVEREIGNTY_NOTE.md, AUDITABILITY_NOTE.md, RESEARCH_PRINCIPLES.md, DATA_COLLECTION_PROTOCOL.md*
*Review cycle: at each phase transition*
