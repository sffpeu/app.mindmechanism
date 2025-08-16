### Contributing

- Local setup
  - Node 20.x recommended
  - Install: `npm ci` (or `npm install`)
  - Copy `.env.example` to `.env.local` and fill in values
  - Run: `npm run dev`

- Branching
  - Create feature branches from `main`: `feat/*`, `fix/*`, `chore/*`, `docs/*`
  - Keep branches small and focused; prefer incremental PRs

- Commit style (Conventional Commits)
  - `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`
  - Scope optional, e.g., `feat(glossary): add search endpoint`

- PR checklist
  - Description of change and motivation
  - Screenshots/gifs for UI changes
  - Notes on testing and any migrations/scripts
  - `npm run build` and `npm run lint` pass

- Code expectations
  - Server components by default; client components only when needed
  - All Firestore access via `lib/*`; no Firestore calls directly in components
  - Strong typing at module boundaries; no `any` in exported APIs
  - Tailwind for styling; shadcn primitives in `components/ui`
  - Do not log sensitive data; keep logs minimal in production

- Tests (lightweight until expanded)
  - Prefer unit tests for data-layer functions in `lib/*`
  - For UI, smoke-test critical flows manually and document in PR notes

- Releasing
  - Production deploys via Vercel on `main`
  - Coordinate Firestore rules/index changes; deploy with `firebase deploy --only firestore`