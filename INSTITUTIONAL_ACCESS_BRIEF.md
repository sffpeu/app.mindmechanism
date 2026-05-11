# Institutional Access — Build Brief
### Phase 4.1 — Cursor Implementation Brief

---

## What This Is

Phase 4 opens the **access economy**: institutions can request scoped, time-limited read access to a learner’s Passport. This milestone implements the **holder-facing flow** and a **server API** for partner systems to submit requests and poll for approval plus grant tokens — aligned with `PASSPORT_ROADMAP.md` §4.1.

---

## Data Model (Firestore)

Under each holder:

- `passport/{uid}/accessRequests/{requestId}` — incoming requests (`pending` → `approved` | `denied`).
- `passport/{uid}/accessGrants/{grantId}` — created on approve; holds `grant_token`, `scopes`, `expires_at`, `request_id`.

Resolver: institution APIs target the holder via **`passport_id`** on `passport/{uid}` (Phase 3.4).

**Allowed scopes** (union chosen per request):

| Scope id | Meaning |
|----------|---------|
| `phrase_progress` | Phrase practice scores & sessions |
| `node_affinity` | Node affinity map |
| `personal_lexicon_meta` | Personal lexicon metadata only (no decrypted narrative) |
| `research_consent_summary` | Research consent summary |

---

## Institution API

**Env:** `INSTITUTION_ACCESS_API_SECRET` — required for production use. Requests include header:

`x-mm-access-api-secret: <secret>`

If unset, POST/GET return **503**.

### `POST /api/institutional-access-request`

Creates a pending request for the holder resolved by `passportId`.

JSON body:

```json
{
  "passportId": "MM-XXXX-XXXX-XXXX-XXXX",
  "institutionName": "…",
  "institutionContactEmail": "…",
  "purpose": "…",
  "scopes": ["phrase_progress", "node_affinity"],
  "durationDays": 90
}
```

Response: `{ ok: true, requestId, passportId }`.

### `GET /api/institutional-access-request?requestId=…&passportId=…`

Polls status. When `approved`, returns `{ status: "approved", grant: { token, expires_at, scopes } }`.

---

## Holder UI

**`components/record/InstitutionalAccessPanel.tsx`** on My Record: lists pending requests with **Approve** / **Deny**, past decisions, and approved grants (token suffix only — full token retrieved via institution API).

---

## Client Library

- `lib/institutionalAccess.ts` — list requests/grants; approve / deny (writes grants + anchors).
- `lib/institutionalAccessAnchor.ts` — best-effort `SHA-256` commitment posted to `/api/consent-anchor` after each decision.

---

## Types

`types/InstitutionalAccess.ts` — shared enums and document shapes.

---

## Files

| Path | Role |
|------|------|
| `app/api/institutional-access-request/route.ts` | Institution POST + GET |
| `lib/institutionalAccess.ts` | Holder Firestore actions |
| `lib/institutionalAccessAnchor.ts` | Optional Polygon anchor |
| `components/record/InstitutionalAccessPanel.tsx` | My Record panel |
| `components/record/MyRecordView.tsx` | Embeds panel |
| `types/InstitutionalAccess.ts` | Types + scope list |

---

## Security Notes

- Institution routes are protected by shared secret; holders use normal Firebase Auth + Firestore rules under `passport/{uid}/**`.
- Grant tokens are sensitive; the holder UI shows only a short suffix.

---

*Phase 4.1 of PASSPORT_ROADMAP.md — companion: LEARNERS_PASSPORT_CONCEPT.md*
