# Phrase Pattern Diagnostic — Design & Build Brief
### The Mnemonic Sequencer as Diagnostic Instrument
**Mind Mechanism | EIC Brief | 2026-05-08**

---

## The Vision in One Sentence

The user speaks a phrase, the sequencer encodes its pattern as a playable mnemonic, and repeated recordings against that mnemonic reveal whether their pronunciation is converging on the target or drifting away from it.

---

## The Core Loop (Five Steps)

This is one integrated flow, not two features.

```
1. PHRASE ENTRY          Enter the phrase. Mark syllable breaks.
        ↓
2. PATTERN MAPPING       The syllabic stress pattern maps onto the step grid.
                         Each syllable = one step. Stressed syllables = active.
                         Duration multipliers encode vowel length.
        ↓
3. MNEMONIC PLAYBACK     The user plays the sequence. The planetary tones
                         encode the phrase's rhythm and stress. They hear
                         the pattern before they speak it.
        ↓
4. RECORDING             The user speaks the phrase — ideally in time with
                         or immediately after the sequence. The phrase
                         analyzer tape captures it.
        ↓
5. COMPARISON            The acoustic pattern of the recording is measured
                         against the target pattern embedded in the sequence.
                         Prominence peaks, rhythm, vowel duration.
                         Repeat. Track convergence over sessions.
```

---

## What Already Exists

The pieces are built. They are not yet wired into a single flow.

### The Mnemonic Scaffold (Modular Sequencer components)
- **`MantraInput`** — phrase entry with `|` syllable delimiter and IPA notation field
- **`SyllabicAligner`** — distributes syllables across active steps, shows overflow
- **`SequencerGrid`** — the visual step grid
- **`lib/sequencer.ts`** — `parseMantraSyllables()`, `distributeSyllables()`, `Step` type with `durationMultiplier`
- **`lib/hooks/useSequencer.ts`** — full state management for the grid

These components were built correctly for this purpose. Cursor replaced them with `StepSequencer` as the primary view. They should not be deleted — they are the mnemonic scaffold layer.

### The Recording & Analysis Layer (StepSequencer)
- **Phrase Analyzer Tape** in `StepSequencer.tsx` — 3 independent pools, 10-second recording with pause/resume, tape jog, appraisal notes
- **`lib/phraseAcousticAnalysis.ts`** — full acoustic pipeline:
  - `prominenceCurve` — energy + pitch combined into a stress contour
  - `prominencePeaks` — where stress spikes occur, scored 0–100
  - `speechSegments` — rhythm segments (the production "bursts")
  - `f0` (pitch), `brightnessRatio`, `voicedFrameFraction`
- **`lib/phraseTranscribeClient.ts`** — Whisper word-level alignment (timestamps per word)
- **`app/api/phrase-transcribe/route.ts`** — server-side transcription endpoint

### The Tonal Association Layer (Synth Lab)
- **`SolarSystemResonance`** — live planetary tones, filter, layering. The ambient environment the user studies within.

---

## The Gap

The gap is integration, not new code.

**The step grid does not yet encode stress from the phrase.** Currently the user manually activates steps. The missing function is: when a phrase is entered and syllables are marked, the system analyses the phrase's natural stress pattern and pre-populates the grid — active steps for stressed syllables, inactive for unstressed, duration multipliers reflecting vowel length. The user then adjusts as needed. This is the auto-mapping step.

**The recording is not compared against the sequence pattern.** The phrase analyzer tape records and plays back but does not measure the recording against anything. The missing function is: take the `prominencePeaks` from the recording and compare their positions and scores against the active steps in the grid. The delta is the diagnostic output.

**Progress is not tracked across sessions.** Each recording is ephemeral. The missing function is a lightweight session log — not full audio storage (data concern, see companion brief), but the acoustic signature: prominence curve, peak positions, rhythm envelope. Small enough to store in Firestore per user. Comparable across sessions to show convergence.

---

## Architecture: Integrated Page Design

The correct home for this tool is a single page that combines both layers — not the current two separate pages.

```
┌─────────────────────────────────────────────────────────────┐
│  PHRASE ENTRY                                               │
│  "re|mem|ber|ing"  [language]  [IPA optional]               │
├─────────────────────────────────────────────────────────────┤
│  STEP GRID — mnemonic scaffold                              │
│  [re] [mem] [ber] [ing] ← syllables mapped to active steps  │
│  Node assignment per step = tonal colour per syllable        │
│  Duration multiplier = relative vowel length                 │
├─────────────────────────────────────────────────────────────┤
│  PLAYBACK CONTROLS                                          │
│  Play the pattern. BPM. Loop. Source (drone / synthetic).   │
├─────────────────────────────────────────────────────────────┤
│  PHRASE ANALYZER TAPE                                       │
│  [P1] [P2] [P3]  Record  Pause  Finish  Play  Play stacked  │
│  Record yourself. Compare pools. Annotate.                   │
├─────────────────────────────────────────────────────────────┤
│  PATTERN COMPARISON  (new — the diagnostic layer)           │
│  Target pattern: ░▓▓░░▓░░  (from step grid active pattern)  │
│  Your pattern:   ░░▓▓░▓░░  (from recording prominence curve)│
│  Delta: peak 2 arrived 0.3s late. Peak 3 merged.            │
└─────────────────────────────────────────────────────────────┘
```

This is one page. The `StepSequencer.tsx` handles the recording layer. The modular sequencer components handle the mnemonic scaffold. The pattern comparison is new UI on top of existing analysis data.

---

## Auto-Mapping: How to Derive Stress from a Phrase

When the user enters a phrase and marks syllable breaks, the system needs to suggest an initial stress pattern for the step grid. Three approaches in order of implementation complexity:

**Level 1 — IPA-based (immediate, no API cost)**
If the user provides IPA notation, parse the stress markers (`ˈ` primary, `ˌ` secondary). Primary stress → active step, full duration. Secondary stress → active step, ×1 duration. Unstressed → inactive step. This works for any language the user can transliterate.

**Level 2 — Whisper alignment (already built)**
Run the phrase through the existing Whisper transcription endpoint. The word-level timestamps give rhythm. Pair with the acoustic analysis to identify which syllable positions carry the most energy. Pre-populate the grid from the result. Show as a suggestion the user confirms or adjusts.

**Level 3 — Phonological rules per language (future)**
Language-specific stress rules (e.g. penultimate stress in Polish, final in French). Not worth building until the portal separation places this feature in the correct tier.

Start with Level 1. It requires nothing new — the IPA field already exists in `MantraInput`.

---

## Pattern Comparison: What to Show the User

The diagnostic output should be simple. The acoustic analysis produces more data than a student can use. Surface only what is actionable:

**Rhythm match** — did the user's speech segments land in the same positions as the active steps? Show as a visual overlay: target steps in grey, user's speech bursts in colour. Offset = how far off the rhythmic template they were.

**Stress accuracy** — did the user's prominence peaks match the active steps? A step that fired loud in the recording but was inactive in the grid = accidental stress. A step that was active but quiet in the recording = missed stress. Mark each active step green (hit) or amber (missed).

**Convergence indicator** — across sessions (P1 from session 1, P1 from session 2 etc.), is the rhythm match score improving? A single number, 0–100, calculated from peak position delta and stress accuracy combined. No diagnostic language. Just: higher is more consistent.

Do not show: F0 curves, brightness ratio, voicing fraction, MIDI values. These are for practitioners and the acoustic readout export. The student sees rhythm, stress hits, and a convergence score.

---

## Build Order for Cursor

Do not attempt this as a single pass. The integration has three discrete phases:

**Phase 1 — Unified page scaffold**
Create `/sequencer` as the integrated page. Mount `StepSequencer` in the lower half (recording layer — do not modify it). Mount the modular sequencer components in the upper half (mnemonic scaffold). Wire the `mantraText` and `syllables` from `useSequencer` into the step grid. Confirm both halves render and function independently before connecting them.

**Phase 2 — IPA-to-grid auto-mapping**
Parse IPA stress markers from the `ipaText` field. On parse, call `sequencer.assignStress(syllables, stressPattern)` — a new method on `useSequencer` that sets step active/inactive and duration multipliers based on the parsed pattern. Show as a suggestion with an "Apply" button. User can override manually.

**Phase 3 — Pattern comparison overlay**
After the user finishes a phrase pool recording (on `Finish pool` in the analyzer tape), run `analyzePhraseBlob()` on the blob. Extract `speechSegments` and `prominencePeaks`. Compare against the current step grid's active pattern. Render the rhythm overlay and stress accuracy indicators above the phrase tape. Store the convergence score (one number per completed pool) to Firestore under `users/{uid}/phraseProgress/{phraseHash}/{sessionDate}`.

---

## Constraints (carry forward from companion brief)

- Do not persist audio blobs to any server. Acoustic signatures only (numbers, no audio).
- Do not add AI evaluation language ("your pronunciation is X"). Show data, not verdicts.
- The IPA field and all analysis is opt-in. The tool functions without it.
- The convergence score is labelled "consistency" not "accuracy" or "correctness". It measures self-similarity, not deviation from a standard. The user is their own baseline.

---

## The Mnemonic Mechanism — Why This Works

This is worth stating plainly because it is the theoretical foundation of the feature.

The step sequencer, when loaded with a phrase's syllabic pattern, becomes an auditory template for that phrase's prosodic structure. Playing it trains the motor-auditory loop before the user speaks. This is a technique from music therapy and speech-language pathology — auditory rhythmic cueing — but here it is tonal rather than percussive. Each syllable is anchored to a planetary node, giving it somatic weight beyond rhythm.

When the user then records themselves speaking the phrase, they are comparing their production against a pattern they have already internalized aurally. The comparison is not abstract. It is: did I hit the pattern I just heard?

Repetition with this scaffold does three things simultaneously:
1. Reinforces the prosodic pattern of the target phrase (rhythm, stress, duration)
2. Builds an association between the phrase's meaning and its tonal environment (the planetary node assignment)
3. Creates a measurable record of whether that pattern is stabilizing across sessions

This is the diagnostic on the back of play. The student thinks they are making music. They are doing speech rehabilitation.

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Companion to: SOUND_IMPLEMENTATION_BRIEF.md*
*For execution in Phase 2 of the Student + Academic portal build*
