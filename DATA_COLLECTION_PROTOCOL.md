# Mind Mechanism — Data Collection & Research Protocol
### Protocols for Information Gathered and Extracted with Consent
**Version 1.0 | 2026-05-08 | Jurisdiction: Federal Republic of Germany (GDPR / TTDSG)**

---

> This document defines what data the Mind Mechanism application collects, why, on what legal basis, how consent is obtained, and how data may be used for research. It is written to satisfy GDPR compliance requirements and to serve as the foundation for academic research ethics submissions. It requires legal review before implementation. The supervisory authority for this jurisdiction is the Bundesbeauftragte für den Datenschutz und die Informationsfreiheit (BfDI).

---

## Part I — Data Architecture Overview

The application handles four distinct categories of data. Each has a different legal basis, a different consent requirement, and a different lifecycle.

```
┌─────────────────────────────────────────────────────────────────────┐
│  CATEGORY A — Operational                                           │
│  Account identity, saved content, session metadata                  │
│  Legal basis: Art. 6(1)(b) GDPR — performance of contract          │
│  Consent: not required (necessary for service)                      │
├─────────────────────────────────────────────────────────────────────┤
│  CATEGORY B — Behavioural / Usage                                   │
│  Wheel assignments, node usage, vocabulary distribution             │
│  Legal basis: Art. 6(1)(a) GDPR — explicit consent                 │
│  Consent: required, granular, withdrawable                          │
├─────────────────────────────────────────────────────────────────────┤
│  CATEGORY C — Acoustic Signatures                                   │
│  Numerical patterns derived from voice recordings                   │
│  Legal basis: Art. 6(1)(a) + Art. 9(2)(a) GDPR — explicit consent  │
│  Consent: required, separate from B, heightened standard            │
├─────────────────────────────────────────────────────────────────────┤
│  CATEGORY D — Voice Recordings                                      │
│  Audio blobs from phrase analyzer tape                              │
│  Storage: local device only (IndexedDB), never transmitted          │
│  Legal basis: not applicable — not processed by the controller      │
└─────────────────────────────────────────────────────────────────────┘
```

These categories are independent. A user may consent to B without consenting to C. A user may withdraw consent to B while retaining full account functionality. No tier of service access is conditional on research consent.

---

## Part II — Category Definitions

### Category A — Operational Data

**What is collected:**
- Email address and authentication identifiers (Firebase Auth)
- User-created content: glossary words, deck card annotations, saved sequences, notes, IPA notations
- Session metadata: timestamps of activity, session duration, feature areas used
- Account settings: language preferences, tone mode, subscription tier

**Why it is collected:**
Necessary to provide the service. Without this data the application cannot function.

**Retention:**
Retained for the duration of the account. Deleted within 30 days of account deletion. No research use. Not shared with third parties beyond Firebase (Google LLC, acting as data processor under a GDPR-compliant Data Processing Agreement).

**User rights:**
Subject access, rectification, erasure, and portability apply in full under GDPR Art. 15–20.

---

### Category B — Behavioural and Usage Data

**What is collected:**

| Field | Description | Example |
|---|---|---|
| `wheel_assigned` | Which of the nine wheels a user assigns a word to (0–8) | `3` (HEART) |
| `word_language` | ISO 639-1 language code of the word | `'yo'` (Yoruba) |
| `word_grade` | Vocabulary complexity grade (already on GlossaryWord) | `4` |
| `node_usage_count` | How many times each of the nine nodes is used in sequencer patterns | `{0: 12, 3: 8, ...}` |
| `practice_frequency` | Sessions per week, averaged over rolling 4-week window | `3.2` |
| `phrase_session_count` | Number of completed phrase pool recordings per phrase | `7` |
| `preferred_bpm_range` | BPM range used in sequencer, binned to 20-unit ranges | `60–80` |

**What is NOT collected in this category:**
- The word itself (only its grade and wheel assignment)
- Any personally identifying information
- Location data
- Device identifiers beyond session token

**Why it is collected:**
To test the Universal Hypothesis — that somatic-semantic associations are consistent across language families. Aggregated wheel-assignment data, cross-referenced by language, is the primary dataset for this research question. At scale, it produces a cross-linguistic somatic taxonomy dataset that does not exist in the academic literature.

**Legal basis:**
Art. 6(1)(a) GDPR — freely given, specific, informed, unambiguous consent. Consent is obtained through the Research Participation flow (see Part III). Withdrawal revokes future collection and flags existing records for exclusion from research aggregation; it does not trigger deletion of historical operational data (Category A).

**Retention:**
Retained in anonymised, aggregated form for up to 10 years for longitudinal research purposes, consistent with academic data retention standards. Individual-level records (keyed to user ID) are retained for 3 years from last active session, then aggregated into population-level summaries and individual records deleted.

---

### Category C — Acoustic Signatures

**What is collected:**

| Field | Description |
|---|---|
| `consistency_score` | Single integer 0–100 per completed phrase pool session |
| `rhythm_match_pct` | Percentage rhythm match against target pattern |
| `stress_hit_count` | Number of stress peaks matching active grid steps |
| `stress_miss_count` | Number of active steps without matching peak |
| `target_pattern` | Binary pattern of active steps (e.g. `[1,0,1,1,0,...]`) |
| `prominence_peak_positions` | Normalised time positions of acoustic peaks (float array) |
| `speech_segment_envelope` | Normalised onset/offset of voiced segments (float array) |

**What is NOT collected in this category:**
- The audio recording itself — this never leaves the device
- Raw waveform data
- F0 (pitch) values — excluded as health-adjacent biometric data
- Speaker identification features of any kind

**Why it is collected:**
To measure whether the mnemonic scaffold (planetary tone sequences mapped to syllabic stress patterns) produces measurable improvement in pronunciation consistency over repeated sessions. The research question: does the sequencer's tonal mnemonic produce faster stress pattern stabilisation than unaided repetition? This is testable with this dataset.

**Why this category is handled separately from B:**
Acoustic data derived from voice recordings carries heightened sensitivity under GDPR. Even when the raw audio is not transmitted, derived numerical data that characterises a person's speech patterns may constitute biometric data under Art. 4(14) GDPR when processed in a way that allows unique identification. Out of an abundance of caution, this category is treated as potentially special category data under Art. 9 and requires explicit, separate consent with a heightened standard of explanation.

**Legal basis:**
Art. 6(1)(a) + Art. 9(2)(a) GDPR — explicit consent with specific disclosure of the biometric-adjacent nature of the data. A Data Protection Impact Assessment (DPIA) under Art. 35 GDPR is required before this category is activated in production.

**Retention:**
Same as Category B — 3 years individual-level, then aggregated.

---

### Category D — Voice Recordings

Voice recordings made in the Phrase Analyzer Tape are stored exclusively in the user's browser via IndexedDB. They are never transmitted to any server operated by Mind Mechanism or any third party.

The application does not process this data in the GDPR sense — it is not collected, stored, or accessed by the data controller. The user is the sole controller of their own recordings. This is explicitly stated in the UI at the point of recording.

If a future feature requires server-side audio processing (e.g. Whisper transcription), this would require a separate DPIA, explicit consent for that specific transfer, and a clear disclosure that the audio will be transmitted. This is not currently implemented.

---

## Part III — Consent Mechanisms

### Principles

Consent in Mind Mechanism is:

1. **Freely given** — no feature, content, or subscription tier is conditional on research consent. A user who declines all research participation has full access to the application.

2. **Specific** — Category B and Category C each have their own consent, requested and withdrawable separately.

3. **Informed** — consent is requested through a Research Participation flow that explains in plain language what is collected, why, what it will be used for, who will have access, and how the user can withdraw.

4. **Unambiguous** — a clear affirmative action (not a pre-ticked box, not inaction interpreted as consent).

5. **Withdrawable** — at any time, without consequence, from the Settings page.

6. **Documented** — consent status and timestamp are stored per user in Firestore. If a user re-consents after withdrawing, a new timestamp is recorded. The consent log is never deleted.

### The Research Participation Flow

This is a dedicated UI moment — not a cookie banner, not a modal buried in onboarding. It appears once, 7–14 days after account creation (after the user has experienced the application), and is accessible at any time from Settings > Research Participation.

**Screen 1 — What this is**

```
CONTRIBUTING TO THE RESEARCH

Mind Mechanism is built on a testable hypothesis: that certain words
and sounds carry consistent somatic meaning across languages and
cultures. We don't know yet whether that's true at scale.

You can help us find out — anonymously, with full control over
what you share and when you stop.

This takes 2 minutes to read. It matters.

[Continue]  [Not now — remind me later]  [Never ask again]
```

**Screen 2 — What we collect (Category B)**

```
OPTION 1 — USAGE PATTERNS  (anonymised)

If you turn this on, we collect:
  · Which of the nine wheels you assign words to
  · How often you practice, in general terms (not exact times)
  · Which nodes you use in sequences

We do NOT collect:
  · The words themselves
  · Your name or any identifying information
  · Your location
  · Your recordings (these never leave your device)

This data is used to test whether people across languages tend to
assign similar kinds of words to the same wheels. We publish the
findings. We do not sell the data.

[Turn on usage patterns]  [Skip this one]
```

**Screen 3 — What we collect (Category C)**

```
OPTION 2 — PRACTICE PROGRESS  (acoustic patterns, anonymised)

This option is separate from Option 1.

If you use the phrase analyzer tape and turn this on, we collect
numerical patterns from your recordings — not the audio itself,
which always stays on your device.

What we collect: numbers describing where stress and rhythm fall
in your speech, and how consistent that is across sessions.

What we use it for: to measure whether the tonal mnemonic (the
step sequence) helps people improve pronunciation consistency
faster than practice without it.

A note: these numbers describe patterns in your speech. We treat
them with the same care as health data. They are never used to
identify you, assess you, or make decisions about you.

[Turn on practice progress]  [Skip this one]
```

**Screen 4 — Summary and confirmation**

Shows what the user selected, with a reminder that they can change this at any time in Settings. Confirmation button. No dark patterns.

---

## Part IV — Research Use Protocols

### Access tiers

**Tier 1 — Internal research (Mind Mechanism team)**
Full access to anonymised individual-level records. Purpose: product development, hypothesis testing, internal reporting.

**Tier 2 — Academic partnership**
Aggregated population-level data only. No individual-level records. Access via formal data sharing agreement with the receiving institution. The agreement must specify: the research question, the dataset required, the retention period at the receiving institution, the prohibition on re-identification attempts, and the requirement to acknowledge MM in publications.

**Tier 3 — Published datasets**
Aggregated summaries with cell suppression (no cell with fewer than 10 contributing users is published). Published under CC BY 4.0 with a link to this protocol.

### Anonymisation standard

Before any data leaves the MM Firestore environment for research purposes, it passes through an anonymisation pipeline:

1. User IDs replaced with salted hashes (different salt per export batch — the same user appears as a different identifier in each export)
2. Exact timestamps binned to week (not day or hour)
3. Rare language codes suppressed if fewer than 20 users in the dataset use that language
4. Any free-text fields (glossary word text, appraisal notes) excluded entirely
5. Age, location, and device data excluded (not collected in the first place)

### The primary research question

**Hypothesis:** The nine-wheel somatic taxonomy of the Mind Mechanism is cross-linguistically consistent — that is, speakers of different languages will assign words with semantically similar somatic qualities to the same wheel at rates significantly above chance.

**Dataset required:** Category B wheel-assignment records, stratified by language, minimum 500 users per language pair for statistical significance.

**Method:** Inter-rater reliability analysis across language groups. Consistency metric: Krippendorff's alpha for nominal data (wheel assignment). Secondary: correspondence analysis between language family and wheel distribution.

**Minimum threshold for publication:** Data from at least 8 typologically distinct language families, minimum 500 consenting users per family.

**Estimated time to threshold:** Unknown — depends on user acquisition. The data collection infrastructure should be active from launch so the dataset begins accumulating from day one.

### Secondary research questions

These are testable once sufficient data is collected.

1. Does the mnemonic scaffold (step sequencer + planetary tones) produce faster pronunciation consistency improvement than unscaffolded repetition? (Category C data, requires a control condition — users who do not use the sequencer but do use the phrase tape)

2. Is there a correlation between node/wheel affinity profile and vocabulary acquisition rate? (Categories A + B combined, longitudinal)

3. Do Polyvagal-theory predictions about tonal regulation hold in practice — specifically, does sustained exposure to HEART and THROAT lane tones correlate with longer practice sessions? (Category B node usage + Category A session duration)

---

## Part V — User Rights and Governance

### Rights under GDPR

| Right | How exercised | Response time |
|---|---|---|
| Access (Art. 15) | Settings > My Data > Download | 30 days |
| Rectification (Art. 16) | Edit directly in-app | Immediate |
| Erasure (Art. 17) | Settings > Delete Account | 30 days for server data |
| Restriction (Art. 18) | Settings > Research Participation > Withdraw | Immediate effect on future collection |
| Portability (Art. 20) | Settings > My Data > Export JSON | 30 days |
| Object (Art. 21) | Settings > Research Participation > Withdraw | Immediate |

### Withdrawal

When a user withdraws research consent:
- Future collection under that category stops immediately
- Existing records in that category are flagged with `research_excluded: true`
- Flagged records are excluded from all future research aggregations
- Records are not deleted (they remain in Firestore as operational data)
- The user's Category A operational data is unaffected

### Incident response

If a data breach occurs that affects Category B or C research data:
- BfDI notified within 72 hours (GDPR Art. 33)
- Affected users notified without undue delay if the breach poses a high risk (Art. 34)
- Research data exports issued after the breach date are suspended pending review

### Required before activation

Before Categories B or C are activated in production:

- [ ] Legal review of this protocol by a GDPR-qualified lawyer
- [ ] DPIA completed for Category C (Art. 35 — acoustic data as potentially biometric)
- [ ] Privacy Notice updated to include research data processing
- [ ] Consent flow implemented and tested in staging
- [ ] Firebase security rules updated to enforce consent flag before writing research fields
- [ ] Data Processing Agreement confirmed with Google (Firebase) covers research data processing
- [ ] Academic partnership template agreement drafted
- [ ] Contact address for data subject requests published (required: future@theoneleggedpoet.com or a dedicated data@mindmechanism.com)

---

## Part VI — The Research Value Statement

This section is written for communication to potential academic partners, grant bodies, and institutional ethics review boards.

The Mind Mechanism application is a distributed research instrument designed to test a falsifiable hypothesis in linguistics, cognitive science, and somatic psychology. The hypothesis — that meaning encoded in sound and embodied sensation is cross-linguistically consistent — has been advanced theoretically but has not been tested at scale with speakers across diverse language families.

The application collects, with informed consent, a novel dataset: the spontaneous somatic-semantic categorisation decisions of language users across languages, cultures, and practice contexts. Each time a user assigns a word to one of the nine somatic wheels, they are performing a categorisation task that maps their lexical knowledge onto an embodied framework. At scale, this produces the first large-sample cross-linguistic test of the somatic-semantic taxonomy.

Separately, the phrase diagnostic layer collects acoustic progress data for practitioners working on pronunciation consistency in a second or additional language. This constitutes a longitudinal dataset for research on tonal mnemonic scaffolding as a language acquisition intervention — a research area with applications in clinical speech-language pathology, second language acquisition, and educational technology.

Both datasets are collected under rigorous consent protocols, processed in accordance with GDPR, and available for academic partnership under the terms set out in Part IV.

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Requires legal review before implementation*
*Supervisory authority: BfDI — www.bfdi.bund.de*
