# Urban Patwa Framework Integration — Build Brief
### Phase 5.4 — Cursor Implementation Brief
**Version 1.0 | 2026-05-11**

---

## What This Is

The Urban Patwa framework is a pedagogical structure for language learning built around two axes:

- **Subject position:** `i` (self) · `We` (collective) · `u` (other / universal)
- **Temporal dimension:** `Past` · `Now` · `Future`

These two axes form a 3×3 matrix — nine cells, each representing a distinct context for language use and acquisition. This framework is the structural backbone of the Academic portal's practice experience. It organises how nodes are encountered, how sessions are framed, and how progress is understood.

Consumer portal users practice without this structure. Academic portal users practice *within* it — they know not just what they're practising, but which dimension of self and time they're working in.

---

## The 3×3 Matrix

```
              PAST          NOW           FUTURE
         ┌─────────────┬─────────────┬─────────────┐
    i    │  i · Past   │  i · Now    │  i · Future │
         ├─────────────┼─────────────┼─────────────┤
    We   │  We · Past  │  We · Now   │  We · Future│
         ├─────────────┼─────────────┼─────────────┤
    u    │  u · Past   │  u · Now    │  u · Future │
         └─────────────┴─────────────┴─────────────┘
```

Each cell is a practice context. A session in `i · Now` is about the self in the present moment. A session in `We · Past` is about collective memory and shared history. `u · Future` reaches toward the universal and the not-yet.

---

## Data Model

### Node Tags — extension to taxonomy nodes

Each node in the taxonomy can be tagged with one or more Urban Patwa cells. This is stored in a new Firestore collection:

```
urbanPatwaTags/{nodeId}
  clock_id: number              — references the taxonomy node
  word: string                  — node name (denormalised for lookup)
  cells: UrbanPatwaCell[]       — which cells this node belongs to
  tagged_at: string             — ISO 8601
  tagged_by: 'system'           — all tags are operator-curated, not user-defined
```

```typescript
export type SubjectPosition = 'i' | 'we' | 'u'
export type TemporalDimension = 'past' | 'now' | 'future'

export interface UrbanPatwaCell {
  subject: SubjectPosition
  temporal: TemporalDimension
}
```

Tags are operator-curated. Users do not tag nodes. The system uses these tags to organise the Academic portal's practice sessions.

### Session Framing — extension to practice sessions

When an Academic portal user starts a practice session, they optionally select a cell (or the system selects one based on their affinity profile). This is stored as a session frame:

```
// Added to existing session/practice data:
urban_patwa_cell: UrbanPatwaCell | null
// null = unframed session (Consumer default)
```

---

## New File: `lib/urbanPatwa.ts`

```typescript
import {
  collection, doc, setDoc, getDocs,
  query, where, type Firestore
} from 'firebase/firestore'
import { db } from './firebase'

export type SubjectPosition = 'i' | 'we' | 'u'
export type TemporalDimension = 'past' | 'now' | 'future'

export interface UrbanPatwaCell {
  subject: SubjectPosition
  temporal: TemporalDimension
}

export interface UrbanPatwaTag {
  clock_id: number
  word: string
  cells: UrbanPatwaCell[]
  tagged_at: string
  tagged_by: 'system'
}

export const SUBJECT_POSITIONS: SubjectPosition[] = ['i', 'we', 'u']
export const TEMPORAL_DIMENSIONS: TemporalDimension[] = ['past', 'now', 'future']

// All nine cells
export const ALL_CELLS: UrbanPatwaCell[] = SUBJECT_POSITIONS.flatMap(subject =>
  TEMPORAL_DIMENSIONS.map(temporal => ({ subject, temporal }))
)

export function cellKey(cell: UrbanPatwaCell): string {
  return `${cell.subject}·${cell.temporal}`
}

export function cellLabel(cell: UrbanPatwaCell): string {
  const subjectLabels: Record<SubjectPosition, string> = {
    i: 'i',
    we: 'We',
    u: 'u',
  }
  const temporalLabels: Record<TemporalDimension, string> = {
    past: 'Past',
    now: 'Now',
    future: 'Future',
  }
  return `${subjectLabels[cell.subject]} · ${temporalLabels[cell.temporal]}`
}

// Fetch all tagged nodes
export async function getUrbanPatwaTags(): Promise<UrbanPatwaTag[]> {
  if (!db) return []
  const ref = collection(db as Firestore, 'urbanPatwaTags')
  const snap = await getDocs(ref)
  return snap.docs.map(d => d.data() as UrbanPatwaTag)
}

// Fetch nodes for a specific cell
export async function getNodesForCell(cell: UrbanPatwaCell): Promise<UrbanPatwaTag[]> {
  if (!db) return []
  const ref = collection(db as Firestore, 'urbanPatwaTags')
  // Firestore array-contains query on the cells array
  // cells array contains objects — query by subject+temporal as a composite
  // Practical approach: fetch all and filter client-side (tag collection is small)
  const snap = await getDocs(ref)
  return snap.docs
    .map(d => d.data() as UrbanPatwaTag)
    .filter(tag =>
      tag.cells.some(c => c.subject === cell.subject && c.temporal === cell.temporal)
    )
}

// Write a tag (operator/admin use — not user-facing)
export async function tagNode(
  clockId: number,
  word: string,
  cells: UrbanPatwaCell[]
): Promise<void> {
  if (!db) return
  const ref = doc(db as Firestore, 'urbanPatwaTags', String(clockId))
  await setDoc(ref, {
    clock_id: clockId,
    word: word.trim().toLowerCase(),
    cells,
    tagged_at: new Date().toISOString(),
    tagged_by: 'system',
  })
}
```

---

## New Component: `components/academic/UrbanPatwaMatrix.tsx`

A 3×3 grid showing the nine cells. Used in the Academic portal's practice selection and progress views. Each cell is clickable — selecting it scopes the next practice session to that context.

```tsx
'use client'
import { ALL_CELLS, cellKey, cellLabel, type UrbanPatwaCell } from '@/lib/urbanPatwa'

interface UrbanPatwaMatrixProps {
  selectedCell?: UrbanPatwaCell | null
  onSelectCell?: (cell: UrbanPatwaCell) => void
  // Optional: counts of nodes per cell for display
  nodeCounts?: Partial<Record<string, number>>
  // Optional: practised count per cell
  practisedCounts?: Partial<Record<string, number>>
}

export function UrbanPatwaMatrix({
  selectedCell,
  onSelectCell,
  nodeCounts,
  practisedCounts,
}: UrbanPatwaMatrixProps) {
  const subjects = ['i', 'we', 'u'] as const
  const temporals = ['past', 'now', 'future'] as const

  return (
    <div className="w-full">
      {/* Column headers */}
      <div className="grid grid-cols-4 mb-2">
        <div /> {/* empty corner */}
        {temporals.map(t => (
          <div
            key={t}
            className="text-center text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-400"
          >
            {t}
          </div>
        ))}
      </div>

      {/* Rows */}
      {subjects.map(subject => (
        <div key={subject} className="grid grid-cols-4 gap-1 mb-1">
          {/* Row header */}
          <div className="flex items-center justify-end pr-3">
            <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              {subject}
            </span>
          </div>

          {temporals.map(temporal => {
            const cell: UrbanPatwaCell = { subject, temporal }
            const key = cellKey(cell)
            const isSelected =
              selectedCell?.subject === subject && selectedCell?.temporal === temporal
            const nodeCount = nodeCounts?.[key]
            const practisedCount = practisedCounts?.[key]

            return (
              <button
                key={key}
                onClick={() => onSelectCell?.(cell)}
                className={`
                  aspect-square border p-2 text-left transition-all
                  ${isSelected
                    ? 'border-gray-700 dark:border-gray-300 bg-gray-100 dark:bg-gray-800'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                  }
                `}
              >
                <div className="text-[9px] font-mono text-gray-500 dark:text-gray-400 mb-1">
                  {cellLabel(cell)}
                </div>
                {nodeCount != null && (
                  <div className="text-[8px] text-gray-400">
                    {practisedCount != null
                      ? `${practisedCount} / ${nodeCount}`
                      : `${nodeCount} nodes`}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
```

---

## New Component: `components/academic/AcademicPracticeSelector.tsx`

Shown in the Academic portal before starting a practice session. The user selects a cell (or chooses unframed practice). Only visible when `config.id === 'academic'`.

```tsx
'use client'
import { useState } from 'react'
import { UrbanPatwaMatrix } from './UrbanPatwaMatrix'
import type { UrbanPatwaCell } from '@/lib/urbanPatwa'

interface AcademicPracticeSelectorProps {
  onBegin: (cell: UrbanPatwaCell | null) => void
}

export function AcademicPracticeSelector({ onBegin }: AcademicPracticeSelectorProps) {
  const [selected, setSelected] = useState<UrbanPatwaCell | null>(null)

  return (
    <div className="max-w-sm mx-auto py-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400 mb-6">
        Choose a practice context
      </p>

      <UrbanPatwaMatrix
        selectedCell={selected}
        onSelectCell={cell =>
          setSelected(prev =>
            prev?.subject === cell.subject && prev?.temporal === cell.temporal
              ? null
              : cell
          )
        }
      />

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={() => onBegin(selected)}
          className="px-5 py-2.5 bg-gray-900 dark:bg-gray-100 text-gray-100 dark:text-gray-900 text-xs font-medium tracking-wide hover:opacity-80 transition-opacity"
        >
          {selected ? `Begin — ${selected.subject} · ${selected.temporal}` : 'Begin'}
        </button>
        {selected && (
          <button
            onClick={() => onBegin(null)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Practice without context
          </button>
        )}
      </div>
    </div>
  )
}
```

---

## Surface in My Academic Record

### File: `components/record/MyRecordView.tsx`

In the Academic portal, add the Urban Patwa matrix to the record view — showing which cells the user has practised in and how many nodes per cell:

```tsx
import { usePortal } from '@/contexts/PortalContext'
import { UrbanPatwaMatrix } from '@/components/academic/UrbanPatwaMatrix'

// In MyRecordView, after the existing panels — Academic portal only:
{config.id === 'academic' && (
  <section>
    <h2 className="...">Practice Map</h2>
    <UrbanPatwaMatrix
      practisedCounts={practisedCountsByCell}
      nodeCounts={nodeCountsByCell}
    />
  </section>
)}
```

---

## Firestore Security Rules

```javascript
match /urbanPatwaTags/{nodeId} {
  // Public read — tag data is not user-specific
  allow read: if true;
  // Write only via admin / operator — not user-writable
  allow write: if false;
}
```

Tags are written by the operator (via a seed script or Firestore console). Users never write to this collection.

---

## Seed Script Note

The `urbanPatwaTags` collection needs to be populated by hand or via a seed script once the node-to-cell mapping has been curated. This is operator work, not code work. The tagging of nodes to cells is an editorial decision — which nodes belong to `i · Now`, which to `We · Past`, etc.

This can be done incrementally in the Firestore console, or via a one-time seed script once the mapping spreadsheet is prepared.

---

## Files to Create

```
lib/urbanPatwa.ts
components/academic/UrbanPatwaMatrix.tsx
components/academic/AcademicPracticeSelector.tsx
```

## Files to Modify

```
components/record/MyRecordView.tsx    — add Urban Patwa matrix for Academic portal
```

## Files NOT to Touch

```
phraseAcousticAnalysis.ts
StepSequencer.tsx
SolarSystemResonance.tsx
lib/researchLogging.ts
app/api/consent-anchor/route.ts
lib/lexiconAnchor.ts
```

---

## Summary

After Phase 5.4:
- The Urban Patwa 3×3 matrix is a first-class UI component in the Academic portal
- Academic users can select a practice context before each session
- The matrix appears in My Academic Record showing coverage across all nine cells
- The data model supports tagging nodes to cells — ready to populate once the editorial mapping is done
- Consumer portal is entirely unaffected — this renders only when `config.id === 'academic'`

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Phase 5.4 of PASSPORT_ROADMAP.md*
*Companion: PORTAL_SEPARATION_BRIEF.md, project_urban_patwa.md*
*Editorial work required: node-to-cell mapping for urbanPatwaTags collection*
