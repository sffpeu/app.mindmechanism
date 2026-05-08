# Mind Mechanism — Scientific Principles & Ethical Governance
### Standards for Data Collection, Research Conduct, and Independent Verification
**Version 1.0 | 2026-05-08**

---

> Mind Mechanism is a small independent operation. We have no institutional affiliation, no external funding body, and no regulatory shield. We have a testable hypothesis, a rigorous methodology, and an ethical framework we are willing to defend in full. This document is written for the detractor. It anticipates every reasonable objection and answers it in advance — not defensively, but precisely. If a claim cannot be made to this standard, it is not made.

---

## Foundational Principles

### 1. The data describes patterns. It does not describe individuals.

This is not a privacy policy position. It is a scientific position.

Individual data points are not findings. A single user's node affinity profile tells you nothing about the taxonomy. A single user's consistency score tells you nothing about the mnemonic scaffold. The unit of analysis is always the population, the language group, the longitudinal cohort — never the person.

This principle governs every research output, every aggregate, every visualisation, every publication. When findings are presented, the question "what does this tell us about this person?" must have no answer. If it has an answer, the finding is not published.

### 2. Voice recordings never leave the device.

This is not a policy. It is an architectural constraint built into the application.

The phrase analyzer tape records audio to the browser's IndexedDB. It is not transmitted to any server. It is not accessible to the data controller. It is not processed by any system outside the user's device. The only data that moves from device to server is the numerical acoustic signature — numbers describing pattern, not audio describing voice.

This rule has no exception pathway in the current architecture. Any future feature that would require transmitting audio must be treated as a new product decision, not a feature extension, and requires a fresh DPIA, a fresh consent process, and a fresh review of this document.

### 3. Consent is the precondition, not the footnote.

Research data collection does not begin until informed consent is given. It stops the moment consent is withdrawn. There is no grace period, no delayed effect, no "we'll apply this to future data but not past." The switch is binary and immediate.

Consent is not obtained by default. Silence is not consent. Pre-ticked boxes are not consent. The Research Participation flow is designed so that the user who reads it and declines has made an informed decision that we respect fully and without consequence to their access.

### 4. We hold ourselves to the standard we would apply to others.

If we would not accept a methodology from a pharmaceutical company, a social media platform, or a government agency, we do not use it ourselves. The smallness of the operation is not a reason for lower standards. It is a reason for higher vigilance — because there is no institutional review board, no ethics committee, no external audit by default. The discipline must be internal and it must be stricter for it.

---

## The Four Research Data Streams

### Stream 1 — Cross-Session Phrase Progression

**What it measures:**
Change in acoustic consistency across repeated practice sessions with the same phrase. Consistency is defined as the degree to which prominence peaks and speech segment timing replicate the target pattern established in the step grid.

**The metric:**
`consistency_score` (0–100) per completed phrase pool session, calculated from:
- Stress hit rate: proportion of active grid steps that correspond to a recorded prominence peak, within a ±11% temporal tolerance window
- Rhythm match percentage: mean offset between target segment positions and recorded speech segment positions
- Weighted composite: stress accuracy (60%) + rhythm match (40%)

**What this metric measures:** Self-similarity relative to a self-defined target. It does not measure native-speaker accuracy. It does not measure correctness by any external standard. A user who consistently mispronounces a word in the same way scores 100. That is not a flaw in the metric — it is the point. Consistency is the precondition for improvement; the target of improvement is the user's own intention, not an externally imposed norm.

**The research question:**
Does the mnemonic scaffold — the step sequencer with syllabic mapping and planetary tone assignment — produce faster consistency stabilisation than unaided repetition? This is testable by comparing progress curves between users who use the sequencer actively (node-assigned, IPA-mapped) and users who use the phrase tape without the sequencer component.

**Limitations to state explicitly in all publications:**
- No randomised control condition at this stage — comparison is observational, between user subgroups
- Self-selection bias: users who engage more deeply with the sequencer scaffold may be more motivated practitioners regardless of the tool
- Consistency scores are phrase-specific and not generalisable across phrases without normalisation for phrase complexity
- Session frequency confounds progress rate — must be controlled in analysis

**Replication requirements:**
The consistency score algorithm is published in full with the methodology. The step grid representation (binary active pattern) and the acoustic analysis pipeline version number (currently `PHRASE_ACOUSTIC_PIPELINE_VERSION = 3`) are recorded with each session. Any researcher replicating the study can reconstruct the score from the raw fields.

---

### Stream 2 — Node Affinity Profiling

**What it measures:**
The distribution of a user's sequencer and glossary activity across the nine nodes over time. Which nodes appear most frequently in their step patterns. Which wheels carry the highest proportion of their personal vocabulary. How this distribution shifts across sessions.

**The metric:**
Per-node usage frequency normalised as a proportion of total node interactions, calculated over rolling 4-week windows. Represented as a nine-dimensional vector per user, per time window. The affinity profile is the trajectory of this vector over time.

**What this metric measures:** Habitual engagement patterns — which somatic territories a user returns to in practice. It does not measure preference in the sense of stated opinion. It does not measure psychological state, emotional condition, personality, or clinical presentation. A high affinity for the THROAT node means the user engages frequently with Mercury-associated vocabulary and sequences. It means nothing else.

**The research question:**
Do node affinity profiles cluster by language family, by practice purpose (language learning vs. somatic practice vs. recreation), or by vocabulary domain? If profiles cluster in theoretically predicted ways — language learners gravitating toward THROAT and SOLAR PLEXUS, somatic practitioners toward ROOT and HEART — that is evidence for the construct validity of the nine-node taxonomy.

**Limitations:**
- Affinity profiles reflect usage of the application's features, not usage of the underlying somatic framework in daily life
- Early users shape their profiles around feature discovery as much as genuine somatic preference
- Without demographic data (deliberately not collected), clustering analysis must rely on language and self-reported practice purpose only

**What this data is not used for:**
Node affinity profiles are not used to infer personality, health status, emotional state, or any other characteristic of the individual. They are not used for targeted content, personalised recommendations, or any commercial segmentation purpose. They are a research variable in the study of the taxonomy. They are shown back to the user as a personal reflection tool — "here is how your practice has been distributed" — without interpretation or evaluation.

---

### Stream 3 — Tonal Preference and Engagement Correlation

**What it measures:**
The statistical relationship between which nodes and tonal environments a user engages with and their practice engagement metrics (session duration, session frequency, return rate over 30-day periods).

**The metric:**
Spearman rank correlation between node usage proportion (per node, Stream 2) and engagement indicators. Calculated at population level across consenting users, stratified by declared practice purpose and language.

**The hypothesis:**
Polyvagal Theory (Porges, 2011) predicts that specific acoustic environments modulate the autonomic nervous system in ways that support sustained attention and engagement. The MM taxonomy maps nodes to planetary frequencies that, by their position in the somatic hierarchy, carry predicted regulatory qualities. Specifically: HEART (Venus, 221.23 Hz) and THROAT (Mercury, 141.27 Hz) are predicted to correlate with longer sustained practice sessions; ROOT (Saturn, 147.85 Hz) and SOLAR PLEXUS (Mars, 144.72 Hz) with shorter, more intense sessions.

This is a testable prediction, not an assertion. The data will confirm it, modify it, or refute it.

**Limitations:**
- Correlation is not causation. If HEART lane users practice longer, it may be because the Venus drone is pleasant, because those users are more experienced, because HEART vocabulary is easier, or because of any number of uncontrolled variables.
- The engagement metric is a behavioural proxy for sustained attention — not a measure of attention itself.
- The Polyvagal framework, while influential, is contested in parts of the neuroscience literature. We cite it as the theoretical source of the prediction; we do not cite the data as confirming Polyvagal Theory per se.

**What is claimed and what is not:**
If the correlation is found, we claim: users who engage with HEART and THROAT nodes tend to have longer practice sessions. We do not claim: the Venus and Mercury frequencies regulate the autonomic nervous system. The data supports the behavioural observation. The mechanistic claim requires a different study design.

---

### Stream 4 — Vocabulary Distribution Across the Nine Wheels

**What it measures:**
How each user's personal vocabulary distributes across the nine somatic wheels, and whether that distribution is consistent across users who share a language, a language family, or a practice context.

**The primary research question:**
The Universal Hypothesis states that somatic-semantic associations — the tendency to feel that certain words carry certain bodily weights and locations — are cross-linguistically consistent. If the hypothesis holds, speakers of Yoruba, Mandarin, Arabic, German, and Swahili will assign words with similar semantic properties to the same wheel at rates significantly above chance.

This is the most important research question in the Mind Mechanism framework. It is the one that, if confirmed, establishes the scientific foundation for everything else. It is also the one that, if refuted, requires the most honest reckoning.

**The metric:**
Per-wheel word count, normalised as a proportion of total user vocabulary, per language. Cross-language consistency measured using Krippendorff's alpha for nominal data (wheel assignment as the nominal variable). A value of α ≥ 0.667 is the threshold for tentative reliability; α ≥ 0.800 for strong reliability (per Krippendorff's own standard).

**The minimum dataset for a publishable finding:**
500 consenting users per language family, across a minimum of 8 typologically distinct language families. Language families must include at least one tonal language (e.g. Mandarin, Yoruba), one agglutinative language (e.g. Turkish, Swahili), one isolating language (e.g. Vietnamese), and one fusional language (e.g. Russian, Arabic) to satisfy typological breadth requirements for cross-linguistic claims.

**What a null result means:**
If wheel assignments do not cluster by semantic property across language families — if the distribution is random — that is a significant finding. It means the taxonomy is culturally specific, not universal. That result is equally important to publish. The hypothesis is falsifiable and the protocol is designed so that refutation is an outcome we document with the same rigour as confirmation.

**Limitations:**
- Users assign words after exposure to the MM framework. This may bias assignments toward the framework's own predictions — a form of demand characteristics
- The grade field and clock_id on system vocabulary provide a reference distribution, but system vocabulary was assigned by the taxonomy's author, not by independent raters — this is a circularity risk that must be disclosed
- Self-selected vocabulary may overrepresent domains the user finds interesting, not domains that test the taxonomy comprehensively

**The circularity mitigation:**
User-generated vocabulary (source: 'user') is the primary research dataset. System vocabulary (source: 'system') is the reference taxonomy, not a research observation. The analysis does not use system assignments as evidence for the hypothesis — only user assignments from users who have not been explicitly trained on the taxonomy's assignment rationale.

---

## Standards for Publication and External Communication

### What we claim

We claim only what the data directly supports. We do not extrapolate from behavioural data to mechanistic claims. We do not claim therapeutic efficacy on the basis of engagement data. We do not claim cross-linguistic universality on the basis of a single language pair.

Every published finding states:
- The dataset it is drawn from (size, language distribution, consent rate)
- The pipeline version used for any acoustic analysis
- The limitations specific to that finding
- Whether the finding is confirmatory (pre-registered hypothesis) or exploratory (post-hoc observation)

### Pre-registration

When sufficient data exists to approach the primary research question (Stream 4), hypotheses are pre-registered with the Open Science Framework (OSF) before analysis begins. Pre-registration prevents post-hoc rationalisation of results and demonstrates that findings were predicted, not selected.

Exploratory analyses are labelled as such and not presented as hypothesis tests.

### Replication

All methodology is documented in sufficient detail for independent replication:
- The consistency score algorithm is published in full (already in `lib/phraseAcousticAnalysis.ts`)
- The nine-node taxonomy (NODE_META in `lib/sequencer.ts`) is published as a reference dataset
- The full 482-node taxonomy is published as a citable reference dataset before any publication citing it as theoretical basis
- Data used in publications is deposited in a public repository (OSF or Zenodo) in anonymised, aggregated form under CC BY 4.0

### Conflicts of interest

The Mind Mechanism application is a commercial product. Research findings that support the application's value proposition benefit the operator commercially. This conflict is disclosed in all publications. Mitigations: pre-registration, open data, transparent methodology, willingness to publish null results.

---

## The Hard Rules

These are not guidelines. They do not have exceptions. They are not subject to commercial pressure, user acquisition targets, investor interest, or product roadmap constraints.

**1. Voice recordings never leave the device.**
If the architecture changes such that this becomes technically possible without explicit user action, that change does not ship.

**2. The data describes patterns, never individuals.**
No individual-level research output is produced. No finding references a user or a subgroup small enough to allow re-identification.

**3. Consent is withdrawn without consequence.**
A user who withdraws research consent loses nothing — no feature, no tier, no content. Any design that makes withdrawal costly is not implemented.

**4. Null results are published.**
If the Universal Hypothesis is not supported by the data, that finding is published with the same effort and investment as a positive result. The research is not conducted to confirm what we believe. It is conducted to find out whether it is true.

**5. The taxonomy is the independent variable, not the conclusion.**
The nine-wheel taxonomy is the framework being tested, not a given. Research findings inform the taxonomy's revision. If the data consistently shows that speakers of multiple language families do not distinguish between two wheels in their assignments, those wheels may need to be collapsed. The data leads.

---

## A Note on Independence

We are a small independent operation. We do not have an IRB. We do not have an institutional data protection officer. We do not have a grants committee or an academic department to answer to.

This is a vulnerability. We acknowledge it plainly.

The response to it is not to seek institutional cover before we have earned it. It is to build practices rigorous enough that institutional partners, when they arrive, find the work already done to a standard they recognise. It is to document everything. It is to publish the methodology before publishing the findings. It is to invite scrutiny rather than avoid it.

The detractor who examines this operation should find: clear consent mechanisms, conservative claims, documented limitations, pre-registered hypotheses, open data, and a hard rule against conclusions the data does not support.

That is the standard we hold ourselves to. It is the only standard that is worth holding.

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Companion documents: DATA_COLLECTION_PROTOCOL.md, SOUND_IMPLEMENTATION_BRIEF.md*
*Review cycle: annually, or following any material change to data collection methodology*
