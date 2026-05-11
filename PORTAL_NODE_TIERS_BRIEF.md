# Portal Node Tiers — Build Brief
### Phase 5.1 Addendum — Cursor Implementation Brief
**Version 1.0 | 2026-05-11**

---

## The Decision

The 482-node taxonomy is not available to all users. Access to nodes is tiered by portal and subscription level. The wheel nodes are the foundation — every user gets them. What distinguishes tiers is the depth and breadth of the taxonomy available to them.

---

## The Four Node Sets

| Tier | Portal / Level | Node Set | Count |
|---|---|---|---|
| **Wheel** | Consumer | 91 wheel nodes only | 91 |
| **Extended** | Academic · Corporate | Wheel + 97 TAQPW nodes | ~188 (deduped) |
| **Corporate** | Corporate (future) | Extended + corporate-specific customisations | TBD |
| **Full** | Academic Pro | All 482 taxonomy nodes | 482 |

### Wheel (Consumer)
The 91 nodes that power the sequencer wheels. These are the complete consumer product. No other taxonomy nodes are visible or accessible.

### Extended (Academic + Corporate base)
The 91 wheel nodes plus the 97 nodes from *To A Quiet Place Within* — 5 stories, each with Recognition and Sovereign/Neutral nodes. Some names may overlap with wheel nodes; the union is deduped. Actual combined count will be confirmed once clock_id cross-reference is done against the master taxonomy.

### Corporate (future customisation)
The Extended set plus corporate-specific wheel configurations and materials. Specification deferred — to be defined when the first corporate package is designed.

### Full (Academic Pro)
All 482 nodes. The complete taxonomy. No gates.

---

## Node Identification

The 91 wheel nodes are identified by `clock_id` 1–91. The *To A Quiet Place Within* nodes are identified by name — the `clock_id` cross-reference against the full 482-node taxonomy is deferred. The filter uses normalised lowercase name matching, which is unambiguous and can be upgraded to clock_id lookup once the mapping is confirmed.

```typescript
// lib/nodeTiers.ts

// ── Wheel tier — clock_id 1–91 ────────────────────────────────────────────────
export const WHEEL_MAX_CLOCK_ID = 91

// ── To A Quiet Place Within — 97 unique nodes across 5 stories ───────────────
// Source: 3.5_Integrated_Node_Mapping — Diagnostic Narratology
// Normalised to lowercase for matching against taxonomy word field

export const TAQPW_NODE_NAMES: Set<string> = new Set([
  // Story 1 — Lily and the Garden of Light (Existential Joy & Grounding)
  'restlessness', 'apprehension', 'alarm', 'doubt', 'uncomfortable', 'hesitation', 'unsure',
  'seeking', 'awareness', 'curiosity', 'spiritual', 'presence', 'spontaneity', 'radiance',
  'bliss', 'joyousness', 'weightless', 'union', 'source', 'infinity',

  // Story 2 — Sam and the Book of Calm (ADHD & Environmental Agency)
  'distraction', 'aggravation', 'disorientation', 'limitation', 'jitteriness', 'misgivings',
  'deplorability', 'left behind',
  'grounded', 'core cantering', 'stability', 'steady', 'reflection', 'calm', 'peaceful',
  'assuredness', 'self-care', 'sanctuary', 'process', 'repetition',

  // Story 3 — Max and the Pulse of Life (Social Connection & Somatic Drum)
  'isolation', 'alienation', 'loneliness', 'overbearing', 'complexity', 'compulsion', 'apathetic',
  'resonating', 'empathy', 'connection', 'vitality', 'wholeness', 'heartbeat', 'insight',
  'belonging', 'authentic', 'discourse', 'universal',
  // union, curiosity already included above

  // Story 4 — Mia and the Soaring Soul (Trauma-Release & Generational Light)
  'grief', 'sorrow', 'heavy', 'crippling', 'ordeal', 'trapped', 'pathetic',
  'flight', 'imagination', 'freedom', 'release', 'relief', 'soaring', 'liberty', 'majesty',
  'grace', 'rebirth', 'uplifted', 'transcultural', 'reminiscence',

  // Story 5 — Emma and the Light of Freedom (Identity Resilience & Resisting Conformity)
  'chaos', 'outrageousness', 'pretentions', 'confusion', 'disdain', 'shamefulness', 'forbidden',
  'boldness', 'daring', 'achievement', 'motivation', 'resistance', 'authority', 'solid',
  'transform', 'cherished', 'excellence', 'inherent right', 'sovereignty',
  // authentic already included above
])

export type NodeTier = 'wheel' | 'extended' | 'corporate' | 'full'

// Check if a node is in the wheel tier (by clock_id)
function isWheelNode(clockId: number | null | undefined): boolean {
  return clockId != null && clockId >= 1 && clockId <= WHEEL_MAX_CLOCK_ID
}

// Check if a node is in the TAQPW set (by name)
function isTAQPWNode(word: string | null | undefined): boolean {
  if (!word) return false
  return TAQPW_NODE_NAMES.has(word.trim().toLowerCase())
}

// Check if a node is accessible for a given tier
export function isNodeAccessible(
  clockId: number | null | undefined,
  word: string | null | undefined,
  tier: NodeTier
): boolean {
  switch (tier) {
    case 'wheel':
      return isWheelNode(clockId)
    case 'extended':
    case 'corporate':
      return isWheelNode(clockId) || isTAQPWNode(word)
    case 'full':
      return true
  }
}

// Filter a list of nodes to only those accessible in a given tier
export function filterNodesByTier<T extends {
  clock_id?: number | null
  word?: string | null
}>(nodes: T[], tier: NodeTier): T[] {
  if (tier === 'full') return nodes
  return nodes.filter(n => isNodeAccessible(n.clock_id, n.word, tier))
}

// Resolve the effective node tier for a user
// Subscription level overrides portal default
export function resolveNodeTier(
  portalTier: NodeTier,
  subscriptionTier: string | null | undefined
): NodeTier {
  if (subscriptionTier === 'academic_pro') return 'full'
  return portalTier
}
```

---

## Update Portal Config

### File: `lib/portalConfig.ts`

Add `nodeTier` to `PortalConfig` and assign the correct tier per portal:

```typescript
import type { NodeTier } from './nodeTiers'

export interface PortalConfig {
  // ... existing fields ...
  nodeTier: NodeTier
}

export const PORTAL_CONFIGS: Record<Portal, PortalConfig> = {
  consumer: {
    // ... existing config ...
    nodeTier: 'wheel',
  },
  academic: {
    // ... existing config ...
    nodeTier: 'extended',    // Academic base = Extended; Academic Pro will be 'full'
  },
  corporate: {
    // ... existing config ...
    nodeTier: 'corporate',
  },
}
```

---

## Subscription Override

Academic Pro tier gets `full` regardless of portal. This is handled by a subscription check that overrides the portal-level tier:

```typescript
// lib/nodeTiers.ts — add:

// Resolve the effective node tier for a user
// Subscription level overrides portal default
export function resolveNodeTier(
  portalTier: NodeTier,
  subscriptionTier: string | null | undefined
): NodeTier {
  if (subscriptionTier === 'academic_pro') return 'full'
  return portalTier
}
```

Usage in any component that renders nodes:

```tsx
const { config } = usePortal()
const { profile } = useAuth()  // or however subscription tier is accessed

const nodeTier = resolveNodeTier(config.nodeTier, profile?.tier)
const visibleNodes = filterNodesByTier(allNodes, nodeTier)
// filterNodesByTier checks both clock_id (wheel gate) and word name (TAQPW gate)
```

---

## Where Node Filtering Applies

Apply `filterNodesByTier` anywhere the taxonomy is rendered or queried:

1. **Sequencer / Wheel** — only show nodes in the user's tier when selecting wheel positions
2. **Personal Lexicon** — only show taxonomy nodes in the user's tier as options when adding personal words
3. **Node Affinity Map** — only show affinity data for nodes in the user's tier
4. **Practice / Study session generation** — only draw from nodes in the user's tier

Do **not** filter:
- Words the user has already added to their personal lexicon (these are theirs regardless of tier)
- Passport data, consent data, credentials
- Research logging (all behavioural data is collected regardless of tier)

---

## Note on Clock ID Cross-Reference

The TAQPW filter currently uses node name matching. Once the master taxonomy clock_ids for these 97 nodes are confirmed, `isNodeAccessible` can be upgraded to a pure integer set lookup (faster, unambiguous). The function signature is already designed for this — just add clock_id checks alongside the name checks. Not urgent; name matching is precise for now.

---

## Files to Create

```
lib/nodeTiers.ts
```

## Files to Modify

```
lib/portalConfig.ts              — add nodeTier field to each portal
```

## Downstream application (separate tickets per component):
```
components/sequencer/StepSequencer.tsx     — filter available nodes by tier
components/glossary/GlossaryPanel.tsx      — filter taxonomy nodes shown
components/sequencer/NodeAffinityMap.tsx   — filter affinity map by tier
```

## Files NOT to Touch

```
phraseAcousticAnalysis.ts
SolarSystemResonance.tsx
lib/researchLogging.ts
app/api/consent-anchor/route.ts
lib/lexiconAnchor.ts
```

---

## Summary

| Portal | Node Tier | What they see |
|---|---|---|
| Consumer | `wheel` | 91 nodes — the complete consumer product |
| Academic | `extended` | ~200+ nodes — wheel + To A Quiet Place Within |
| Corporate | `corporate` | ~200+ nodes (same as extended until corp spec arrives) |
| Academic Pro | `full` | All 482 nodes |

Activities between tiers are decided later. Right now: the separation exists, the gates are in place, the data is there when needed.

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Phase 5.1 Addendum — companion to PORTAL_SEPARATION_BRIEF.md*
*TAQPW node names sourced from: 3.5_Integrated_Node_Mapping.html (Diagnostic Narratology, MM-INTEG-2026)*
