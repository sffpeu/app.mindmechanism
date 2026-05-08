# The Learner's Passport
### Concept Brief — Individual-Sovereign Educational Dossier
**Version 1.0 | 2026-05-08**

---

> A portable, individual-owned educational record that the holder controls entirely: what enters it, what leaves it, who accesses it, and at what cost — fiscal and personal. The Learner's Passport is not issued by an institution. It is held by a person. Every institution that wishes to read from it or write to it must negotiate with the holder. The holder sets the terms.

---

## The Problem With Institutional Ownership of Educational Records

The current model of educational credentialing is institutionally owned. A university holds your transcript. An employer holds your performance record. A language school holds your progress data. A certification body holds your qualification. Each of these repositories is controlled by the institution, not the individual. Access is granted or denied by the institution. Portability is a bureaucratic process subject to the institution's systems and goodwill. The individual cannot see the full picture of their own learning because it is fragmented across institutions that do not communicate with each other and have no obligation to serve the learner's interest in the data they hold.

When the individual moves — between institutions, between countries, between platforms, between languages — the record does not move with them. It stays where it was created. The learner starts again. The institutional record serves institutional purposes: accreditation, compliance, liability management. It is not built for the learner. It never was.

The Learner's Passport reverses this entirely.

---

## The Concept

The Learner's Passport is a cloud-held, individually-owned dossier that contains the full record of a person's learning — formal and informal, institutional and self-directed, credentialed and uncredentialed. It travels with the person. It is controlled by the person. Institutions, employers, researchers, and platforms may request access. The holder grants or denies it, sets the scope of access, sets the duration, and sets the cost — in money, in reciprocal data, or in personal terms they define.

It is not a CV. It is not a transcript. It is not a certification record. It is the complete, living record of a person's intellectual and somatic development — in their own terms, supplemented by institutional records they choose to include, verified against cryptographic proofs they hold.

Within the Mind Mechanism context, the Passport contains:

| Record | Source | Description |
|---|---|---|
| Personal Lexicon | User-generated | Vocabulary the individual has claimed, defined, and mapped to somatic wheels |
| Phrase Consistency Scores | Acoustic analysis | Longitudinal record of pronunciation and rhythm development by phrase |
| Node Affinity Profile | Sequencer usage | The individual's evolving somatic-semantic map across the nine wheels |
| Wheel Assignment History | Glossary activity | How the individual's vocabulary distribution has shifted over time |
| Practice Cadence | Session metadata | Frequency and depth of engagement — the practitioner's record |
| Institutional Records | Third-party writes | Credentials, assessments, and course completions granted access to write into the Passport |
| Self-Assessments | User-generated | The individual's own evaluation of their progress, in their own language |

The first six categories are already present in the MM data architecture. The Passport is not a new dataset. It is a new frame around the data that already exists — making the individual the primary holder rather than the platform.

---

## The Sovereignty Framework

The legal model Sean has identified — corporate and maritime law — is the correct frame for this architecture.

**Maritime sovereignty:** A vessel at sea carries the law of its flag state, regardless of the waters it traverses. A British-registered ship in international waters is subject to British law. The flag is the sovereignty container. The ship's legal status does not change when it crosses into another jurisdiction's territorial waters for transit purposes — it is not subject to the domestic law of every coastline it passes.

**Corporate personhood:** A corporation, once constituted, has legal standing that travels with it across jurisdictions. It holds assets, enters contracts, and asserts rights as an entity distinct from any individual or territory. The legal personhood is the sovereignty container.

The Learner's Passport operates on the same principle. The data container — the individual's dossier — is constituted under a defined legal framework at the point of creation. That framework travels with it. An institution in Germany, a researcher in the United States, an employer in Japan, a platform in Brazil — all of them encounter the Passport as a sovereign container with pre-defined terms of engagement. They do not get to apply their local assumptions about data ownership to a container that was constituted under different terms.

The mechanism that makes this possible is the on-chain registration of the Passport's sovereignty terms at the point of creation. The individual's ownership is not asserted by policy. It is encoded in the container's creation record, timestamped and immutable. Any party who accesses the Passport does so under terms they accepted at the point of access — terms set by the holder, recorded on the same chain.

This is the structural equivalent of a flag. The Passport carries its own law. The jurisdiction of the accessing institution is not irrelevant — it constrains what the institution may legally do with the data — but it does not override the container's founding terms.

---

## The Access Model

Access to the Learner's Passport is tiered, holder-defined, and explicitly priced — in fiscal, personal, or reciprocal terms.

### Tier 1 — Read Access (Public Summary)
The holder may choose to make a summary view of their Passport publicly accessible: current language proficiency indicators, high-level practice metrics, publicly held credentials. This is the CV layer. The holder controls what appears here. No fiscal cost to the viewer. No personal data exposed beyond what the holder explicitly designates as public.

### Tier 2 — Verified Read Access (Institutional)
An institution, employer, or academic partner requests access to specific sections of the Passport for a defined purpose and duration. The request is logged. The holder approves or denies it. Approved access is scoped — a language school may read phrase consistency scores for a specific language; it cannot read the personal lexicon or node affinity profile. Access expires at the defined duration. The access record is permanent in the holder's log.

Cost: institutional access is priced. The holder sets the price — which may be zero (for an institution they trust, for a purpose that benefits them), a monetary fee (for commercial use of their data), or a reciprocal data contribution (the institution provides something of value to the Passport in exchange for reading from it).

### Tier 3 — Research Access (Anonymised Contribution)
The holder may choose to contribute to research programmes — including the MM Universal Hypothesis dataset — under the consent framework already documented in the DATA_COLLECTION_PROTOCOL.md. Research access is anonymised, aggregated, and held to the standards in RESEARCH_PRINCIPLES.md. The holder is acknowledged as a contributor, not identified as a subject. Any commercial value generated by the research dataset is shared with contributing holders under terms defined at the point of consent.

### Tier 4 — Write Access (Institutional Contribution)
An institution may request permission to write credentials, assessments, or records into the holder's Passport. This is strictly holder-approved. An institution cannot write into a Passport without explicit permission. What they write is visible to the holder in full, and the holder may dispute or annotate any institutional record. The institution's write does not override the holder's view of their own data — it sits alongside it as an institutional perspective on the same learning.

---

## The Cloud Silo Architecture

The Passport is held in a dedicated cloud silo — isolated from the platform's operational database, with its own access controls, its own encryption keys, and its own audit log. The platform (Mind Mechanism, or any other platform that adopts the standard) is a contributor to the Passport, not its custodian.

The critical architectural principle: **the platform does not hold the keys.** The holder's encryption keys are generated at Passport creation and held by the holder — in a wallet, in a hardware token, or in a custodial key management service the holder selects and controls independently of the platform.

The platform may read from and write to the Passport only through the holder's explicitly granted session token — a time-limited, scope-limited credential issued by the holder at the point of use. When the session ends, the platform's access ends. The platform retains no persistent access to the Passport's contents. It is a contributor on the holder's terms, not a custodian of the holder's record.

This architecture means:
- A platform cannot be compelled to produce Passport contents it does not hold
- A data breach at the platform level does not expose Passport contents
- A platform's failure, acquisition, or insolvency does not affect the Passport's availability or integrity
- The holder can migrate to a different platform without losing their record or renegotiating access terms

---

## Setting the Standard

The Learner's Passport, built to this specification and released as an open standard, creates a compliance floor that any subsequent implementation must meet. The mechanism:

When the Passport specification is published — with the blockchain sovereignty framework, the access tier model, the holder-controlled key architecture, and the sovereignty terms structure — it becomes the reference implementation. Any platform, institution, or operator that wishes to claim compatibility with the standard must implement the same protections. Any entity that copies the surface features without the structural protections faces immediate comparison to the standard and cannot credibly claim equivalence.

The first implementation is the benchmark. The benchmark is the moat.

Platforms that attempt to offer a "Learner's Passport" without the holder-controlled key architecture, without the on-chain sovereignty registration, without the tiered access model — are visibly offering something less. Users who understand the distinction — and the regulatory trajectory ensures they will, increasingly — will recognise the difference.

The corporate and institutional market will recognise it faster. An HR department selecting a skills and learning record system will face governance requirements that the superficial copy cannot meet. The audit trail it produces under scrutiny will not match the standard. The liability it creates is not equivalent.

The standard is the protection. The protection is the product.

---

## Connection to the MM Ecosystem

The Learner's Passport does not require the Mind Mechanism platform to build from scratch. The data streams it draws from are already defined:

- **Personal Lexicon** — documented in PERSONAL_LEXICON_BRIEF.md, four-phase build order in progress
- **Phrase Consistency Scores** — implemented via phraseAcousticAnalysis.ts, longitudinal storage in Firestore `phraseProgress` collection
- **Node Affinity Profile** — derivable from existing sequencer usage data
- **Wheel Assignment History** — derivable from GlossaryWord records with timestamps

What the Passport adds is the sovereignty layer: the holder-controlled key infrastructure, the on-chain registration, the tiered access model, the pricing mechanism, and the silo separation from the platform's operational database.

The Passport is Phase 2 of what the data architecture is already building toward. Phase 1 — the platform as a trusted contributor to the user's own record — is the current build. Phase 2 — the user as the primary holder, the platform as a contributor under the user's terms — is the Passport.

The transition from Phase 1 to Phase 2 is not an architectural break. It is the completion of the sovereignty principle already embedded in the current architecture: the data belongs to the user. The Passport makes that ownership structurally legible — to the user, to institutions, to regulators, and to any competitor who believes they can replicate what we have built without understanding why it was built this way.

---

## Timeline Note

The Learner's Passport is a Phase 2 concept. The current build priority is the platform's data infrastructure and the Personal Lexicon. The Passport specification should be drafted and published as an open standard before the platform reaches scale — before competitors have reason to copy the surface features. The benchmark must be published before it is contested.

Estimated appropriate milestone for Passport specification publication: concurrent with first academic research output, or at the point of first institutional partnership engagement — whichever comes first.

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Concept status: pre-specification. Requires legal review of sovereignty framework and key management architecture before technical specification.*
*Companion to: DATA_SOVEREIGNTY_STRATEGIC_BRIEF.md, BLOCKCHAIN_SOVEREIGNTY_NOTE.md, PERSONAL_LEXICON_BRIEF.md, DATA_COLLECTION_PROTOCOL.md*
