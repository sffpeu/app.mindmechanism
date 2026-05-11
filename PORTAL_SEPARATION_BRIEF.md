# Portal Separation — Build Brief
### Phase 5.1 — Cursor Implementation Brief
**Version 1.0 | 2026-05-11**

---

## What This Is

Mind Mechanism serves three distinct user populations with different needs, contexts, and vocabularies. Currently one generic consumer portal serves all of them. Phase 5.1 separates those experiences — not by splitting the codebase, but by introducing a register config layer that controls what each portal shows, emphasises, and says about itself.

**Three portals, one codebase, one data model.**

The Passport, the sequencer, the lexicon — identical underneath. What changes is framing, emphasis, feature visibility, and copy. A language learner and a corporate L&D manager are using the same engine. They should not experience the same product.

---

## The Three Portals

### Portal 1 — Consumer (live)
**URL:** `app.mindmechanism.com`
**User:** Individual language learner
**Frame:** Personal language intelligence, self-directed practice, vocabulary ownership
**Passport emphasis:** Personal sovereignty, research participation optional
**Status:** Currently live. Minimal change — this is the baseline.

### Portal 2 — Student + Academic
**URL:** `academic.mindmechanism.com` (or path-based: `app.mindmechanism.com/academic`)
**User:** Language students, teachers, academic researchers
**Frame:** Evidence-based learning, research collaboration, structured progression
**Passport emphasis:** Portable academic record, institutional access, research contribution
**Feeds into:** Urban Patwa i/We/u framework; research dashboard is front and centre
**Status:** Not yet built.

### Portal 3 — Corporate
**URL:** `corporate.mindmechanism.com` (or path-based: `app.mindmechanism.com/corporate`)
**User:** L&D professionals, managers, team leads
**Frame:** Language capability as organisational intelligence, team profiling, decision-making support
**Passport emphasis:** Team-level aggregates (anonymised), credentialing, compliance records
**Status:** Not yet built.

---

## Register Config Layer

### New File: `lib/portalConfig.ts`

```typescript
export type Portal = 'consumer' | 'academic' | 'corporate'

export interface PortalConfig {
  id: Portal
  name: string
  tagline: string
  heroHeadline: string
  heroSubtext: string
  features: {
    showResearchDashboard: boolean
    showPassportPanel: boolean
    showLexiconAnchor: boolean
    showNodeAffinity: boolean
    showPhraseProgress: boolean
    showInstitutionalAccess: boolean
    showCredentials: boolean
    showTeamAggregates: boolean    // Corporate only
    researchCTA: 'none' | 'soft' | 'prominent'
  }
  copy: {
    passportLabel: string          // "Learner's Passport" | "Academic Record" | "Language Profile"
    lexiconLabel: string           // "Personal Vocabulary" | "Academic Vocabulary" | "Working Vocabulary"
    practiceLabel: string          // "Practice" | "Study" | "Training"
    recordSectionTitle: string     // "My Record" | "My Academic Record" | "My Profile"
  }
  theme: {
    accentClass: string            // Tailwind accent color classes
  }
}

export const PORTAL_CONFIGS: Record<Portal, PortalConfig> = {
  consumer: {
    id: 'consumer',
    name: 'Mind Mechanism',
    tagline: 'Your language, your intelligence.',
    heroHeadline: 'Language intelligence that belongs to you.',
    heroSubtext: 'Build your vocabulary, track your patterns, own your record.',
    features: {
      showResearchDashboard: true,
      showPassportPanel: true,
      showLexiconAnchor: true,
      showNodeAffinity: true,
      showPhraseProgress: true,
      showInstitutionalAccess: true,
      showCredentials: true,
      showTeamAggregates: false,
      researchCTA: 'soft',
    },
    copy: {
      passportLabel: "Learner's Passport",
      lexiconLabel: 'Personal Vocabulary',
      practiceLabel: 'Practice',
      recordSectionTitle: 'My Record',
    },
    theme: {
      accentClass: 'text-indigo-600 dark:text-indigo-400',
    },
  },

  academic: {
    id: 'academic',
    name: 'Mind Mechanism Academic',
    tagline: 'Evidence-based language intelligence for learners and researchers.',
    heroHeadline: 'Your learning, made legible.',
    heroSubtext: 'A structured academic record of your language development — portable, sovereign, verifiable.',
    features: {
      showResearchDashboard: true,
      showPassportPanel: true,
      showLexiconAnchor: true,
      showNodeAffinity: true,
      showPhraseProgress: true,
      showInstitutionalAccess: true,
      showCredentials: true,
      showTeamAggregates: false,
      researchCTA: 'prominent',
    },
    copy: {
      passportLabel: 'Academic Record',
      lexiconLabel: 'Academic Vocabulary',
      practiceLabel: 'Study',
      recordSectionTitle: 'My Academic Record',
    },
    theme: {
      accentClass: 'text-emerald-600 dark:text-emerald-400',
    },
  },

  corporate: {
    id: 'corporate',
    name: 'Mind Mechanism Corporate',
    tagline: 'Language capability as organisational intelligence.',
    heroHeadline: 'Language is a leadership competency.',
    heroSubtext: 'Track individual profiles, understand team-level capability, support evidence-based L&D decisions.',
    features: {
      showResearchDashboard: false,
      showPassportPanel: true,
      showLexiconAnchor: false,
      showNodeAffinity: true,
      showPhraseProgress: true,
      showInstitutionalAccess: true,
      showCredentials: true,
      showTeamAggregates: true,
      researchCTA: 'none',
    },
    copy: {
      passportLabel: 'Language Profile',
      lexiconLabel: 'Working Vocabulary',
      practiceLabel: 'Training',
      recordSectionTitle: 'My Profile',
    },
    theme: {
      accentClass: 'text-slate-700 dark:text-slate-300',
    },
  },
}

export function getPortalConfig(portal: Portal): PortalConfig {
  return PORTAL_CONFIGS[portal]
}
```

---

## Portal Detection

### New File: `lib/detectPortal.ts`

```typescript
import type { Portal } from './portalConfig'

// Detect portal from hostname or environment variable
// In development: use NEXT_PUBLIC_PORTAL env var
// In production: detect from subdomain
export function detectPortal(): Portal {
  // Server-side or build-time: use environment variable
  if (typeof window === 'undefined') {
    const envPortal = process.env.NEXT_PUBLIC_PORTAL
    if (envPortal === 'academic' || envPortal === 'corporate') return envPortal
    return 'consumer'
  }

  // Client-side: detect from hostname
  const hostname = window.location.hostname

  if (hostname.startsWith('academic.') || hostname.includes('/academic')) return 'academic'
  if (hostname.startsWith('corporate.') || hostname.includes('/corporate')) return 'corporate'

  // Fallback: NEXT_PUBLIC_PORTAL (set per Vercel deployment)
  const envPortal = process.env.NEXT_PUBLIC_PORTAL
  if (envPortal === 'academic' || envPortal === 'corporate') return envPortal

  return 'consumer'
}
```

---

## Portal Context

### New File: `contexts/PortalContext.tsx`

```typescript
'use client'
import { createContext, useContext, type ReactNode } from 'react'
import { detectPortal } from '@/lib/detectPortal'
import { getPortalConfig, type PortalConfig, type Portal } from '@/lib/portalConfig'

interface PortalContextValue {
  portal: Portal
  config: PortalConfig
}

const PortalContext = createContext<PortalContextValue | null>(null)

export function PortalProvider({ children }: { children: ReactNode }) {
  const portal = detectPortal()
  const config = getPortalConfig(portal)
  return (
    <PortalContext.Provider value={{ portal, config }}>
      {children}
    </PortalContext.Provider>
  )
}

export function usePortal(): PortalContextValue {
  const ctx = useContext(PortalContext)
  if (!ctx) throw new Error('usePortal must be used within PortalProvider')
  return ctx
}
```

---

## Wire Into App

### File: `app/layout.tsx`

Wrap the app with `PortalProvider`:

```tsx
import { PortalProvider } from '@/contexts/PortalContext'

// Inside the root layout's body:
<PortalProvider>
  {children}
</PortalProvider>
```

---

## Apply Config to My Record

### File: `components/record/MyRecordView.tsx`

Use `usePortal()` to control panel visibility and labels:

```tsx
import { usePortal } from '@/contexts/PortalContext'

// In the component:
const { config } = usePortal()

// Replace hardcoded "My Record" with:
<h1>{config.copy.recordSectionTitle}</h1>

// Replace hardcoded "Learner's Passport" with:
<span>{config.copy.passportLabel}</span>

// Conditionally render panels:
{config.features.showResearchDashboard && <ResearchDashboard />}
{config.features.showLexiconAnchor && <LexiconPanel />}
{config.features.showNodeAffinity && <NodeAffinityMap />}
{config.features.showInstitutionalAccess && <AccessPanel />}
{config.features.showCredentials && <CredentialsPanel />}
```

---

## Apply Config to Navigation

### File: `components/layout/Navigation.tsx` (or equivalent nav component)

```tsx
const { config } = usePortal()

// Portal name in header:
<span>{config.name}</span>

// Portal tagline if shown:
<span>{config.tagline}</span>
```

---

## Apply Config to Research Consent CTA

### File: `components/research/ResearchConsentBanner.tsx` (or wherever the consent invite appears)

```tsx
const { config } = usePortal()

// Control whether the research CTA appears and how prominently:
if (config.features.researchCTA === 'none') return null

const isProminent = config.features.researchCTA === 'prominent'
```

Academic portal shows the research participation invite prominently — learners there are more likely to engage with the research framing. Corporate portal suppresses it entirely — not relevant to the L&D use case.

---

## Environment Variables Per Deployment

Each Vercel deployment (or subdomain) sets:

```
NEXT_PUBLIC_PORTAL=consumer    # default — no change needed
NEXT_PUBLIC_PORTAL=academic    # academic deployment
NEXT_PUBLIC_PORTAL=corporate   # corporate deployment
```

In development, set in `.env.local` to test a specific portal:
```
NEXT_PUBLIC_PORTAL=academic
```

---

## Phase 5.1 Scope Limit

This brief covers the config layer and its application to existing components. It does **not** cover:

- New landing pages per portal (Phase 5.2)
- Team aggregate features for Corporate (Phase 5.3 — requires team data model)
- Urban Patwa i/We/u framework integration into Academic (Phase 5.4)
- Corporate sector-specific packaging (separate strategic work stream)

Phase 5.1 delivers the foundation: one codebase, three operating modes, correct labels and feature gates everywhere.

---

## Files to Create

```
lib/portalConfig.ts
lib/detectPortal.ts
contexts/PortalContext.tsx
```

## Files to Modify

```
app/layout.tsx                          — wrap with PortalProvider
components/record/MyRecordView.tsx      — apply config labels + feature gates
components/layout/Navigation.tsx        — apply portal name/tagline
components/research/ResearchConsentBanner.tsx  — apply researchCTA gate
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

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Phase 5.1 of PASSPORT_ROADMAP.md — portal separation foundation*
*Companion: project_portal_separation.md, project_corporate_pivot.md*
