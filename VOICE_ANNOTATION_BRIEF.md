# Voice Annotation Brief
### Audio Post-It Notes for Deck Cards and Glossary
**Mind Mechanism | EIC Brief | 2026-05-08**

---

## The Function

A user records a phrase or word in the sequencer's phrase analyzer tape. They finish a pool. At that point they should be able to attach that recording to a deck card or a glossary entry — a personal voice note, anchored to a specific term in their study system.

When they return to that card or glossary entry, the recording is there. They tap it, hear themselves saying the word from a previous session. They compare to how they say it now. The annotation becomes part of the review loop.

This is not a pronunciation guide. It is a self-observation layer added to existing study materials. The student annotates their own learning — not with text notes (already possible) but with audio snapshots of where they were at a point in time.

---

## What Already Exists

**Glossary**: `GlossaryWord.audio_url?: string` — already in the type. Was designed for pre-recorded system pronunciation files. The hook is there. It needs to accept user-recorded content in addition to system content.

**Deck card**: `Annotation` type — has `userDef`, `notes`, `imageUrl`. Has no audio field. Needs one added.

**Compositions storage**: `lib/userCompositionsStorage.ts` — localStorage, base64, max 10 items, ~900KB cap per item. Works for loop compositions but is too constrained for a voice note system (size limit, count limit, no indexing by target).

**Phrase Analyzer Tape**: Records up to 10 seconds per pool. Currently each pool is an in-memory Blob. After `Finish pool` the blob is available. There is no pathway from that blob to the glossary or deck.

---

## Storage Architecture

Voice notes are personal audio data. They are stored locally only — no server.

Use **IndexedDB** via a lightweight wrapper (`lib/voiceNoteStorage.ts`). IndexedDB can hold binary blobs directly (no base64 conversion needed), supports keyed lookup, and has no meaningful size limit for this use case.

### Data model

```typescript
// lib/voiceNoteStorage.ts

export type VoiceNoteTarget =
  | { kind: 'glossary'; wordId: string }
  | { kind: 'deck-card'; nodeId: string }

export type VoiceNote = {
  id: string               // crypto.randomUUID()
  target: VoiceNoteTarget
  blob: Blob               // stored directly in IndexedDB
  mime: string             // 'audio/webm', 'audio/mp4', etc
  durationSec: number
  label: string            // the phrase text from MantraInput, or user-set
  createdAt: number        // Date.now()
  sessionContext?: string  // optional: which wheel lane / which sequence was playing
}
```

IndexedDB store name: `mm-voice-notes-v1`
Primary key: `id`
Index: `target.wordId` (for glossary lookup), `target.nodeId` (for deck lookup)

### Functions to expose

```typescript
saveVoiceNote(note: Omit<VoiceNote, 'id'>): Promise<string>
getVoiceNotesForTarget(target: VoiceNoteTarget): Promise<VoiceNote[]>
deleteVoiceNote(id: string): Promise<void>
getVoiceNoteAudioUrl(id: string): Promise<string>  // URL.createObjectURL(blob)
```

`getVoiceNoteAudioUrl` creates an object URL from the stored blob. The caller is responsible for revoking it when done (`URL.revokeObjectURL`).

---

## The Attachment Flow (Sequencer → Target)

After the user clicks "Finish pool" in the phrase analyzer tape:

1. The pool card shows a new button: **Attach to card / glossary**
2. A small modal opens with two tabs: **Deck card** | **Glossary word**
3. Deck card tab: the user's deck cards listed by term, searchable
4. Glossary tab: the user's glossary entries, searchable
5. User selects a target and confirms
6. The blob is saved to IndexedDB with the target reference
7. Confirmation: "Attached to [term]" — dismisses

The phrase label defaults to the `mantraText` content if present in the sequencer at the time of recording. If not, the user can enter a short label in the attach modal.

---

## Deck Card: The Post-It Visual

The `Annotation` type gets one new optional field:

```typescript
export interface Annotation {
  // existing fields unchanged
  audioNoteId?: string   // ID of VoiceNote in IndexedDB, if attached
}
```

When `audioNoteId` is set, the deck card renders a **voice note post-it** — a small overlay element attached to the bottom-left corner of the card.

### Visual spec

```
┌────────────────────────┐
│                        │
│   [card content]       │
│                        │
│                        │
├──┐                     │
│▶ │  "re|mem|ber|ing"   │  ← post-it strip, 28px tall
│  │  0.8s               │    soft amber background
└──┴─────────────────────┘
```

- Background: `bg-amber-100/80 dark:bg-amber-900/40`
- Height: 28px, full card width, rounded-b-lg to match card
- Left: play button (small, 20px icon)
- Label: the voice note's `label` (truncated if long)
- Right: duration in seconds, then a `×` delete button on hover
- Clicking play: creates object URL, plays via a hidden `<audio>` element, revokes URL on ended
- Only one voice note per card in this phase (the most recent attachment overwrites)

---

## Glossary: The Audio Indicator

The `GlossaryWord.audio_url` field was designed for system pronunciation. For user voice notes, use a parallel mechanism — do not overwrite `audio_url` with IndexedDB-sourced content.

Instead, the glossary word list and detail panel check `voiceNoteStorage.getVoiceNotesForTarget({ kind: 'glossary', wordId })` on mount. If notes exist, show:

- In the word list: a small `●` indicator next to the word, coloured to match the wheel
- In the detail panel: a **Voice notes** section below the definition, showing each note as a playable row

```
VOICE NOTES
──────────────────────────────────────
▶  "re|mem|ber|ing"     0.8s    ×
   2026-05-08
──────────────────────────────────────
▶  "HEART"              1.2s    ×
   2026-05-06
──────────────────────────────────────
```

Multiple notes are allowed per glossary entry — the user may record the same word across multiple sessions, building a timeline of their own pronunciation development. Each note is a snapshot; the collection becomes the record of progress.

---

## Connection to the Diagnostic Brief

This feature is downstream of the phrase diagnostic loop described in `PHRASE_DIAGNOSTIC_BRIEF.md`. Once pattern comparison is implemented:

- The voice note should optionally store the acoustic signature alongside the blob (the `prominenceCurve` array and `prominencePeaks` — numbers only, small)
- This makes the glossary timeline a progress record: not just "I recorded this word three times" but "here is how my stress pattern changed across those three recordings"
- Add `acousticSignature?: { prominenceCurve: number[]; peakPositions: number[]; consistencyScore: number }` to the `VoiceNote` type as a forward-compatible optional field — populate it now from the phrase tape analysis, use it later for the timeline visualization

This field costs nothing to add now. Not populating it is fine. Having the slot means the storage schema doesn't need a migration later.

---

## Build Order for Cursor

**Phase 1 — Storage layer**
Build `lib/voiceNoteStorage.ts` with the IndexedDB wrapper and the four exported functions. Write a simple test: save a blob, retrieve it, get an object URL, delete it. No UI yet.

**Phase 2 — Attach flow in StepSequencer**
After "Finish pool", add the "Attach to card / glossary" button and modal. On confirm, call `saveVoiceNote`. No display in the glossary or deck yet — just confirm the save works and the note persists across page reloads.

**Phase 3 — Deck card post-it**
Extend `Annotation` with `audioNoteId`. In `DeckCard.tsx`, render the post-it strip when `audioNoteId` is set. Wire play and delete.

**Phase 4 — Glossary voice notes panel**
In the glossary detail panel, load notes for the selected word and render the playable timeline. Add the `●` indicator to the word list.

---

## Constraints

- Audio blobs stored in IndexedDB only. No server upload, no Firebase Storage, no Firestore.
- The `audio_url` field on `GlossaryWord` is for system content only. Do not write user voice note object URLs into it — object URLs are tab-session ephemeral and will break on reload.
- Maximum 20 voice notes per target (enforced in `saveVoiceNote` — trim oldest if exceeded). Beyond that the storage grows without bound on a local device.
- No sharing. Voice notes are personal, local, and do not leave the device.
- The attach modal must make clear that recordings are stored on this device only.

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Companion to: PHRASE_DIAGNOSTIC_BRIEF.md, SOUND_IMPLEMENTATION_BRIEF.md, LANE_MODULATION_BRIEF.md*
