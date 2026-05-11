# Portal Node Tiers — Build Brief
### Phase 5.1 Addendum — Cursor Implementation Brief
**Version 1.0 | 2026-05-11**

---

## The Decision

The 482-node taxonomy is not available to all users. Access to nodes is tiered by portal and subscription level. The wheel nodes are the foundation — every user gets them. What distinguishes tiers is the depth and breadth of the taxonomy available to them.

---

## The Four Node Sets

| Tier | Portal / Level | Node Set | Approx. Count |
|---|---|---|---|
| **Wheel** | Consumer | 91 wheel nodes only | 91 |
| **Extended** | Academic · Corporate | Wheel + To A Quiet Place Within nodes | ~200+ |
| **Corporate** | Corporate (future) | Extended + corporate-specific customisations | TBD |
| **Full** | Academic Pro | All 482 taxonomy nodes | 482 |

### Wheel (Consumer)
The 91 nodes that power the sequencer wheels. These are the complete consumer product. No other taxonomy nodes are visible or accessible.

### Extended (Academic + Corporate base)
The 91 wheel nodes plus the nodes from *To A Quiet Place Within* — a specific body of work within the taxonomy. Exact node IDs to be confirmed by Sean against the master taxonomy. Combined total approximately 200+ nodes.

### Corporate (future customisation)
The Extended set plus corporate-specific wheel configurations and materials. Specification deferred — to be defined when the first corporate package is designed.

### Full (Academic Pro)
All 482 nodes. The complete taxonomy. No gates.

---

## Node Identification

Nodes are identified by `clock_id` (integer) in the existing data model. The 91 wheel nodes use `clock_id` values 1–91.

The *To A Quiet Place Within* node IDs need to be confirmed and listed. Until Sean provides the definitive list, the Extended set is defined by a named constant that is easy to populate:

```typescript
// lib/nodeTiers.ts

// The 91 wheel nodes — always clock_id 1–91
export const WHEEL_NODE_IDS: number[] = Array.from({ length: 91 }, (_, i) => i + 1)

// To A Quiet Place Within — node IDs TBC
// Sean to provide the definitive list from the master taxonomy
// Placeholder: empty array — replace with actual clock_ids
export const TAQPW_NODE_IDS: number[] = [
  // TODO: populate from master taxonomy
  // These are the nodes from "To A Quiet Place Within"
]

// Extended = Wheel + TAQPW
export const EXTENDED_NODE_IDS: number[] = [
  ...WHEEL_NODE_IDS,
  ...TAQPW_NODE_IDS,
]

// Full = all 482 nodes
export const FULL_NODE_IDS: number[] = Array.from({ length: 482 }, (_, i) => i + 1)

export type NodeTier = 'wheel' | 'extended' | 'corporate' | 'full'

export const NODE_TIER_IDS: Record<NodeTier, number[]> = {
  wheel: WHEEL_NODE_IDS,
  extended: EXTENDED_NODE_IDS,
  corporate: EXTENDED_NODE_IDS,   // same as extended until corporate spec is defined
  full: FULL_NODE_IDS,
}

// Check if a node is accessible for a given tier
export function isNodeAccessible(clockId: number, tier: NodeTier): boolean {
  return NODE_TIER_IDS[tier].includes(clockId)
}

// Filter a list of nodes to only those accessible in a given tier
export function filterNodesByTier<T extends { clock_id?: number | null }>(
  nodes: T[],
  tier: NodeTier
): T[] {
  return nodes.filter(n => n.clock_id != null && isNodeAccessible(n.clock_id, tier))
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

## Action Required from Sean

Before the Extended set can be fully activated, provide the `clock_id` values for the *To A Quiet Place Within* nodes. These should be pulled from the master 482-node taxonomy document.

Format needed: a list of integers, e.g. `[92, 93, 94, 107, 108, ...]`

Until that list is provided, the `TAQPW_NODE_IDS` array is empty and the Extended tier behaves identically to the Wheel tier. The architecture is in place — it just needs the data.

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
*Awaiting: TAQPW node ID list from master taxonomy*
