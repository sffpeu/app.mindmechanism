# Passport Reader — Build Brief
### Phase 4.4 — Cursor Implementation Brief
**Version 1.0 | 2026-05-11**

---

## What This Is

Phase 4.1 built the access request flow — institutions request scoped access, the user approves, a token is issued. Phase 4.4 closes the loop: it builds the page where institutions actually use that token to read the scoped Passport data.

Without this, the token exists but does nothing. This is the reader that makes Phase 4.1 functional end-to-end.

The page is public-facing, token-gated. No institutional account required. Paste the Passport ID and token, see only the sections that were approved, nothing more.

---

## New API Route: `app/api/passport-read/route.ts`

Server-side. Validates the token, fetches only the approved scopes, returns the data. The token is never logged. The access event is recorded in the access log.

```typescript
import { NextRequest, NextResponse } from 'next/server'
import {
  doc, getDoc, collection, getDocs,
  query, where, orderBy, addDoc, type Firestore
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST(req: NextRequest) {
  try {
    const { passport_id, access_request_id, token } = await req.json()

    if (!passport_id || !access_request_id || !token) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })

    // Validate the access request
    const accessRef = doc(db as Firestore, 'passportAccessRequests', access_request_id)
    const accessSnap = await getDoc(accessRef)

    if (!accessSnap.exists()) {
      return NextResponse.json({ error: 'Access request not found' }, { status: 404 })
    }

    const access = accessSnap.data()

    if (access.token !== token) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
    }
    if (access.passport_id !== passport_id) {
      return NextResponse.json({ error: 'Passport ID mismatch' }, { status: 403 })
    }
    if (access.status !== 'approved') {
      return NextResponse.json({ error: `Access is ${access.status}` }, { status: 403 })
    }
    if (access.expires_at && new Date(access.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Access token expired' }, { status: 403 })
    }

    const scope: string[] = access.scope ?? []

    // Find the user by passport_id — query passport meta documents
    // passport/{uid} documents contain passport_id field
    // We need to find the uid for this passport_id
    const passportQuery = query(
      collection(db as Firestore, 'passport'),
      where('passport_id', '==', passport_id)
    )
    const passportSnap = await getDocs(passportQuery)
    if (passportSnap.empty) {
      return NextResponse.json({ error: 'Passport not found' }, { status: 404 })
    }
    const uid = passportSnap.docs[0].id

    // Fetch only the approved scopes
    const result: Record<string, unknown> = {
      passport_id,
      requester_name: access.requester_name,
      access_expires_at: access.expires_at,
      scope,
    }

    if (scope.includes('lexicon')) {
      // Personal lexicon — non-encrypted fields only (word, language, clock_id, created_at)
      // own_definition and context are encrypted and cannot be read by institutions
      const lexRef = collection(db as Firestore, 'glossary')
      const lexQ = query(
        lexRef,
        where('user_id', '==', uid),
        where('personal', '==', true),
        orderBy('created_at', 'desc')
      )
      const lexSnap = await getDocs(lexQ)
      result.lexicon = lexSnap.docs.map(d => {
        const data = d.data()
        return {
          word: data.word,
          language: data.language ?? null,
          clock_id: data.clock_id ?? null,
          created_at: data.created_at,
          // own_definition and context deliberately excluded — encrypted, user-private
        }
      })
    }

    if (scope.includes('phrases')) {
      // Phrase progress summaries — no raw content, only progress metrics
      const phraseRef = collection(db as Firestore, 'passport', uid, 'phraseSummaries')
      const phraseQ = query(phraseRef, orderBy('last_practiced', 'desc'))
      const phraseSnap = await getDocs(phraseQ)
      result.phrases = phraseSnap.docs.map(d => d.data())
    }

    if (scope.includes('affinity')) {
      // Latest node affinity profile
      const affinityRef = collection(db as Firestore, 'passport', uid, 'affinityProfiles')
      const affinityQ = query(affinityRef, orderBy('computed_at', 'desc'))
      const affinitySnap = await getDocs(affinityQ)
      result.affinity = affinitySnap.docs[0]?.data() ?? null
    }

    if (scope.includes('consent_record')) {
      // Consent record — category B and C status and timestamps only
      // No research data, no raw events
      const userRef = doc(db as Firestore, 'users', uid)
      const userSnap = await getDoc(userRef)
      const userData = userSnap.data()
      result.consent_record = {
        categoryB: userData?.researchConsent?.categoryB
          ? {
              granted: userData.researchConsent.categoryB.granted,
              timestamp: userData.researchConsent.categoryB.timestamp,
              protocolVersion: userData.researchConsent.categoryB.protocolVersion,
              txHash: userData.researchConsent.categoryB.txHash ?? null,
            }
          : null,
        categoryC: userData?.researchConsent?.categoryC
          ? {
              granted: userData.researchConsent.categoryC.granted,
              timestamp: userData.researchConsent.categoryC.timestamp,
              protocolVersion: userData.researchConsent.categoryC.protocolVersion,
              txHash: userData.researchConsent.categoryC.txHash ?? null,
            }
          : null,
      }
    }

    // Log the read event in the passport access log
    const logRef = collection(db as Firestore, 'passport', uid, 'accessLog')
    await addDoc(logRef, {
      request_id: access_request_id,
      requester_name: access.requester_name,
      requester_email: access.requester_email,
      scope,
      action: 'read',
      action_at: new Date().toISOString(),
      expires_at: access.expires_at ?? null,
      token_fingerprint: token.slice(0, 8),
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('passport-read error:', err)
    return NextResponse.json({ error: 'Read failed' }, { status: 500 })
  }
}
```

**Important:** `own_definition` and `context` are deliberately excluded from the lexicon scope. They are AES-256-GCM encrypted with the user's device key. The institution receives the word list (word, language, clock_id) — the structural vocabulary record — but not the user's private annotations.

---

## New Page: `app/passport/read/page.tsx`

Institution-facing reader. No authentication required. Token-gated at the API level.

```
VIEW A LEARNER'S PASSPORT
──────────────────────────────────────────────

Enter the Passport ID and your access token to
view the sections you have been approved for.

Passport ID
[MM-XXXX-XXXX-XXXX              ]

Access Request ID
[                               ]

Access Token
[                               ]

[View Passport]
```

On submit: POST to `/api/passport-read`. Render the result below.

### Rendered Passport View

```
─────────────────────────────────────────────
LEARNER'S PASSPORT

MM-3A7F-C291-BE04-F6D8
Access granted to: University of Hamburg
Expires: 9 Aug 2026

─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

PERSONAL VOCABULARY  (47 words)

  Sehnsucht          German  · Node 4  · Added 3 Mar 2026
  Weltschmerz        German  · Node 4  · Added 3 Mar 2026
  Fingerspitzengefühl German  · Node 7  · Added 8 Apr 2026
  …

─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

PRACTICE MAP

  Consistency score: 0.74 (last 28 days)
  Sessions: 18  ·  Phrases practiced: 61
  …

─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

CONSENT RECORD

  Category B (behavioural research)
  Status: Granted  ·  3 May 2026
  Protocol: 1.0  ·  [Verify on Polygon ↗]
```

Only the approved scopes appear. If only `lexicon` was approved, only the lexicon section renders.

**Error states:**
- `Access token expired` → "This access token expired on [date]. Contact the Passport holder to request a renewal."
- `Access is revoked` → "This access has been revoked by the Passport holder."
- `Access is denied` → "Access was not granted for this request."
- `Invalid token` → "The token does not match this access request."
- Generic error → "Unable to retrieve this Passport. Check your credentials and try again."

---

## Add Read Events to AccessPanel

### File: `components/record/AccessPanel.tsx`

The access log now records both approval events (from Phase 4.1) and read events (from Phase 4.4). Update the history display to show read events:

```
HISTORY

  Goethe Institut     Approved · expires 7 Jun 2026   [Revoke]
                      Last read: 10 May 2026 14:23

  University of Hamburg   Read · 9 May 2026
  Private request         Denied · 3 May 2026
```

Update `getAccessHistory` in `lib/accessRequests.ts` to also fetch `read` events from the access log alongside approved/denied/revoked events.

---

## Update Access Log Type

### File: `lib/accessRequests.ts`

The `action` field in the access log now includes `'read'`:

```typescript
// Update the AccessLog interface action type:
action: 'approved' | 'denied' | 'revoked' | 'read'
```

---

## Firestore Security Rules

```javascript
// No new collection rules required.
// passportCredentialRequests and passportAccessRequests are already covered.
// The passport/{uid}/accessLog already allows read/write for the authenticated uid.
// The API route runs server-side using the Firebase Admin SDK (or the client SDK
// with service account credentials) — it does not hit these client-side rules.
```

**Note:** The `/api/passport-read` route currently uses the client-side Firebase SDK imported from `@/lib/firebase`. If Firestore security rules block unauthenticated reads on `glossary/`, `passport/`, and `users/` collections, the route will fail. Two options:

1. Use the Firebase Admin SDK in the API route (recommended for production — bypasses client rules entirely)
2. Temporarily loosen the relevant Firestore rules for server-side reads

For now, implement with the existing client SDK. Add a `// TODO: migrate to Admin SDK` comment. The route runs server-side so the client key is not exposed, but Admin SDK is the correct long-term pattern.

---

## Files to Create

```
app/api/passport-read/route.ts
app/passport/read/page.tsx
```

## Files to Modify

```
components/record/AccessPanel.tsx    — show read events in access history
lib/accessRequests.ts                — add 'read' to action type
```

## Files NOT to Touch

```
phraseAcousticAnalysis.ts
StepSequencer.tsx
SolarSystemResonance.tsx
lib/researchLogging.ts
app/api/consent-anchor/route.ts
lib/lexiconAnchor.ts
lib/accessRequests.ts    — only the type change above, nothing else
```

---

## What This Delivers

After Phase 4.4:
- Institutions can read the scoped Passport data they were approved for
- Every read is logged in the user's access log with timestamp and token fingerprint
- The user can see in AccessPanel when their Passport was last read and by whom
- Private annotations (`own_definition`, `context`) are structurally excluded — not accessible even to approved institutions
- The consent record scope includes Polygon tx hash links so institutions can independently verify consent

Phase 4 is now fully functional. The Learner's Passport can be requested, approved, read, written to with credentials, and the full history is visible to the holder at all times.

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Phase 4.4 of PASSPORT_ROADMAP.md — closes the institutional access loop*
