# Personal Lexicon Brief
### The Black Box — Self-Determined Vocabulary in the Glossary
**Mind Mechanism | EIC Brief | 2026-05-08**

---

## The Idea

The glossary already accepts user-created words. But it presents them through the same form and the same visual register as system vocabulary — implying the same standard, the same expectation of correctness, the same frame of "word as dictionary entry."

That frame is the problem. A user who brings their own vocabulary to the glossary should not feel they are entering a formal space that will silently evaluate their language. They should feel they are entering their own space, where their words are already valid before they arrive.

The Personal Lexicon is a dedicated zone within the glossary for exactly this. Slang, street vernacular, invented terms, family words, neologisms, dialect, code-switch vocabulary, private meanings for public words. Any word the user lives inside. No spell-check pressure. No system vocabulary to compare against. No implicit hierarchy.

The mechanism: a user who can bring "bare" or "wagwan" or "сейчас" or "ubuntu" into their personal lexicon — assign it to a wheel, hear it fired on a planetary lane, build their own rhythm around it — is doing somatic linguistics. They are mapping their lived language onto a framework that will eventually expand it. That is intrinsic motivation. It cannot be coerced. It can only be invited.

---

## What Already Exists

The `GlossaryWord` type already has the structural hooks:

```typescript
source: 'system' | 'user'     // user-created words already exist
user_id?: string               // keyed to the owner
clock_id?: number              // wheel assignment (0–8)
rating: '+' | '-' | '~'       // user sentiment
definition: string             // currently framed as a formal definition
language?: string              // already multilingual
```

What's missing is not the data model — it's the **frame, the space, and the questions asked**.

---

## What Changes

### 1. A new `personal` flag on GlossaryWord

```typescript
export interface GlossaryWord {
  // existing fields unchanged
  personal?: boolean    // true = Personal Lexicon entry
  context?: string      // where/how the user encounters this word
  own_definition?: string  // their definition, in their own words
}
```

The `definition` field remains for system vocabulary. `own_definition` is asked instead for personal entries — not "define this word" but "what does this mean to you."

`context` captures provenance: "heard it on the bus," "my grandmother's word for homesickness," "how we say it in my area." This is not metadata. It is the semantic record. It tells the system — and eventually the research — something the dictionary never could.

### 2. A dedicated tab in the glossary: **My Words**

Visually distinct from the main glossary. Darker, more personal, less structured. The UI language changes throughout:

| Standard Glossary | Personal Lexicon |
|---|---|
| "Add word" | "Add your word" |
| "Definition" | "What does it mean to you?" |
| "Phonetic spelling" | "How do you say it?" |
| "Assign to wheel" | "Where do you feel it?" |
| "Language" | "What language is this in?" |

The distinction is not condescending — it is respectful. It acknowledges that the user's relationship to their own vocabulary is different from their relationship to system vocabulary, and it asks accordingly.

### 3. The entry form — no dictionary pressure

When a user opens "Add your word" in the Personal Lexicon, the form has no required fields except the word itself. Everything else is optional and framed as invitation:

```
Your word
───────────────────────────────
[bare                         ]

What does it mean to you?  (optional)
───────────────────────────────
[very; a lot; an intensifier.
 used when something is obvious
 or excessive.                ]

How do you say it?  (optional)
───────────────────────────────
[ /bɛː/ ]

Where do you feel it in your body?  (optional)
  [○] Root    [○] Sacral   [●] Solar Plexus
  [○] Heart   [○] Throat   [○] Third Eye
  [○] M Crown [○] F Crown  [○] Etheric Heart

What's your relationship to it?
  [+] I use it   [~] It's complicated   [-] I'm moving away from it

What language or context?
───────────────────────────────
[British slang, South London  ]
```

No autocorrect. No spell-check underline. No suggestion that the word should look different. The word is entered as it is used.

### 4. Visual treatment in the word list

Personal Lexicon entries in the main glossary view are visually distinct — a subtle left-border accent in neutral tone (not wheel-coloured unless the user assigned a wheel), and a small ◆ glyph to indicate "personal." They do not visually compete with system vocabulary or suggest inferiority.

When a wheel is assigned, the personal entry takes on that wheel's colour — the same treatment as any system word. The word earns its place in the taxonomy's colour language when the user decides it belongs there.

### 5. The bridge to the sequencer

From any Personal Lexicon entry, a single action sends the word to the Mnemonic Scaffold in the sequencer — pre-filled in the MantraInput, syllable breaks suggested (or entered by the user), wheel assignment carried across if set.

A user who has "re|mem|ber|ing" in their personal lexicon assigned to the HEART wheel can open it in the sequencer and immediately work with it on the Venus lane. Their vocabulary enters the practice instrument on their own terms.

---

## The Intrinsic Motivation Mechanism

The research on second language acquisition is consistent: learners who feel their existing linguistic identity is respected within a learning context acquire new register faster than those who feel their existing language must be suppressed or corrected. (See: Cummins' Interdependence Hypothesis; Norton's Identity and Language Learning; Krashen's Affective Filter Hypothesis.)

The Personal Lexicon operationalises this within the MM framework. The user's slang is not a problem to be solved before formal vocabulary can begin. It is the substrate from which formal vocabulary grows. The wheel assignment is the bridge: when a user assigns "bare" to the SOLAR PLEXUS wheel (assertive, dynamic, Mars-energy — a reasonable assignment for a word that intensifies), they are doing the same cognitive work as a linguist assigning an abstract noun to a semantic category. They just didn't need to learn the linguist's vocabulary to do it.

Over time, the Personal Lexicon fills with their language. The system vocabulary on the same wheels begins to feel adjacent — related, not foreign. Acquisition follows from recognition, not from correction.

---

## Research Value

This is where the Personal Lexicon becomes unusually valuable scientifically.

User-assigned informal vocabulary is **stronger evidence for the Universal Hypothesis than formal vocabulary**. A user who assigns the formal word "grounding" to the ROOT wheel may be influenced by having read the node description. A user who assigns "heavy" (British slang for serious/intense) to the ROOT wheel, unprompted, from their own lived vocabulary — that is an independent data point. The system never told them ROOT is heavy. They felt it.

Aggregate enough of those data points across languages and the signal is extremely clean. Slang is culturally embedded and semantically dense in ways that formal vocabulary often is not. It carries somatic weight. That is why this matters for the research.

The `context` field is particularly valuable — it encodes provenance and cultural embedding that no dictionary entry carries. A word marked "grandmother's word for homesickness" carries different somatic weight than the dictionary entry for "nostalgia," even if they point at the same feeling.

---

## Data and Privacy Notes

Personal Lexicon entries follow the same consent framework as all Category B research data (see `DATA_COLLECTION_PROTOCOL.md`):
- The `own_definition` and `context` fields are **excluded from all research aggregation** — they are personal narrative, not research data
- Only `word_language`, `clock_id`, and `word_grade` (anonymised) contribute to the Universal Hypothesis dataset
- The word itself is excluded from research exports unless the user explicitly opts in to vocabulary contribution
- Personal Lexicon entries are marked `personal: true` and handled with the same care as voice notes — they are the user's own expression, not a public record

---

## Build Order for Cursor

**Phase 1 — Data model**
Add `personal?: boolean`, `own_definition?: string`, and `context?: string` to `GlossaryWord`. These are optional, backwards-compatible. Existing user-created words are unaffected (`personal` defaults to `false` when absent).

**Phase 2 — My Words tab**
Add a "My Words" filter/tab to the glossary scope buttons (alongside "All" and "Mine"). This tab shows only words where `source === 'user' && personal === true`. The empty state is an invitation: "This is your space. Any word you use belongs here."

**Phase 3 — Entry form**
A new "Add your word" modal/sheet with the reframed questions above. Distinct from the existing "Add word" flow, which remains for formal user-added vocabulary. The form is lower-friction, fewer required fields, different language throughout.

**Phase 4 — Bridge to sequencer**
"Open in Sequencer" action on any Personal Lexicon entry. Pre-fills MantraInput with the word, carries wheel assignment if set.

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Companion to: PHRASE_DIAGNOSTIC_BRIEF.md, VOICE_ANNOTATION_BRIEF.md*
