# Portal Landing Pages — Build Brief
### Phase 5.2 — Cursor Implementation Brief
**Version 1.0 | 2026-05-11**

---

## What This Is

Phase 5.1 built the config layer — the portals can now operate in three distinct modes. Phase 5.2 gives each portal a front door. When someone arrives at the Academic or Corporate portal, they should immediately understand they are in the right place for their context. The copy, the framing, the CTA — all different. The engine underneath is identical.

The Consumer portal home page already exists. This brief creates the Academic and Corporate landing pages, and refactors the existing home page to pull its content from `PortalConfig` so all three are maintained in one place.

---

## Architecture

A single `app/page.tsx` (or `app/(home)/page.tsx`) renders the landing page. The `usePortal()` hook drives all content and layout variations. No duplicate page files.

---

## New Component: `components/landing/HeroSection.tsx`

The primary landing block. Pulls all copy from portal config.

```tsx
'use client'
import { usePortal } from '@/contexts/PortalContext'
import Link from 'next/link'

export function HeroSection() {
  const { config } = usePortal()

  return (
    <section className="min-h-[60vh] flex flex-col justify-center px-6 py-20 max-w-3xl mx-auto">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-6">
        {config.name}
      </p>
      <h1 className="text-4xl font-serif font-semibold leading-tight text-gray-900 dark:text-gray-100 mb-6">
        {config.heroHeadline}
      </h1>
      <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-10 max-w-xl">
        {config.heroSubtext}
      </p>
      <div className="flex items-center gap-4">
        <Link
          href="/register"
          className="px-6 py-3 bg-gray-900 dark:bg-gray-100 text-gray-100 dark:text-gray-900 text-sm font-medium tracking-wide hover:opacity-80 transition-opacity"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          Sign in →
        </Link>
      </div>
    </section>
  )
}
```

---

## New Component: `components/landing/FeatureStrip.tsx`

Three-column feature summary. Content varies by portal.

```tsx
'use client'
import { usePortal } from '@/contexts/PortalContext'

interface FeatureItem {
  label: string
  description: string
}

const PORTAL_FEATURES: Record<string, FeatureItem[]> = {
  consumer: [
    {
      label: 'Your vocabulary, encrypted',
      description: 'Your personal definitions are encrypted on your device. The platform holds ciphertext — nothing more.',
    },
    {
      label: 'Practice that knows you',
      description: 'The sequencer learns which nodes you return to, which you avoid, where your patterns live.',
    },
    {
      label: 'A record that\'s yours',
      description: 'Download your full data export at any time. Your Passport ID travels with you across platforms.',
    },
  ],
  academic: [
    {
      label: 'A portable academic record',
      description: 'Your progress, your vocabulary, your consent record — all in a Passport that institutions can verify directly.',
    },
    {
      label: 'Contribute to real research',
      description: 'Opt into the Universal Hypothesis dataset. Your anonymised patterns help build the empirical foundation for language acquisition science.',
    },
    {
      label: 'Institutional access on your terms',
      description: 'Grant time-limited, scope-limited access to your record. You control what goes in and what comes out.',
    },
  ],
  corporate: [
    {
      label: 'Language as a capability map',
      description: 'Understand how your team engages with language — not just what they score, but how they think and move through it.',
    },
    {
      label: 'Verified credential records',
      description: 'Write completion records and endorsements directly into individual Language Profiles. Permanently logged, independently verifiable.',
    },
    {
      label: 'Evidence for L&D decisions',
      description: 'Practice patterns, node affinity, consistency trajectories — structured data for structured decisions.',
    },
  ],
}

export function FeatureStrip() {
  const { config } = usePortal()
  const features = PORTAL_FEATURES[config.id] ?? PORTAL_FEATURES.consumer

  return (
    <section className="border-t border-gray-100 dark:border-gray-800 py-16 px-6">
      <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        {features.map(f => (
          <div key={f.label}>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-900 dark:text-gray-100 mb-3">
              {f.label}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
```

---

## New Component: `components/landing/ResearchCallout.tsx`

Only renders when `config.features.researchCTA !== 'none'`. Prominence varies between `soft` and `prominent`.

```tsx
'use client'
import { usePortal } from '@/contexts/PortalContext'
import Link from 'next/link'

export function ResearchCallout() {
  const { config } = usePortal()

  if (config.features.researchCTA === 'none') return null

  const isProminent = config.features.researchCTA === 'prominent'

  return (
    <section className={`py-12 px-6 ${isProminent ? 'bg-gray-50 dark:bg-gray-900' : ''}`}>
      <div className="max-w-3xl mx-auto">
        {isProminent ? (
          <div className="border border-gray-200 dark:border-gray-700 p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-4">
              Research Participation
            </p>
            <h2 className="text-xl font-serif text-gray-900 dark:text-gray-100 mb-4">
              Help build the evidence base for language acquisition.
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 max-w-lg">
              The Universal Hypothesis — that the affective state of a learner determines
              the quality of acquisition — is testable. Your anonymised practice patterns
              are the dataset. Consent is granular, revocable, and anchored on-chain.
            </p>
            <Link
              href="/research"
              className="text-sm text-gray-900 dark:text-gray-100 underline underline-offset-4 hover:opacity-70 transition-opacity"
            >
              Read about the research programme →
            </Link>
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Interested in contributing to language acquisition research?{' '}
            <Link href="/research" className="underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              Learn more →
            </Link>
          </p>
        )}
      </div>
    </section>
  )
}
```

---

## Update: Home Page

### File: `app/page.tsx` (or wherever the current landing page lives)

Replace hardcoded copy with the portal-driven components:

```tsx
import { HeroSection } from '@/components/landing/HeroSection'
import { FeatureStrip } from '@/components/landing/FeatureStrip'
import { ResearchCallout } from '@/components/landing/ResearchCallout'

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <FeatureStrip />
      <ResearchCallout />
    </main>
  )
}
```

All three portals use this same page. The content differences come entirely from `usePortal()`.

---

## Update: `lib/portalConfig.ts`

Add `heroHeadline` and `heroSubtext` to the config (these were specified in the Phase 5.1 brief — confirm they are present):

```typescript
consumer: {
  heroHeadline: 'Language intelligence that belongs to you.',
  heroSubtext: 'Build your vocabulary, track your patterns, own your record.',
  // ...
},
academic: {
  heroHeadline: 'Your learning, made legible.',
  heroSubtext: 'A structured academic record of your language development — portable, sovereign, verifiable.',
  // ...
},
corporate: {
  heroHeadline: 'Language is a leadership competency.',
  heroSubtext: 'Track individual profiles, understand team-level capability, support evidence-based L&D decisions.',
  // ...
},
```

---

## Portal-Specific Register Pages

The register flow should know which portal it belongs to and set the user's initial portal preference in their profile on creation.

### File: `app/register/page.tsx`

```tsx
const { config } = usePortal()

// On successful account creation, write portal preference to user profile:
await updateDoc(userRef, {
  portal: config.id,   // 'consumer' | 'academic' | 'corporate'
})
```

This stores which portal the user registered through. Used later for analytics and default experience restoration.

---

## What This Does NOT Include

- Pricing pages (Phase 4.2 deferred — no payment infrastructure yet)
- Team/organisation management for Corporate (Phase 5.3)
- Urban Patwa i/We/u content for Academic (Phase 5.4)
- Blog, documentation, or marketing pages

---

## Files to Create

```
components/landing/HeroSection.tsx
components/landing/FeatureStrip.tsx
components/landing/ResearchCallout.tsx
```

## Files to Modify

```
app/page.tsx                 — replace hardcoded copy with portal-driven components
lib/portalConfig.ts          — confirm heroHeadline + heroSubtext present
app/register/page.tsx        — write portal preference on account creation
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

After Phase 5.2:
- Consumer, Academic, and Corporate each have a distinct front door
- All three use one page file — content driven by portal config
- Research CTA is prominent on Academic, soft on Consumer, absent on Corporate
- Register flow records which portal a user came in through

The portals are now visually and editorially distinct from first contact.

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Phase 5.2 of PASSPORT_ROADMAP.md — portal landing pages*
*Companion: PORTAL_SEPARATION_BRIEF.md, PORTAL_NODE_TIERS_BRIEF.md*
