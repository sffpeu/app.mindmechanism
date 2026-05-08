# Sound Implementation Brief
### Sequencer & Synth Lab — Clinical vs Student Populations
**Mind Mechanism | EIC Brief | 2026-05-08**

---

## The Function

These two tools are not entertainment features with a serious side. They are clinical instruments with an engagement surface.

**The Sequencer** (StepSequencer) gives the user a rhythmic substrate — nine lanes mapped to the nine wheels — and a phrase analyzer tape. The primary function is self-observation: record your voice, play it back, compare pools, annotate where pronunciation drifts, where consonants fail, where tonal contour breaks from intention. This is the feedback loop of language correction. It is the same loop used in stuttering intervention, accent modification, and music therapy. The fact that it runs on planetary tones is not cosmetic — the tones are semantic anchors. A step on the THROAT lane (Mercury, 141.27 Hz) is a somatic cue, not a drum sound.

**The Synth Lab** (SolarSystemResonance) gives the user live access to the control tones, with the capacity to layer, filter, and eventually import their own material. The function is association-building: the student learns to attach their personal vocabulary to a specific sonic environment. Repeat exposure to the same tonal context while practising a word or phrase exploits environmental state-dependent memory. This is known, documented, and clinically applicable. It is also applicable carelessly by someone who does not know what they are doing.

---

## The Dual-Use Problem

The same interface cannot serve both populations without explicit scaffolding.

A **serious practitioner** — a speech-language pathologist, a clinical somatic therapist, a trained MM facilitator — approaches the phrase analyzer tape as a precision tool. They know what they are listening for. They understand that pool comparison is diagnostic, not recreational. They can interpret the acoustic readout. They are not harmed by access to raw data.

A **student** — whether in formal education, independent study, or the general consumer who has found the app — does not have that interpretive framework. They will use the tools as they feel like using them. This is fine. This is the point. But the following failure modes become available:

1. **Self-reinforcement of incorrect patterns.** A student records themselves, hears themselves, decides it sounds right, and repeats it. If the error is phonemic — a tonal language learner, a consonant cluster from an unfamiliar phonological system — the feedback loop reinforces the mistake. Without guided scaffolding, more exposure means more consolidation of the error.

2. **Pathological association.** Sound-vocabulary association work operates on neuroplasticity mechanisms. It is possible to form an association that is maladaptive. The student who consistently pairs a specific tone with anxiety or failure during a difficult study session is not building language — they are conditioning an avoidance response. This is not a theoretical risk. It is a documented outcome of poorly scaffolded music therapy and language learning interventions.

3. **Tone substitution breaking the semantic anchor.** The nine control tones are not arbitrary. They are derived from Cousto's Cosmic Octave and carry the semantic weight of the entire 482-node taxonomy. If the student replaces Saturn's tone with a song they like or a sound they find more pleasant, they sever the anchor. The personal tone may be enjoyable. It is no longer Saturn. The wheel no longer functions as designed. At scale — with users accumulating custom configurations — the system becomes internally incoherent.

4. **Misapplication of the clinical tools to self-diagnosis or self-treatment.** The phrase analyzer tape exists to support professional-guided review. A student using it alone, interpreting their own acoustic readout, comparing pools without a framework for what good looks like, is not in therapy. They may believe they are. This is the most serious concern.

---

## What This Means for the Build

### Before the sound customisation layer is built, the following must be resolved:

**1. Portal separation must precede feature expansion.**
The three-portal strategy (Consumer, Student + Academic, Corporate) is the correct architecture. The Sequencer and Synth Lab in their current form belong in Student + Academic. The Consumer portal should not expose the phrase analyzer tape without scaffolding. Build the portal config layer before extending the sound tools.

**2. Customisation must be bounded, not open.**
The student should be able to personalise their engagement with the synth lab — preferred tones, layering combinations, volume relationships. They should not be able to replace a planetary tone with an arbitrary upload in a way that persists as that node's identity. The architecture needs a clear distinction between:
- **Preset tones** (the Cosmic Octave frequencies — immutable in the taxonomy)
- **Personal layers** (the student's imported sounds — additive, not substitutive)
- **Compositions** (saved combinations of both — portable, shareable, but tagged as personal rather than canonical)

**3. The feedback loop needs a minimum viable scaffold.**
Before a student can use the phrase analyzer tape productively, they need:
- A target to compare against (model pronunciation, IPA reference, or a practitioner's reference recording)
- A simple evaluative framework (not AI diagnosis — something like: "listen for the consonant at the start of the second syllable")
- A clear exit path toward professional guidance if the work is therapeutic in intent

This does not require building a full clinical pathway. It requires a prompt, a reference, and a disclaimer with teeth.

**4. Voice recording is sensitive data.**
Recordings of users' voices are personal data under GDPR (Art. 4(14) — biometric data when used for identification; more broadly personal data in all cases). The phrase analyzer tape currently stores blobs in memory only — they do not persist beyond the session. This must be explicitly stated in the UI and must remain architecturally enforced. Any feature that persists phrase recordings to a server requires a DPIA, explicit consent, and a clear retention policy before it ships.

---

## What Cursor Should Not Touch Without Sign-Off

The following are not standard feature requests. They require a separate brief before implementation:

- Persisting phrase recordings to Firestore or any server
- Replacing planetary tone presets with user-uploaded audio at the node identity level
- Adding AI evaluation or scoring of user recordings
- Any feature described as "pronunciation feedback" or "correction"
- Sharing or social features attached to phrase pools

---

## The Student Opportunity

None of the above forecloses the student market. It defines the conditions under which it can be built responsibly.

The student who uses the synth lab to build personal associations with a vocabulary set they are learning — who layers a tone they find calming over the Mercury frequency while drilling THROAT-associated words, who builds a rhythm on the sequencer that matches the prosodic pattern of a phrase they are acquiring — is doing something real. The mechanism is sound. The engagement will be high because the experience is genuinely novel. The repeat engagement will be durable because the associations encode at depth.

This is a significant product differentiator. No mainstream language learning application works at this level. The risk is not that it does not work. The risk is that it works on people who are not prepared for what it does.

Build it carefully. Build it after the portal layer is in place. Build it with a practitioner review pathway baked into the student-facing UX from the start.

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*For discussion before the next Cursor build cycle on the sound customisation layer*
