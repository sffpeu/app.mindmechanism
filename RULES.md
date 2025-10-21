### Mind Mechanism – Project Rules (Production)

These rules keep the project consistent, secure, and easy to work on after breaks. They are opinionated to match the current codebase.

- Tech stack
  - Next.js 14 App Router, React 18, TypeScript strict mode
  - Firebase (client SDK) for Auth and Firestore; Google Maps JS API
  - Tailwind CSS + shadcn/ui for UI primitives
  - Deployed on Vercel

- Directory conventions
  - `app/`: routes and React Server Components by default. Use `"use client"` only when interactivity is required.
  - `components/`: shared UI and app components. `components/ui` houses shadcn primitives only.
  - `lib/`: data-access modules (Firestore), contexts, hooks, and utilities. Never call Firestore directly from components; add functions to `lib/*`.
  - `types/`: TypeScript types and interfaces.
  - `scripts/`: one-off scripts and operational tasks (e.g., data imports).

- Coding standards
  - TypeScript: no `any` in exported APIs; prefer explicit function return types; keep strict mode on.
  - Naming: functions as verbs, variables as meaningful nouns; prefer full words over abbreviations.
  - React: server components by default; colocate client components when needed and mark with `"use client"`.
  - Styling: Tailwind first; compose utilities with `clsx` and `tailwind-merge`; avoid inline styles.
  - State: prefer React state/context; use Zustand only for non-persistent UI state. Keep data persistence in Firestore via `lib/*`.
  - Errors: throw typed errors from `lib/*`; surface user-friendly messages in components; avoid swallowing errors.
  - Logging: allow `console.*` in development; gate or remove in production. Do not log secrets or tokens.

- API rules (Next.js `app/api/*`)
  - Always validate inputs and return JSON with `{ success, data|error }` shape and proper HTTP status codes.
  - Perform server-side authorization for any user-specific data. Do not trust client-only checks.
  - Add basic rate-limiting or abuse protections for public endpoints.

- Auth and session rules
  - Auth uses Firebase client; middleware reads `__firebase_auth_token` cookie to gate protected pages.
  - Cookie must be set `secure` in production and `SameSite=lax` or stricter.
  - If server endpoints need user identity, verify the Firebase ID token server-side before performing user-scoped actions.

- Firestore data access rules
  - All reads/writes go through `lib/glossary.ts`, `lib/notes.ts`, `lib/sessions.ts`. Do not access Firestore from components.
  - Validate inputs at module boundaries; keep retries bounded (as already implemented).
  - Prefer indexed queries; keep composite indexes in `firestore.indexes.json` in source control.

- Firestore security (actionable guidance)
  - Sessions: restrict read access to owner. Recommended rule for `/sessions/{sessionId}`:

    ```
    match /sessions/{sessionId} {
      allow read, update, delete: if isAuthenticated() && request.auth.uid == resource.data.user_id;
      allow create: if isAuthenticated();
    }
    ```

  - Notes: ensure reads are limited to the owner for `users/{userId}/notes/{noteId}`.
  - Glossary: user-created words may be modified only by their creator; system words are read-only for users.
  - Deploy rules via: `firebase deploy --only firestore:rules`.

- Secrets and environment
  - Never commit credentials. Service account JSON files must not live in the repo. Use secret storage and `GOOGLE_APPLICATION_CREDENTIALS` for local scripts.
  - Public client env vars must be prefixed with `NEXT_PUBLIC_`.
  - Required env vars are listed in `.env.example`.

- UI/UX rules
  - Use shadcn components for base primitives; extend in `components` with composition, not mutation of primitives.
  - Accessibility: provide alt text, labels, and proper roles; prefer semantic HTML.
  - Dark mode support via `ThemeProvider` is mandatory across new pages.

- Performance rules
  - Avoid large client bundles in routes; move heavy logic to server.
  - Use image domains configured in `next.config.js` only; do not hotlink unapproved hosts.
  - Prefer incremental data loading and pagination for lists (e.g., sessions, glossary).

- Git workflow
  - Branches: `feat/*`, `fix/*`, `chore/*`, `docs/*`.
  - Commits: Conventional Commits (e.g., `feat(clock): add pause/resume`).
  - PRs: small, focused, with description, screenshots for UI, and testing notes.

- CI/CD and quality gates
  - Required before merge: `npm run build`, `npm run lint` pass locally.
  - Keep `next.config` single-sourced; prefer `next.config.js` (current) or migrate entirely to `next.config.ts`, not both.

- Operational scripts
  - `scripts/import-glossary.*`: requires Firebase Admin credentials via `GOOGLE_APPLICATION_CREDENTIALS`. Do not hardcode or commit JSON files.
  - Put one-off migrations in `scripts/` with clear README and dry-run options where possible.

- Release discipline
  - Deploy via Vercel with environment variables configured for Production and Preview.
  - After changing Firestore rules or indexes, deploy them and validate in a staging project before production.

- Breaking changes policy
  - If a change breaks data shape or security assumptions, include a migration plan, a rollout checklist, and a reversible switch.