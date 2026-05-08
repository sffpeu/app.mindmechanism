# Blockchain as User Sovereignty Infrastructure
### Methodological Note — Data Ownership, Consent Integrity, and Research Trust
**Version 1.0 | 2026-05-08**

---

> This note documents the connection between the Intrinsic Validity principle (INTRINSIC_VALIDITY_NOTE.md) and the blockchain security layer. The argument: if the data belongs to the user first, the architecture must make that ownership structurally verifiable — not merely stated in a privacy policy. Blockchain is the mechanism that converts a promise into a proof.

---

## The Problem with Policy-Based Promises

The DATA_COLLECTION_PROTOCOL.md sets out a rigorous consent framework. The RESEARCH_PRINCIPLES.md commits to hard rules that do not bend to commercial pressure. These documents are genuine commitments. They are also, at the architectural level, promises made by the operator.

The user has no independent mechanism to verify those promises are kept. They must trust:

- That consent records are not altered retroactively
- That withdrawn consent is honoured in full
- That their personal lexicon entries — their private vocabulary, their own definitions — remain theirs
- That the research pre-registration commitments are made before analysis begins, not after results are known
- That null results are published as committed, rather than suppressed when inconvenient

Policy documents can be edited. Server-side databases can be queried in ways the consent framework did not authorise. The user who reads this documentation and believes it has no structural recourse if the operator fails to honour it. Trust without verifiability is not sovereignty. It is delegation.

Blockchain converts that delegation into ownership.

---

## What Goes On-Chain

The blockchain layer is not proposed as a data storage solution. Personal data — lexicon entries, acoustic signatures, wheel assignments — does not belong on a public ledger. What goes on-chain is the **metadata of commitments**: the irrevocable record that a promise was made, by whom, when, and to what standard.

### 1. Consent Records

When a user gives or withdraws research consent (Category B or Category C), the event is hashed and committed to chain:

```
{
  user_hash: [salted, one-way hash of user ID — not reversible to identity],
  consent_category: 'B' | 'C',
  action: 'grant' | 'withdraw',
  timestamp: [Unix epoch],
  protocol_version: [version of DATA_COLLECTION_PROTOCOL at time of consent]
}
```

The user holds a reference to their own consent record. If they withdraw consent, the withdrawal event is on-chain. The operator cannot claim consent was never withdrawn, cannot alter the timestamp, cannot apply withdrawn consent to data collected after the withdrawal event. The record is theirs.

This is not a GDPR substitute — the data processing still occurs under GDPR's consent framework. It is a verification layer on top of GDPR: the consent record is not only held by the operator but anchored to a chain neither party can alter unilaterally.

### 2. Research Pre-Registration

The RESEARCH_PRINCIPLES.md commits to pre-registration of hypotheses via the Open Science Framework (OSF) before analysis begins. OSF timestamping is an existing academic standard. The blockchain layer extends this by anchoring the pre-registration hash on-chain at the point of commitment — before data collection reaches the minimum threshold for analysis.

What this proves: the hypothesis was stated before the data was analysed. The operator cannot post-hoc adjust the hypothesis to match the results and claim pre-registration. The chain timestamp is prior to any analysis timestamp. This is the structural equivalent of a sealed envelope — the prediction is locked before the result is known.

This directly supports the null results commitment. If the Universal Hypothesis is not supported by the data, the pre-registration record on-chain proves the hypothesis was genuine, the methodology was pre-committed, and the null result is a finding — not a failure to find the right framing.

### 3. Methodology Version Locks

The `PHRASE_ACOUSTIC_PIPELINE_VERSION` field in phraseAcousticAnalysis.ts is already tracked per session. The blockchain layer hashes and anchors each version of the analysis pipeline at the point of deployment. Any subsequent change to the pipeline produces a new version hash — there is no undetected alteration of the algorithm applied to historical data.

This satisfies the replication standard in RESEARCH_PRINCIPLES.md: a researcher replicating the study can verify not only that the algorithm was as described, but that the version applied to historical sessions matches the published description.

### 4. Personal Lexicon Ownership

The Personal Lexicon entries carry `own_definition` and `context` fields — personal narrative, excluded from research aggregation under the current protocol. These are the user's own words about their own words. They are not research data. They are, in the fullest sense, the user's property.

The blockchain layer provides the user with a verifiable ownership record for their personal lexicon: a merkle root of their entries, held by them, that proves the content existed at a given point in time and was not altered by the operator. If the user exports their lexicon and the entries match the hash they hold, the record is intact. If they do not match, they have proof of tampering.

This is not about data portability (which is already a GDPR right). It is about the user's ability to verify that what the system returns to them is what they put in — that the personal space is genuinely personal and not curated or modified by the operator.

---

## The Connection to Intrinsic Validity

The INTRINSIC_VALIDITY_NOTE.md argues that data validity follows from intrinsic motivation: the user is there for themselves, and genuine engagement produces genuine data. The blockchain sovereignty layer completes this argument structurally.

A user who doubts the privacy commitment cannot be fully present in the instrument. Distrust is its own affective filter. If the user suspects their slang entries will be used against them — for external evaluation, for targeted content, for any purpose they did not sanction — the personal lexicon is no longer a private space. It becomes a performance surface. The data it produces is not intrinsically motivated. It is managed.

Verifiable data sovereignty is therefore not merely a privacy feature. It is a precondition for the methodology to function. The user who knows — not believes, not hopes, but can independently verify — that their personal vocabulary is theirs is the user whose wheel assignments carry research weight.

The chain does not protect the data for the operator's benefit. It protects the user's ability to trust the instrument. From that trust, genuine engagement follows. From genuine engagement, valid data follows.

---

## Architecture Notes (Pre-Implementation)

The following are directional, not final. Legal and technical review required before specification is committed.

**Chain selection criteria:**
- Low transaction cost (consent events must be economically neutral for the user)
- Environmental sustainability posture (proof-of-stake, not proof-of-work)
- Established tooling for browser-based wallet interaction
- Compatible with GDPR's right to erasure — on-chain data is limited to hashes (not personal data), so erasure applies to the off-chain records the hashes reference, not the hashes themselves

**Identity model:**
- No public key is linked to a real-world identity on-chain
- The user's chain identity is a wallet address, generated at account creation, held by the user
- The salted user hash used in consent records is one-way and per-export-batch (per DATA_COLLECTION_PROTOCOL anonymisation standard)

**GDPR interaction:**
The hashes committed to chain are not personal data under GDPR Art. 4(1) — they are not reasonably capable of identifying the data subject without the salting key, which is not published. Legal review of this classification is required before implementation. The BfDI guidance on pseudonymisation and irreversible anonymisation is the relevant standard.

**User-facing model:**
The user does not need to understand blockchain to benefit from it. What they see: "Your data is yours. Here is your record. Here is how to verify it." The chain is the infrastructure. The interface is the trust signal. The methodology is what the trust enables.

---

## For the Greater Philosophy

The arc connecting these documents:

1. **INTRINSIC_VALIDITY_NOTE.md** — data validity requires the user to be there for themselves
2. **This document** — that genuine self-presence requires trust in the instrument's sovereignty commitments
3. **DATA_COLLECTION_PROTOCOL.md** — what is collected and under what consent framework
4. **RESEARCH_PRINCIPLES.md** — how the research is conducted and the hard rules that govern it

The chain is what makes the hard rules structurally enforceable rather than merely declared. The methodology is what makes the data worth collecting. The user's genuine engagement is what makes the methodology possible.

These are not separate concerns. They form a single argument.

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Pre-implementation. Requires legal review (GDPR interaction with on-chain hashes) and technical specification before build.*
*Companion to: INTRINSIC_VALIDITY_NOTE.md, DATA_COLLECTION_PROTOCOL.md, RESEARCH_PRINCIPLES.md*
