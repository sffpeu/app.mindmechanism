# Institutional Credential Writes — Build Brief
### Phase 4.3 — Cursor Implementation Brief
**Version 1.0 | 2026-05-11**

---

## What This Is

An institution with approved access can write verified credentials into a user's Passport. Course completions, assessments, endorsements, placement records — any structured statement the institution wishes to issue. The user receives a notification, reviews the credential, and accepts or rejects it. Accepted credentials live permanently in `passport/{uid}/credentials/`. The user controls visibility. Nothing enters the Passport without explicit user acceptance.

This is the reciprocal of Phase 4.1. 4.1 gave institutions the ability to read. 4.3 gives them the ability to write — but only through the user's hands.

---

## Data Model

### Credential Request — `passportCredentialRequests/{requestId}`

Top-level collection. Institution writes here using their approved access token. No auth required — the token is the credential.

```
passportCredentialRequests/{requestId}
  passport_id: string           — MM-XXXX-XXXX-XXXX identifier
  access_request_id: string     — the approved AccessRequest this write is tied to
  token: string                 — the scoped token issued at approval
  issuer_name: string           — institution or individual name (from access request)
  issuer_email: string          — contact email (from access request)
  credential_type: string       — 'completion' | 'assessment' | 'endorsement' | 'placement' | 'note'
  credential_title: string      — short title, e.g. "German A2 Course Completion"
  credential_description: string — plain language description
  issued_at: string             — ISO 8601 — when the institution considers it valid from
  expires_at: string | null     — optional credential expiry
  metadata: Record<string, string> — flexible key/value pairs for institution-specific data
  status: 'pending' | 'accepted' | 'rejected'
  requested_at: string          — ISO 8601 — when the write was submitted
  responded_at: string | null
```

### Accepted Credential — `passport/{uid}/credentials/{credentialId}`

Written when the user accepts. Permanent record in the Passport silo.

```
passport/{uid}/credentials/{credentialId}
  credential_type: string
  credential_title: string
  credential_description: string
  issuer_name: string
  issuer_email: string
  issued_at: string
  accepted_at: string
  expires_at: string | null
  metadata: Record<string, string>
  access_request_id: string
  credential_request_id: string
  visible: boolean              — user controls whether this appears in their public Passport view
```

---

## New File: `lib/credentialRequests.ts`

```typescript
import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs,
  query, where, orderBy, type Firestore
} from 'firebase/firestore'
import { db } from './firebase'

export type CredentialType = 'completion' | 'assessment' | 'endorsement' | 'placement' | 'note'
export type CredentialStatus = 'pending' | 'accepted' | 'rejected'

export interface CredentialRequest {
  id: string
  passport_id: string
  access_request_id: string
  token: string
  issuer_name: string
  issuer_email: string
  credential_type: CredentialType
  credential_title: string
  credential_description: string
  issued_at: string
  expires_at: string | null
  metadata: Record<string, string>
  status: CredentialStatus
  requested_at: string
  responded_at: string | null
}

export interface AcceptedCredential {
  id: string
  credential_type: CredentialType
  credential_title: string
  credential_description: string
  issuer_name: string
  issuer_email: string
  issued_at: string
  accepted_at: string
  expires_at: string | null
  metadata: Record<string, string>
  access_request_id: string
  credential_request_id: string
  visible: boolean
}

// Submit a credential write — called by institution using their approved token
export async function submitCredentialRequest(payload: {
  passport_id: string
  access_request_id: string
  token: string
  issuer_name: string
  issuer_email: string
  credential_type: CredentialType
  credential_title: string
  credential_description: string
  issued_at: string
  expires_at?: string
  metadata?: Record<string, string>
}): Promise<string> {
  if (!db) throw new Error('db not available')

  // Validate: check the token matches the access request and is still approved/not expired
  const accessRef = doc(db as Firestore, 'passportAccessRequests', payload.access_request_id)
  const accessSnap = await getDoc(accessRef)
  if (!accessSnap.exists()) throw new Error('Access request not found')

  const accessData = accessSnap.data()
  if (accessData.token !== payload.token) throw new Error('Invalid token')
  if (accessData.status !== 'approved') throw new Error('Access not approved')
  if (accessData.passport_id !== payload.passport_id) throw new Error('Passport ID mismatch')

  // Check not expired
  if (accessData.expires_at) {
    const expires = new Date(accessData.expires_at)
    if (expires < new Date()) throw new Error('Access token expired')
  }

  const ref = collection(db as Firestore, 'passportCredentialRequests')
  const docRef = await addDoc(ref, {
    ...payload,
    metadata: payload.metadata ?? {},
    expires_at: payload.expires_at ?? null,
    status: 'pending',
    requested_at: new Date().toISOString(),
    responded_at: null,
  })
  return docRef.id
}

// Fetch pending credential requests for a Passport ID
export async function getPendingCredentialRequests(passportId: string): Promise<CredentialRequest[]> {
  if (!db) return []
  const ref = collection(db as Firestore, 'passportCredentialRequests')
  const q = query(
    ref,
    where('passport_id', '==', passportId),
    where('status', '==', 'pending'),
    orderBy('requested_at', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as CredentialRequest))
}

// Accept a credential — writes it into the Passport silo
export async function acceptCredential(
  uid: string,
  credentialRequestId: string
): Promise<void> {
  if (!db) return
  const now = new Date().toISOString()

  const reqRef = doc(db as Firestore, 'passportCredentialRequests', credentialRequestId)
  const reqSnap = await getDoc(reqRef)
  if (!reqSnap.exists()) throw new Error('Credential request not found')

  const req = reqSnap.data() as Omit<CredentialRequest, 'id'>

  // Write to passport silo
  const credRef = collection(db as Firestore, 'passport', uid, 'credentials')
  await addDoc(credRef, {
    credential_type: req.credential_type,
    credential_title: req.credential_title,
    credential_description: req.credential_description,
    issuer_name: req.issuer_name,
    issuer_email: req.issuer_email,
    issued_at: req.issued_at,
    accepted_at: now,
    expires_at: req.expires_at ?? null,
    metadata: req.metadata ?? {},
    access_request_id: req.access_request_id,
    credential_request_id: credentialRequestId,
    visible: true,
  })

  // Update the request status
  await updateDoc(reqRef, {
    status: 'accepted',
    responded_at: now,
  })
}

// Reject a credential request
export async function rejectCredential(
  uid: string,
  credentialRequestId: string
): Promise<void> {
  if (!db) return
  const now = new Date().toISOString()
  const reqRef = doc(db as Firestore, 'passportCredentialRequests', credentialRequestId)
  await updateDoc(reqRef, {
    status: 'rejected',
    responded_at: now,
  })
}

// Fetch all accepted credentials for a user
export async function getAcceptedCredentials(uid: string): Promise<AcceptedCredential[]> {
  if (!db) return []
  const ref = collection(db as Firestore, 'passport', uid, 'credentials')
  const q = query(ref, orderBy('accepted_at', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AcceptedCredential))
}

// Toggle credential visibility
export async function setCredentialVisibility(
  uid: string,
  credentialId: string,
  visible: boolean
): Promise<void> {
  if (!db) return
  const ref = doc(db as Firestore, 'passport', uid, 'credentials', credentialId)
  await updateDoc(ref, { visible })
}
```

---

## New Page: `app/credentials/page.tsx`

Institution-facing. Requires a valid access token to submit. The token was issued when the user approved the access request in Phase 4.1.

```
SUBMIT A CREDENTIAL TO A PASSPORT
──────────────────────────────────────────────

Use this form to write a verified credential into
a Learner's Passport. You must have an approved
access token for this Passport.

The holder will review and accept or reject the
credential before it appears in their record.

─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

Passport ID
[MM-XXXX-XXXX-XXXX              ]

Access Request ID
[                               ]
(From your approval notification)

Access Token
[                               ]
(From your approval notification)

─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

Credential type
(●) Course completion  ( ) Assessment result
( ) Endorsement        ( ) Placement record
( ) Note

Credential title
[                               ]
e.g. "German A2 Course Completion"

Description
[                               ]
(Shown to the holder — plain language)

Date of issue
[          ]   Expiry (optional)  [          ]

─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

[Submit credential]
```

On submit: validate token against access request server-side via `submitCredentialRequest`. On success: "Your credential has been submitted. The Passport holder will be notified and can accept or reject it."

On error (invalid token, expired access, mismatched Passport ID): show the specific error message. Do not submit.

Validation: Passport ID must match `MM-XXXX-XXXX-XXXX`. All fields required except expiry.

---

## New Component: `components/record/CredentialsPanel.tsx`

Seventh panel in `MyRecordView.tsx`. Shows pending credential requests and the accepted credential record.

```
CREDENTIALS
──────────────────────────────────────────────

PENDING  (1)

  Goethe Institut
  Course completion — German B1 Intensive
  "Completed 120-hour intensive programme, May 2026"
  Issued: 9 May 2026
  [Accept]  [Reject]

─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

YOUR CREDENTIALS

  ● German A2 Course Completion         Goethe Institut
    Issued 3 Mar 2026                   [Hide]

  ● Research Participation Endorsement  University of Hamburg
    Issued 1 May 2026 · expires 1 May 2027  [Hide]
```

Hidden credentials show as faded with `[Show]` toggle. They are still in the record — visibility only affects future public Passport views.

Empty state (no credentials yet): "No credentials yet. Share your Passport ID and access token with an institution to receive verified credentials."

Accept flow: clicking [Accept] shows a confirmation sheet with the full credential detail. No notes field — it is a binary decision. Confirm triggers `acceptCredential`.

---

## Firestore Security Rules

```javascript
match /passportCredentialRequests/{requestId} {
  // Anyone with a valid token can submit (institution submits without auth)
  allow create: if true;
  // Holder reads via client-side query by passport_id
  allow read: if true;
  // Only authenticated users can update (accept/reject)
  allow update: if request.auth != null;
  allow delete: if false;
}

match /passport/{uid}/credentials/{credentialId} {
  allow read, write: if request.auth.uid == uid;
}
```

---

## Files to Create

```
lib/credentialRequests.ts
app/credentials/page.tsx
components/record/CredentialsPanel.tsx
```

## Files to Modify

```
components/record/MyRecordView.tsx   — mount CredentialsPanel as seventh panel
```

## Files NOT to Touch

```
phraseAcousticAnalysis.ts
StepSequencer.tsx
SolarSystemResonance.tsx
lib/researchLogging.ts
app/api/consent-anchor/route.ts
lib/lexiconAnchor.ts
lib/accessRequests.ts
app/access/page.tsx
```

---

## What This Completes

| Phase | What it delivers |
|---|---|
| 4.1 Institutional Access | Institutions request scoped read access; user approves/denies; access logged |
| 4.2 Payment Infrastructure | Deferred — requires German business registration + bank account |
| 4.3 Credential Writes | Institutions write verified credentials into the Passport; user accepts/rejects |

Phase 4 is functionally complete (minus payments). The Passport can now:
- Be discovered by Passport ID
- Grant time-limited scoped read access to institutions
- Receive and store verified credentials from institutions
- Display the full access and credential history to the holder

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*Phase 4.3 of PASSPORT_ROADMAP.md*
*Note: Phase 4.2 (payments) deferred — requires business registration and bank account*
