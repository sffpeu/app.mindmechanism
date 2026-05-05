# Claude Code Handoff (May 5, 2026)

## High-level intent

- Keep core music direction focused on:
  - Spotify integration for external streaming
  - First-party/commissioned MM audio assets
- Mothball Apple Music integration for now (do not delete, but keep inactive and non-user-facing).
- Make MM drone recordings usable as the primary tone source across:
  - single clock pages
  - timed sessions on `/0`-`/8`
  - `pair` page
  - `trio` page

## What was changed

### 1) MM drone tone system (active)

- Added imported drone assets in `public/mm_tones/drone_0.m4a` ... `drone_8.m4a`.
- Added `lib/mmDroneTones.ts` mapping helpers/labels.
- Extended settings store in `lib/hooks/useSettings.ts`:
  - `toneMode: 'synthetic' | 'drone'` (default `'drone'`)
  - `droneClockGain: number[]` (per-wheel gain)
- Updated `components/settings/SoundSettings.tsx`:
  - Tone source selector (Planet drones vs Synthetic sine)
  - Per-wheel preview and gain sliders for drone mode
  - Copy reflects use on session/pair/trio flows

### 2) Tone playback parity across all relevant pages (active)

- Single clock hook: `lib/hooks/useClockBreathingTone.ts`
- Pair hook: `lib/hooks/usePairedBreathingTone.ts`
- Trio hook: `lib/hooks/useTripleBreathingTone.ts`

All three now support:
- `toneMode` (drone vs synthetic)
- `toneVolume`
- per-node mute
- per-wheel drone gain (drone mode)
- same breathing envelope behavior

Shared helpers introduced:
- `lib/breathingToneEnvelope.ts`
- `lib/droneSample.ts`

Hydration guard introduced:
- `lib/hooks/useSettingsHydrated.ts`
- Audio hooks defer startup until persisted settings are hydrated to avoid first-paint synthetic fallback.

### 3) Streaming music direction update (active)

- Spotify session playback remains active in `lib/hooks/useSessionStreamingMusic.ts`.
- Apple playback path removed from active session flow.

### 4) Apple Music mothballed (inactive, preserved)

- `components/settings/SoundSettings.tsx` no longer exposes Apple connect/options.
- Apple provider option removed from active preferences UI.
- Legacy provider value handling is normalized in UI flow.
- Apple code/files intentionally left in repo for future reactivation:
  - `lib/appleMusicKit.ts`
  - `lib/appleMusicSession.ts`
  - `app/api/apple-music/token/route.ts`
- `.env.local.example` marks Apple credentials as mothballed.

## Current practical behavior

- If user selects Planet drones in Sound settings, they get `.m4a` drone playback in single clock + timed session + pair + trio breathing tone paths.
- Spotify streaming is the only active third-party streaming integration in UI/session flow.
- SoundCloud is planned next but not implemented yet.

## Reasoning notes

- Apple was paused due to operational/maintenance complexity and risk of recurring breakage.
- Drone-first path improves control over IP/copyright by emphasizing first-party/commissioned catalog.
- Hydration guard avoids unstable startup behavior where default settings could briefly override persisted user preference.

## Suggested next steps (if picking this up)

1. Add SoundCloud integration behind the same settings model used for Spotify session playback.
2. Add an explicit "inactive/mothballed integration" flag in settings state to avoid stale persisted Apple fields over time.
3. Optionally add a short migration in `useSettings` to remove now-unused Apple-specific persisted fields once deprecation is confirmed.
4. Add lightweight QA checklist docs for:
   - first-load hydration behavior
   - pair/trio drone mixing levels
   - mobile autoplay/user-gesture constraints
