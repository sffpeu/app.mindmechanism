# Doorman — Build Brief
### Special Access Role — Cursor Implementation Brief
**Version 1.0 | 2026-05-11**

---

## What This Is

Doorman is a master-access role assigned to a single account — the operator. A Doorman account moves freely across all three portal identities, sees all 482 nodes, has every feature enabled, and can switch portal view in real time. It is not a portal — it is a key that opens all of them.

There is one Doorman. It cannot be self-assigned. It is set directly in Firestore against a specific UID.

---

## Role Definition

### Firestore — `users/{uid}`

Add a `role` field to the user profile document:

```
role: 'doorman' | 'user'    — default 'user', set manually in Firestore console
```

This is the only role that matters at this stage. One field. Set it to `'doorman'` on Sean's account directly in the Firestore console. No UI for role assignment — it is operator-only.

---

## New File: `lib/doorman.ts`

```typescript
import { useAuth } from './FirebaseAuthContext'

export function isDoorman(role: string | null | undefined): boolean {
  return role === 'doorman'
}

// Doorman always gets full node access regardless of portal
export function getDoormanNodeTier() {
  return 'full' as const
}

// All features on for Doorman regardless of portal config
export const DOORMAN_FEATURES = {
  showResearchDashboard: true,
  showPassportPanel: true,
  showLexiconAnchor: true,
  showNodeAffinity: true,
  showPhraseProgress: true,
  showInstitutionalAccess: true,
  showCredentials: true,
  showTeamAggregates: true,
  researchCTA: 'prominent' as const,
}
```

---

## Update: `contexts/PortalContext.tsx`

When the authenticated user has `role === 'doorman'`, override portal config with full access and add the active portal view state (so Doorman can switch between portal identities):

```typescript
'use client'
import { createContext, useContext, useState, type ReactNode } from 'react'
import { detectPortal } from '@/lib/detectPortal'
import { getPortalConfig, type PortalConfig, type Portal, PORTAL_CONFIGS } from '@/lib/portalConfig'
import { isDoorman, DOORMAN_FEATURES } from '@/lib/doorman'
import { resolveNodeTier } from '@/lib/nodeTiers'
import { useAuth } from '@/lib/FirebaseAuthContext'

interface PortalContextValue {
  portal: Portal
  config: PortalConfig
  isDoorman: boolean
  // Doorman-only: switch the viewed portal identity
  viewingAs: Portal
  setViewingAs: (portal: Portal) => void
}

const PortalContext = createContext<PortalContextValue | null>(null)

export function PortalProvider({ children }: { children: ReactNode }) {
  const detectedPortal = detectPortal()
  const { profile } = useAuth()
  const doorman = isDoorman(profile?.role)

  // Doorman can switch between portal views — defaults to detected portal
  const [viewingAs, setViewingAs] = useState<Portal>(detectedPortal)

  const activePortal = doorman ? viewingAs : detectedPortal
  const baseConfig = getPortalConfig(activePortal)

  // Doorman overrides: all features on, full node tier
  const config: PortalConfig = doorman
    ? {
        ...baseConfig,
        features: DOORMAN_FEATURES,
        nodeTier: 'full',
      }
    : baseConfig

  return (
    <PortalContext.Provider value={{
      portal: activePortal,
      config,
      isDoorman: doorman,
      viewingAs,
      setViewingAs,
    }}>
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

## New Component: `components/doorman/DoormanBar.tsx`

A persistent bar shown only to the Doorman account. Sits at the very top of the app, above everything else. Shows which portal is being viewed and allows switching. Subtle but always visible.

```tsx
'use client'
import { usePortal } from '@/contexts/PortalContext'
import type { Portal } from '@/lib/portalConfig'

const PORTALS: { id: Portal; label: string }[] = [
  { id: 'consumer', label: 'Consumer' },
  { id: 'academic', label: 'Academic' },
  { id: 'corporate', label: 'Corporate' },
]

export function DoormanBar() {
  const { isDoorman, viewingAs, setViewingAs } = usePortal()

  if (!isDoorman) return null

  return (
    <div className="w-full bg-gray-950 border-b border-gray-800 px-4 py-1.5 flex items-center gap-4">
      <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-500">
        Doorman
      </span>
      <div className="flex items-center gap-1">
        {PORTALS.map(p => (
          <button
            key={p.id}
            onClick={() => setViewingAs(p.id)}
            className={`
              px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.15em] transition-colors
              ${viewingAs === p.id
                ? 'text-gray-100 bg-gray-800'
                : 'text-gray-500 hover:text-gray-300'
              }
            `}
          >
            {p.label}
          </button>
        ))}
      </div>
      <span className="text-[9px] text-gray-600 ml-auto">
        All nodes · All features
      </span>
    </div>
  )
}
```

---

## Wire Into Layout

### File: `app/layout.tsx`

Add `DoormanBar` at the top of the layout, inside `PortalProvider`:

```tsx
import { DoormanBar } from '@/components/doorman/DoormanBar'

// Inside the body, as the first child after PortalProvider:
<PortalProvider>
  <DoormanBar />
  {children}
</PortalProvider>
```

The bar renders as a zero-height element for all non-Doorman users — it returns `null`, so there is no layout shift or visual noise for regular users.

---

## Activating Doorman

One step. Done directly in the Firestore console. No code:

1. Open Firestore → `data-mindmechanism` database
2. Navigate to `users/{Sean's UID}`
3. Add field: `role` · type: `string` · value: `doorman`
4. Save

That is all. The account immediately gets full access across all portals on next page load.

To revoke: delete the `role` field or set it to `user`.

---

## Security

- `role` is readable by the authenticated user (needed client-side for the DoormanBar)
- `role` is not writable by users — Firestore security rules must enforce this:

```javascript
// In existing users/{uid} rule — add:
match /users/{uid} {
  allow read: if request.auth.uid == uid;
  allow update: if request.auth.uid == uid
    && !('role' in request.resource.data.diff(resource.data).affectedKeys());
    // Users cannot modify their own role field
  allow create: if request.auth.uid == uid;
}
```

The `role` field is set by the operator (directly in Firestore console) and cannot be changed by the user themselves.

---

## Files to Create

```
lib/doorman.ts
components/doorman/DoormanBar.tsx
```

## Files to Modify

```
contexts/PortalContext.tsx     — Doorman override + viewingAs state
app/layout.tsx                 — mount DoormanBar
firestore.rules                — protect role field from user modification
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

## After the Build

Once Cursor has shipped this, go to the Firestore console and set `role: doorman` on your account. You will see the Doorman bar appear at the top of the app. From there you can switch between Consumer, Academic, and Corporate views in real time and see the system as each portal sees it — while always having full node access and every feature enabled.

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Special access role — not phase-numbered*
*One account. All doors.*
