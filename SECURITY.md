### Security Policy

- Secrets management (critical)
  - Do not commit credentials. Service account JSONs must never be in the repo.
  - Immediate action: rotate the Firebase service account key that was committed under `utils/*.json` and remove the file from history.
  - Store secrets in Vercel Project Environment Variables. Locally, use `.env.local` and `GOOGLE_APPLICATION_CREDENTIALS` pointing to a file outside the repo.

- Firebase Admin for scripts
  - Prefer Application Default Credentials (ADC): set `GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json` when running scripts.
  - Avoid inlining private keys; if unavoidable, escape newlines and store as an environment variable in CI only.

- Tokens and cookies
  - `__firebase_auth_token` cookie must be `secure` in production and `SameSite=lax` or stricter.
  - Validate Firebase ID tokens on server when endpoints need user identity; do not rely only on client state.

- Firestore security rules (hygiene)
  - Limit session reads to owner; ensure `users/{userId}/notes` reads are user-only.
  - Default deny; allow-list only the minimum reads/writes per collection.
  - Keep `firestore.rules` and `firestore.indexes.json` in source control; deploy via CI.

- Dependency and supply chain
  - Keep Next.js, Firebase SDKs, and ESLint up to date. Avoid abandoning pinned versions.
  - Run `npm audit` periodically; fix high and critical severities.

- Incident response
  - If credentials leak: revoke/rotate keys, invalidate tokens, redeploy, and audit access logs.