# Mind Mechanism — Codebase Manual

**Audience:** engineers onboarding to this repository.  
**Scope:** Every module under `lib/`, every component under `components/`, and every App Router handler under `app/api/`.  
**Generated:** 2026-05-11 (documentation only; no application code was modified for this file).

---

## Part 1 — Architecture overview

### What Mind Mechanism is

Mind Mechanism is a TypeScript web application for structured inner practice: a nine-clock mandala (“wheel”), a personal glossary / lexicon (with optional passport encryption), a mantra **sequencer**, collaborative **lobby** sessions and timers, optional **research** participation, and an institutional **Passport** layer so users can approve scoped reads of their data. One codebase serves multiple **portals** (consumer, academic, corporate) driven mainly by config (`lib/portalConfig.ts`) and URL detection (`lib/detectPortal.ts`).

### How the codebase is organised

| Area | Role |
|------|------|
| `app/` | Next.js App Router: pages, layouts, `app/AuthContext.tsx`, and `app/api/*/route.ts` HTTP handlers. |
| `components/` | React UI: mandala, glossary, sequencer, settings, record (“My Record”), landing, legal, and shadcn-based primitives under `components/ui/`. |
| `lib/` | Shared logic: Firebase, glossary CRUD, passport crypto, audio/Hue/Spotify/MusicKit, sessions, lobby, research logging, hooks. |
| `contexts/` | Cross-cutting React context — e.g. **`PortalProvider`** resolves portal from pathname and `academic.*` / `corporate.*` hostnames (`contexts/PortalContext.tsx`). |
| `types/` | Shared TypeScript types (imported as `@/types/...`). |

### Passport silo concept

Firestore stores many user-facing documents under familiar collections (`users`, `glossary`, …). The **Passport** silo groups holder-specific institutional flows under **`passport/{firebaseUid}/...`**: for example `accessRequests`, `accessGrants`, `accessLog`, phrases, and credential-related data. That separation keeps institutional approval tokens, audit logs, and scoped exports easier to reason about than mixing them into general profile docs. **Personal lexicon ciphertext** still lives where glossary rows live; the passport layer governs *who may read* aggregated or exported views.

### Portal system

**Consumer**, **Academic**, and **Corporate** portals share one app; behavior differs by tier limits (`lib/nodeTiers.ts`, `lib/portalAccess.ts`), visible chrome, and marketing routes under `components/landing/`. The active portal is derived from the URL/path and/or portal context.

### Stack and layout

- **Framework:** Next.js App Router (`app/`). Client islands use `'use client'` where needed; API routes live under `app/api/*/route.ts`.
- **Auth:** Firebase Authentication on the client (`lib/firebase.ts`). Server routes that need identity call `verifyFirebaseRequestUid` (`lib/verifyFirebaseRequestUid.ts`) to validate the caller’s Firebase ID token from the request.
- **Data:** Cloud Firestore via the client SDK in browser code; **Firebase Admin** (`lib/firebaseAdmin.ts`) on the server when bypassing client rules or performing privileged writes. Configure `FIREBASE_SERVICE_ACCOUNT_JSON` or `FIREBASE_SERVICE_ACCOUNT_BASE64` for production Admin features.
- **Encryption / Passport:** User-held passphrase-derived keys for personal lexicon fields (`lib/passportCrypto.ts`, UI helpers in `lib/passportCipherUi.ts`). Institutional and audit flows tie into Firestore `passport/*` collections and optional anchoring (blockchain consent anchoring uses `OPERATOR_PRIVATE_KEY` / `POLYGON_RPC_URL` — see `app/api/consent-anchor`).
- **Music / Hue:** Apple Music via MusicKit (`lib/appleMusicKit.ts`) and a server JWT route (`app/api/apple-music/token`). Spotify OAuth and playback helpers (`lib/spotify.ts`, `lib/spotifyPlayback.ts`). Philips Hue LAN proxy routes (`app/api/hue/*`) call the bridge from the server; **cloud deployments cannot reach a home bridge** — LAN Hue is for dev/self-hosted; production Hue sync expectations are documented in those routes.
- **Research / privacy:** Research consent, hashed UIDs, and contribution logging (`lib/researchLogging.ts`, `lib/researchProtocol.ts`). Category B/C fields and glossary exports are sensitive — server APIs that return user-linked data enforce scopes or redaction (e.g. `app/api/words` strips personal narrative unless `includeNarrative=1`).
- **Third-party APIs (server):** OpenAI Whisper for phrase transcription (`app/api/phrase-transcribe`), Google Places via proxy (`app/api/support-places`), RSS blog sync (`app/api/blog-sync`), Polygon transactions for consent anchoring (`app/api/consent-anchor`).

### Auth context wiring

- **`app/AuthContext`:** Primary React auth context consumed across the app (not duplicated in this manual’s `lib/` section, but **`lib/TimeTrackingContext.tsx` imports `useAuth` from `@/app/AuthContext`**).
- **`lib/AuthContext.tsx` / `lib/FirebaseAuthContext.tsx`:** Alternative Firebase-oriented providers still present in `lib/`; confirm which provider wraps the tree in `app/layout.tsx` when debugging duplicate-provider issues.

### Modules referenced in the brief but not present as standalone files

See explicit stubs below in Part 2.

---

## Part 2 — Library functions (`lib/`)

Documentation uses this template for exports (constants and types are grouped in prose where listing every symbol would be noisy):

- **Phase:** Feature phases are **not recorded in source**; this manual uses *Unknown* unless a comment in code states otherwise.
- **Purpose:** What it does in plain language.
- **Parameters / returns:** Described in the file table or under the function where non-obvious.
- **Side effects:** Firestore, IndexedDB, `fetch`, Web Crypto, AudioContext, third-party APIs, or on-chain calls — noted explicitly when central to the API.
- **Called by:** Not exhaustively traced; use your editor’s “find references” on the symbol.

### Brief-listed stubs (missing or consolidated files)

### `lib/urbanPatwa.ts`

*Not yet built — see [URBAN_PATWA_BRIEF.md](./URBAN_PATWA_BRIEF.md).*

### `lib/accessRequests.ts`

*No standalone module — institutional **access requests** are persisted under Firestore `passport/{uid}/accessRequests` and handled in application code via **`lib/institutionalAccess.ts`** and HTTP APIs **`app/api/institutional-access-request`**, **`app/api/passport-read`**, and **`app/api/credential-requests`**.**

---

### Inventory tables

Exports are summarized by file. Types are mentioned where they clarify behavior.

### Root-level modules

| File | Purpose / exports |
|------|-------------------|
| `AuthContext.tsx` | `AuthProvider`, `useAuth` — Firebase-oriented auth context (see wiring note above). |
| `FirebaseAuthContext.tsx` | `UserProfile`, `ResearchConsent`, `AuthContextType`, `AuthProvider`, `useAuth` — richer profile/consent typing than minimal auth. |
| `NotesContext.tsx` | `NotesProvider`, `useNotes` — React context for notes UI state. |
| `TimeTrackingContext.tsx` | `TimeTrackingProvider`, `useTimeTracking` — per-page time aggregates; uses `@/app/AuthContext` and Firestore. |
| `appleMusicKit.ts` | `initMusicKit`, `getMusicKit`, `authorizeAppleMusic`, `unauthorizeAppleMusic`, `appleMusicIsAuthorized` — browser MusicKit bootstrap. |
| `appleMusicSession.ts` | `normalizeAppleMusicPlaylistId`, `fetchAppleLibraryPlaylistIds` — playlist ID hygiene and library reads. |
| `authEmailVerification.ts` | `usesPasswordProvider`, `requiresEmailVerification`, `getVerifyEmailContinueUrl` — Firebase email verification gating. |
| `breathingToneEnvelope.ts` | `FREQ_FADE_IN_S`, `SOUND_CHECK_MS`, `LEVEL_RAMP_MS`, `START_LEVEL`, `SOUND_CHECK_END_LEVEL`, `masterLevelMult` — ambient/breathing gain envelope for clock audio. |
| `clockSettings.ts` | `clockSettings` — clock metadata array for UI. |
| `clockTitles.ts` | `clockTitles`, `ClockTitleKey` — canonical clock title strings. |
| `clockToneHz.ts` | `CLOCK_TONE_HZ`, `CLOCK_BREATH_PERIOD_MS`, `audibleHzFromClockTone`, `breathIntensity01` — frequency and breath-phase helpers. |
| `consentAnchor.ts` | `computeConsentHash`, `anchorConsentEvent` — client-side consent hashing and anchoring orchestration. |
| `credentialRequests.ts` | `CredentialType`, `CredentialStatus`, `CredentialRequest`, `AcceptedCredential`, `submitCredentialRequest`, `getPendingCredentialRequests`, `acceptCredential`, `rejectCredential`, `getAcceptedCredentials`, `setCredentialVisibility` — Firestore-backed credential exchange tied to passport flows. |
| `cropBannerImage.ts` | `BANNER_OUTPUT_WIDTH`, `BANNER_OUTPUT_HEIGHT`, `BannerFocalPoint`, `computeBannerCropRect`, `processBannerImageForUpload` — canvas-based banner crop for profile uploads. |
| `dataExport.ts` | `PersonalLexiconEntry`, `PhraseProgressExport`, `NodeAffinityLogEntry`, `ResearchConsentExport`, `UserDataExport`, `exportUserData` — GDPR-style bundled export shape and builder. |
| `deckSessionTone.ts` | `playDeckSessionSaveTone`, `playDeckSessionLoadTone` — short UI sounds for deck persistence. |
| `defaultWordsByClock.ts` | `DEFAULT_WORDS_BY_CLOCK` — seed words per clock id. |
| `detectPortal.ts` | `detectPortalFromPathname` — maps URL path to consumer/academic/corporate portal. |
| `droneSample.ts` | `decodeDroneSample` — decode ambient drone audio for analysis/playback. |
| `firebase.ts` | `waitForFirebaseAuth`, `getFirebaseStorage`, `app`, `auth`, `db`, default export `app` — client Firebase singletons. |
| `firebaseAdmin.ts` | `getFirebaseAdminApp`, `getAdminFirestore` — Node-only Admin app and Firestore. |
| `firebaseEmailLink.ts` | `FIREBASE_EMAIL_LINK_STORAGE_KEY`, `getEmailLinkFinishPath`, `getEmailLinkActionUrl`, `sanitizeEmailLinkCallback` — email link sign-in URL helpers. |
| `glossary.ts` | Large surface: IPA fetch, definitions, chakra default word lists, `decryptPersonalWord`, CRUD + search for `GlossaryWord`, tier-aware operations — primary glossary Firestore API for the app. |
| `hueBridge.ts` | `looksLikeJson`, `bridgeRequest`, `parseBridgeJson` — HTTPS/HTTP Hue bridge HTTP client with permissive TLS for local bridges. |
| `hueColors.ts` | `CLOCK_HEX` (alias `WHEEL_HEX`), `HueLightState`, `hexToHueLightState`, `clockIndexToHueState` — map UI clock indices to Hue XY/on/bri. |
| `hueLanReachability.ts` | `isPrivateLanHost`, `isDeployedServerless`, `HUE_CLOUD_LAN_MESSAGE`, `lanHueBlockedReason`, `isHueLanUiAllowedHostname` — block impossible LAN Hue calls from cloud hosts with clear errors. |
| `immersiveIdleController.ts` | `subscribeImmersiveIdle`, `getImmersiveIdleSnapshot`, `attachImmersiveIdleController`, `detachImmersiveIdleController`, `immersiveIdleOnSuppressChange` — idle detection for immersive mandala UX. |
| `institutionalAccess.ts` | `isValidScope`, `listAccessRequests`, `approveAccessRequest`, `listAccessGrants`, `listAccessHistory`, `denyAccessRequest` — holder-side institutional access management. |
| `institutionalAccessAnchor.ts` | `anchorInstitutionalAccessDecision` — optional anchoring for approve/deny audit trail. |
| `layoutGutters.ts` | `VIEWPORT_INSET_*` CSS calc constants — consistent safe-area gutters for nav/dock. |
| `lexiconAnchor.ts` | `LexiconAnchorRecord`, `computeLexiconMerkleRoot`, `anchorLexicon`, `getLexiconAnchorHistory`, `verifyLexiconAnchor`, `maybeAutoAnchor` — Merkle-style lexicon anchoring helpers. |
| `lobbyFlowerLayout.ts` | `lobbyFlowerOffsets` — polar offsets for lobby “flower” avatar layout. |
| `lobbyGroups.ts` | `LOBBY_GROUP_MAX`, friends caps/TTL, `LobbyGroup`, `normalizeFriendsCode`, `generateFriendsCode`, CRUD/join helpers, `handleLobbyGroupError`, `handleLobbyGroupErrorWithHints` — Firestore lobby groups (client-oriented); server duplicates some validation in `app/api/lobby/groups`. |
| `lobbyPresence.ts` | `PresenceDoc`, `COMPANION_DELAY_MS`, `setPresence`, `clearPresence`, `joinPresence`, `subscribePresence` — realtime presence for lobby companions. |
| `lobbySchedule.ts` | Gathering limits, types, `newGatheringId`, normalization, sorting, ICS export, Google Calendar URLs, validation — scheduled gatherings for lobby groups. |
| `lobbySessionConfig.ts` | `LOBBY_SESSION_DURATION_CHOICES`, session config types, `normalizeFocusNodeIndices`, `validateLobbySessionConfig`, `finalizeLobbySessionIndices`, `parseLobbySessionPlan`, `storedSessionMatchesInput` — lobby session focus configuration. |
| `mandalaIdleSuppress.ts` | `subscribeMandalaIdleSuppress`, `getMandalaIdleSuppress`, `setMandalaIdleSuppress` — global store for suppressing idle mandala behavior. |
| `mmDroneTones.ts` | `MM_DRONE_PATH`, `MM_DRONE_PLANET_LABELS` — paths/labels for Mind Mechanism drone samples. |
| `nodeAffinity.ts` | `NodeAffinitySession`, `NodeAffinityProfile`, `logNodeAffinitySession`, `computeNodeAffinityProfile` — affinity analytics and profiles. |
| `nodeTiers.ts` | `WHEEL_MAX_CLOCK_ID`, `NodeTier`, `TAQPW_NODE_NAMES`, wheel/TQPW checks, `isNodeAccessible`, `filterNodesByTier`, `resolveNodeTier`, glossary tier helpers — subscription vs portal tier resolution for nodes and words. |
| `notes.ts` | `WeatherSnapshot`, `Note`, `createNote`, `getUserNotes`, `subscribeToUserNotes`, `updateNote`, `deleteNote`, `checkOnlineStatus` — user notes with optional weather snapshot. |
| `passportCipherUi.ts` | `isUndecipherablePersonalCipher`, `ENCRYPTED_FIELD_PLACEHOLDER`, `PASSPORT_BACKUP_REMINDER_KEY`, `displayPersonalLexiconField` — safe display of encrypted passport fields. |
| `passportCrypto.ts` | WebCrypto helpers: `loadKey`, `hasPassportKey`, `generatePassportKey`, `getOrCreatePassportKey`, `exportKeyAsBase64`, `importKeyFromBase64`, `encryptField`, `decryptField`, `downloadKeyBackup`, `getKeyFingerprint`. |
| `passportIdentity.ts` | `getOrCreatePassportId` — stable MM passport id string for a Firebase uid. |
| `passportKeyRotation.ts` | `rotatePassportKey` — re-encrypt silo after rotation. |
| `passportSilo.ts` | `syncPassportKeyMeta`, `bumpPassportLexiconCount` — Firestore metadata for passport crypto + lexicon counts. |
| `personalLexiconStats.ts` | `fetchPersonalLexiconWheelCounts` — aggregates per-wheel personal word counts. |
| `phraseAcousticAnalysis.ts` | Pipeline version, transcript/alignment/acoustic types, `decodeBlobToMono`, `analyzePhraseBlob`, `exportPhraseReadoutJson` — offline acoustic analysis for phrase practice. |
| `phraseProgress.ts` | `phraseHash`, `PhraseSummary`, `PhraseSession`, `getUserPhraseSummaries`, `getPhraseSummaryDoc`, `getPhraseSessionHistory` — phrase drill progress in Firestore. |
| `phraseTranscribeClient.ts` | `PhraseTranscribeResult`, `transcribePhraseBlob` — client wrapper targeting server transcription API. |
| `portalAccess.ts` | `MembershipTier`, `STUDENT_ACADEMIC_TIERS`, `hasStudentAcademicPortal`, `tierDisplayName` — membership tier helpers for portals. |
| `portalConfig.ts` | `Portal`, `PortalConfig`, `PORTAL_CONFIGS`, `getPortalConfig` — static portal branding/feature flags. |
| `research.ts` | `ResearchPaper`, `BlogCrosslink`, `hasResearchAccess`, `getResearchPapers`, `getBlogCrosslinks`, `ResearchStatusPublic`, `getPublicResearchStatus` — Firestore reads for research hub. |
| `researchLogging.ts` | `hashUid`, `updateConsentAnchor`, contribution summary types, `logWheelAssignment`, `logSequencerSession`, `excludeUserResearchData` — pseudonymous research telemetry and opt-out. |
| `researchProtocol.ts` | `RESEARCH_PROTOCOL_VERSION`, `CATEGORY_B_FIELDS`, `CATEGORY_C_FIELDS` — consent field constants. |
| `satelliteDefaults.ts` | `defaultSatelliteConfigs`, `clockSatellites`, `getDefaultSatellitesForClock` — default satellite animation configs per clock. |
| `satelliteRotation.ts` | `formatSatelliteRevolutionPeriod` — human-readable orbital period string. |
| `sequencer.ts` | `NodeIndex`, `DurationMultiplier`, `StepCount`, `Step`, `SyllableMapping`, `Sequence`, `NodeMeta`, `NODE_META`, `DEFAULT_BPM`, `DEFAULT_STEP_COUNT`, `makeEmptyStep`, `makeDefaultSequence`, `parseMantraSyllables`, `distributeSyllables` — domain model for the mantra sequencer. |
| `sequencer-lane-processors.ts` | `LaneProcessor`, `buildLaneProcessor` — Web Audio lane processors per wheel node. |
| `sequencer-lane-processors 2.ts` | Same export surface as `sequencer-lane-processors.ts` — **duplicate filename** (likely accidental copy); verify imports before deleting. |
| `sessionLobbyMeta.ts` | `getSessionLobbySnapshot` — lobby-related metadata for active session presentation. |
| `sessions.ts` | `SessionData`, `Session`, `createSession`, `updateSession`, `getUserSessions`, `getPublicSessions`, `getSession`, `joinSession`, `getUserStats`, `deleteSession`, `updateSessionActivity`, `updateSessionProgress`, `pauseSession` — collaborative session documents and stats. |
| `sessionWordRingFill.ts` | `wordProgressAlongProgressRing` — geometry/progress mapping for session UI ring. |
| `sounds.ts` | `WHEEL_AMBIENT_PATHS`, `SOUNDSCAPE_PATHS`, `GRAND_CLOCK_PATH`, `useSoundEffects` — central sound asset map + hook for UI clicks/ambient. |
| `spotify.ts` | `SPOTIFY_SCOPES`, `SpotifyTokens`, OAuth helpers `startSpotifyAuth`, `exchangeSpotifyCode`, `refreshSpotifyToken`, `spotifyTokensValid`, `getSpotifyAccessToken`. |
| `spotifyPlayback.ts` | `spotifyFetch`, playback control helpers, playlist fetch + `normalizeSpotifyPlaylistUri`. |
| `syncFirebaseAuthCookie.ts` | `syncFirebaseAuthCookie` — session cookie sync for SSR/auth middleware patterns. |
| `testWords.ts` | `testWords` — static list for QA. |
| `timeTracking.ts` | `startTimeTracking`, `endTimeTracking`, `calculateUserTimeStats`, `getTimeStats`, `subscribeToTimeTracking`, `cleanupOrphanedTimeEntries` — Firestore time tracking entries (distinct from `TimeTrackingContext` aggregation). |
| `useEffectiveNodeTier.ts` | `useEffectiveNodeTier` — resolves effective `NodeTier` for UI gating. |
| `useSessionTimer.ts` | `useSessionTimer(duration, sessionId, onSessionComplete?)` — countdown, pause, streaming music integration, progress sync via `updateSessionProgress`. |
| `utils.ts` | `cn` — Tailwind class merge helper (`clsx` + `tailwind-merge`). |
| `verifyFirebaseRequestUid.ts` | `verifyFirebaseRequestUid(request)` — returns Firebase uid or null from `Authorization: Bearer <idToken>`. |
| `voiceNoteStorage.ts` | `VoiceNoteTarget`, `VoiceNote`, `saveVoiceNote`, `getVoiceNotesForTarget`, `deleteVoiceNote`, `getVoiceNoteAudioUrl` — IndexedDB storage for local voice notes (glossary/deck targets). |
| `wheelColors.ts` | `WHEEL_HEX`, `WheelHex`, `clockIdToHex`, `wheelNumberToHex` — nine-clock palette mapping. |
| `wheelFaceOverlays.ts` | `WheelFaceMediaType`, `WheelFaceMedia`, `WHEEL_FACE_COUNT`, `emptyWheelFaceOverlays`, `normalizeWheelFaceOverlays` — per-face image/video overlay model for settings UI. |
| `userCompositionsStorage.ts` | `UserComposition`, `MAX_COMPOSITIONS`, `MAX_COMPOSITION_BYTES`, `loadCompositions`, `compositionDataUrl`, `addCompositionFromBlob`, `deleteComposition` — local persisted user compositions (blob-backed). |

### `lib/hooks/`

| File | Exports |
|------|---------|
| `useClockBreathingTone.ts` | `useClockBreathingTone(clockIndex, muted)` |
| `useClockEntrance.ts` | `useClockEntrance` — entrance animation phase tuple + advance |
| `useClockRotation.ts` | `useClockRotation(clockId)` |
| `useFullscreen.ts` | `isFullscreenSupported`, `useFullscreen` |
| `useHueSync.ts` | `useHueSync(clockIndex)` |
| `useIdleFade.ts` | `UseIdleFadeOptions`, `useIdleFade` |
| `useLocation.ts` | `useLocation` |
| `useNineWheelTones.ts` | `useNineWheelTones(muted)` |
| `usePairedBreathingTone.ts` | `usePairedBreathingTone` |
| `useSequencer.ts` | `useSequencer(userId)` |
| `useSequencerAudio.ts` | `useSequencerAudio(sequence)` |
| `useSequencerStorage.ts` | `useSequencerStorage` |
| `useSessionStreamingMusic.ts` | `SessionStreamingMusicArgs`, `useSessionStreamingMusic` |
| `useSettings.ts` | `useSettings` — Zustand store for UI settings |
| `useSettingsHydrated.ts` | `useSettingsHydrated` |
| `useSpotifyPlayer.ts` | `SpotifyPlaybackState`, `useSpotifyPlayer` |
| `useTimeTracking.ts` | `useTimeTracking(userId, page)` — page visit timing hook |
| `useTripleBreathingTone.ts` | `useTripleBreathingTone` |
| `useWheelAmbient.ts` | `useWheelAmbient` |

---

## Part 3 — Components (`components/`)

Convention for each entry:

- **Portal:** **All** unless the component is only reachable from a single portal route (most components are shared).
- **Phase:** *Unknown — not tracked in repository metadata.*
- **Purpose / Props / Data sources / Writes:** Captured in the table where helpful; many primitives only wrap Radix/shadcn **props** (`className`, `children`, etc.).

The brief referenced **`components/academic/`** (e.g. UrbanPatwaMatrix). That folder **does not exist yet** — align future work with `URBAN_PATWA_BRIEF.md`.

Convention: **Purpose** describes user-visible or architectural behavior. **Props** lists notable props when non-obvious; many leaf components rely on children or standard Radix/shadcn patterns.

### Root (`components/`)

| Component file | Purpose | Notes |
|----------------|---------|-------|
| `AccessibilityProvider.tsx` | Wraps subtree with accessibility context/settings. | |
| `AddWordDialog.tsx` | Dialog to add glossary words. | |
| `AppDock.tsx` | Bottom/side dock with primary navigation affordances. | |
| `AppInfoOverlay.tsx` | Overlay with app info / quick links. | |
| `Clock.tsx` | Core analog/digital clock visualization for a mandala/wheel node. | Large compositor. |
| `ClockBreathingGlow.tsx` | Ambient glow synced to breathing phase. | |
| `ClockBreathingTone.tsx` | Audio layer hook-up for breathing tones on a clock. | |
| `ClockFocusNodeAppear.tsx` | Entrance animation when focus nodes activate. | |
| `ClockPageSatelliteLayer.tsx` | Satellite orbit layer for clock page. | |
| `ClockPageSettingsTrigger.tsx` | Opens clock-specific settings entry point. | |
| `ClockPreview.tsx` | Compact preview of clock appearance. | |
| `ClockSettings.tsx` | Inline clock configuration UI. | |
| `ClockVideoOverlay.tsx` | Video overlay on clock face when configured. | |
| `ClockWheelFaceOverlay.tsx` | User media overlays per wheel face. | |
| `CurvedCircleWordLabel.tsx` | Curved text label along circular paths. | |
| `DashboardRecentSessions.tsx` | Dashboard strip of recent sessions. | |
| `DotNavigation.tsx` | Dot pager / section navigation. | |
| `DraggableClockPanel.tsx` | Draggable panel hosting clock controls. | |
| `FocusNodesDevTool.tsx` | Developer overlay for focus node debugging. | |
| `FontProvider.tsx` | Loads/applies font CSS variables / next/font. | |
| `LeaveWarning.tsx` | Warns before navigating away mid-session. | |
| `LobbyOpenField.tsx` | Lobby discovery / open presence UI region. | |
| `LobbySatelliteField.tsx` | Lobby satellite visualization area. | |
| `Logo.tsx` | Brand logo mark. | |
| `MandalaCeremony.tsx` | Full-screen or immersive ceremony layout shell. | |
| `Menu.tsx` | Application menu / command surface. | |
| `MultiColourToggle.tsx` | Toggle multi-colour wheel modes. | |
| `MultiView2Overlay.tsx` | Second multi-view overlay layout. | |
| `MultiViewContent.tsx` | Content pane for multi-view modes. | |
| `RecentSessions.tsx` | Lists recent user sessions (cards/list). | |
| `SatelliteNameLabel.tsx` | Labels satellites with names. | |
| `SessionDurationDialog.tsx` | Pick session length before starting. | |
| `SessionPresenceBroadcast.tsx` | Broadcasts presence during sessions (lobby tie-in). | |
| `SessionProgressRing.tsx` | Circular progress for session/timer. | |
| `SessionTimer.tsx` | Displays active session countdown state. | |
| `SolarSystemResonance.tsx` | Decorative solar-system metaphor visualization. | |
| `SoundProvider.tsx` | Provides sound context / preload globally. | |
| `StepSequencer.tsx` | High-level sequencer shell composing grid + controls. | |
| `SymbolicLobby.tsx` | Lobby UI with symbolic mandala/flower metaphors. | |
| `ThemeProvider.tsx` | Theme (dark/light) provider. | |
| `ToastProvider.tsx` | Toast host wrapper. | |
| `Timer.tsx` | Generic countdown/stopwatch UI. | |
| `UserProfile.tsx` | Profile header / avatar / banner surface. | |
| `Watermark.tsx` | Subtle watermark overlay (brand/legal). | |
| `WeatherSnapshotPopover.tsx` | Popover showing weather snapshot tied to notes. | |
| `AuthProvider.tsx` | Re-export or wrapper wiring auth for subtree (check imports vs `app/layout`). | |
| `GlossaryRadialTree.tsx` | Radial tree visualization for glossary relationships. | |
| `AuthButton.tsx` | Compact sign-in/out or account trigger used in chrome layouts. | |
| `StartSessionDialog.tsx` | Dialog to configure and start a timed session from hub/dashboard flows. | |

### `components/layout/`

| File | Purpose |
|------|---------|
| `Footer.tsx` | Site footer links, legal shortcuts, and secondary navigation. |

### `components/auth/`

| File | Purpose |
|------|---------|
| `AuthModal.tsx` | Sign-in / sign-up modal flows. |
| `EditProfileModal.tsx` | Edit display name, avatar, banner, etc. |
| `EmailVerificationGate.tsx` | Blocks features until email verified when required. |
| `ProtectedRoute.tsx` | Client gate that redirects unauthenticated users. |

### `components/deck/`

| File | Purpose |
|------|---------|
| `CardTable.tsx` | Table layout for deck cards in a session. |
| `CreateSessionModal.tsx` | Creates a new collaborative session from deck context. |
| `DeckCard.tsx` | Single deck card UI (node/word/session summary). |
| `SessionsPanel.tsx` | Side panel listing sessions relevant to deck flows. |

### `components/glossary/`

| File | Purpose |
|------|---------|
| `GlossaryAllMyScopeButtons.tsx` | Batch actions / filters for “my words” scopes. |
| `GlossaryAlphabetStrip.tsx` | A–Z quick scroll strip. |
| `GlossaryDefaultChakraDropdown.tsx` | Dropdown for default chakra seed lists. |
| `GlossarySearchBar.tsx` | Search input with glossary-specific behavior. |
| `GlossarySentimentFilter.tsx` | Filters glossary entries by sentiment metadata. |
| `GlossaryToolbarActions.tsx` | Toolbar buttons for glossary operations. |
| `GlossaryVisualMagnifier.tsx` | Magnifier lens on glossary visuals. |
| `GlossaryVisualWordPanel.tsx` | Rich panel for a word’s visual/spatial representation. |
| `GlossaryWordScrollList.tsx` | Virtualized or long scroll list of words. |
| `SpeakButton.tsx` | TTS / pronunciation trigger for a word. |

### `components/info/`

| File | Purpose |
|------|---------|
| `AboutDeveloper.tsx` | Developer biography / credits. |
| `AboutESL.tsx` | ESL-oriented explainer content. |
| `AboutMechanism.tsx` | Product philosophy / mechanism explanation. |
| `FAQ.tsx` | Frequently asked questions. |
| `GettingStarted.tsx` | Onboarding steps for new users. |
| `LegalContact.tsx` | Legal contact and correspondence info. |
| `PrivacyData.tsx` | Privacy-related explanatory content (not a substitute for legal review). |

### `components/landing/`

| File | Purpose |
|------|---------|
| `FeatureStrip.tsx` | Marketing feature bullets/strip. |
| `HeroSection.tsx` | Landing hero headline and CTAs. |
| `ResearchCallout.tsx` | Highlights research program participation. |
| `RootPortalLanding.tsx` | Root route landing composition by portal. |

### `components/legal/`

| File | Purpose |
|------|---------|
| `DatenschutzContent.tsx` | German privacy (Datenschutz) page body content. |

### `components/passport/`

| File | Purpose |
|------|---------|
| `PassportKeyProvider.tsx` | Supplies passport crypto unlock state to descendants. |

### `components/record/` (My Record / passport / research surfaces)

| File | Purpose |
|------|---------|
| `AffinityPanel.tsx` | Node affinity summary and history. |
| `CredentialsPanel.tsx` | Credential requests and visibility toggles. |
| `ExportButton.tsx` | Triggers `exportUserData` download UX. |
| `InstitutionalAccessPanel.tsx` | Approve/deny institutional requests; history. |
| `LexiconPanel.tsx` | Personal lexicon stats and anchors. |
| `MyRecordView.tsx` | Shell composing record sub-panels. |
| `PassportKeySetup.tsx` | Guided passport passphrase/key setup. |
| `PhraseHistoryPanel.tsx` | Phrase practice session history charts/tables. |
| `ResearchDashboard.tsx` | Contributor-facing research analytics. |
| `ResearchStatusPanel.tsx` | Live research program status / connectivity. |

### `components/research/`

| File | Purpose |
|------|---------|
| `ResearchConsentFlow.tsx` | Multi-step consent capture for Categories B/C. |
| `ResearchConsentTrigger.tsx` | Entry chip/button opening consent flow. |

### `components/sequencer/`

| File | Purpose |
|------|---------|
| `MantraInput.tsx` | Text input for mantra with syllable parsing feedback. |
| `NodeAffinityMap.tsx` | Heatmap / map of affinity across nodes. |
| `NodePicker.tsx` | Pick active wheel nodes for sequence steps. |
| `PhraseProgressCurve.tsx` | SVG/plot of phrase scoring over time. |
| `SequencerControls.tsx` | Transport: play, BPM, step count, etc. |
| `SequencerGrid.tsx` | Step grid for sequencing syllables/clicks. |
| `SequencerHeader.tsx` | Title row + sequence metadata. |
| `StepCell.tsx` | One sequencer step toggle/editor. |
| `SyllabicAligner.tsx` | Aligns recorded audio syllables to steps (phrase practice). |

### `components/settings/`

| File | Purpose |
|------|---------|
| `AccountSettings.tsx` | Account-level preferences (email tier hooks). |
| `BannerFocalDialog.tsx` | Crop focal point for profile banner. |
| `PersonalInfoSettings.tsx` | Name, bio, etc. |
| `ResearchParticipationSettings.tsx` | Opt-in/out research preferences. |
| `SecuritySettings.tsx` | Password, sessions, passport key reminders. |
| `SequencerLoopsCard.tsx` | Sequencer loop persistence settings. |
| `SettingsDialog.tsx` | Modal shell grouping settings tabs. |
| `SmartHomeSettings.tsx` | Hue bridge pairing and room/light mapping UI. |
| `SoundSettings.tsx` | Master volumes, toggles for ambiences. |
| `ThemeSettings.tsx` | Theme selection. |
| `WheelFacesSettings.tsx` | Configure per-face images/videos on wheel. |

### `components/ui/` (shadcn/Radix primitives)

| File | Role |
|------|------|
| `avatar.tsx` | Avatar component |
| `button.tsx` | Button variants |
| `card.tsx` | Card layout |
| `dialog.tsx` | Modal dialog |
| `dock.tsx` | Dock-style toolbar primitive |
| `dropdown-menu.tsx` | Dropdown menus |
| `hint-popup.tsx` | Lightweight tooltip/hint |
| `input.tsx` | Text input |
| `label.tsx` | Form label |
| `LoadingSpinner.tsx` | Spinner |
| `popover.tsx` | Popover |
| `radio-group.tsx` | Radio group |
| `select.tsx` | Select control |
| `separator.tsx` | Visual divider |
| `sheet.tsx` | Slide-over panel |
| `slider.tsx` | Range slider |
| `switch.tsx` | Toggle switch |
| `tabs.tsx` | Tabbed interface |
| `textarea.tsx` | Multiline input |
| `toast.tsx`, `toaster.tsx`, `use-toast.ts` | Toast notifications |

---

## Part 4 — API routes (`app/api/`)

Per route:

- **Phase:** *Unknown — not tracked in repository metadata.*
- **Auth**, **request**, **response**, **errors**, and **external calls** are summarized below.

Runtime defaults to Edge unless `export const runtime = 'nodejs'` is set on the route module.

### `GET /api/clock`

- **Auth:** None.
- **Behavior:** Returns JSON with `currentTime` (ISO), `rotation`, and `elapsedTime` using shared `utils/timeCalculations` helpers with fixed demo start (`2024-01-01`) and one-minute rotation period.
- **Errors:** Unhandled exceptions bubble as Next error responses.

### `GET /api/words`

- **Auth:** None (reads glossary via `lib/glossary` server-side).
- **Query:** `search` — optional substring search; `includeNarrative` — when not `'1'`, strips `own_definition` and `context` from each word (**privacy redaction** for personal narrative fields).
- **Response:** `{ success, count, words }`.
- **Errors:** `500` with `{ success: false, error }`.

### `GET /api/test-glossary`

- **Auth:** None.
- **Behavior:** Returns `{ count, words }` from `getAllWords()` — development/testing endpoint (**avoid exposing rich personal fields in production** without reviewing callers).

### `POST /api/passport-read`

- **Runtime:** `nodejs`. **Auth:** None at HTTP layer; authorization is **passport id + approved access request + grant token** embedded in JSON body.
- **Body:** `{ passport_id, access_request_id, token }` — `passport_id` must match `MM-XXXX-XXXX-XXXX-XXXX`.
- **Behavior:** Validates approved access request and matching non-expired grant; returns scoped subsets: lexicon meta, phrases, affinity snapshot, consent summary depending on grant scopes; **writes an access log entry** to Firestore (`accessLog`).
- **Errors:** `400` missing fields, `404` passport/request, `403` wrong status/token/expiry, `500` read failure.

### `POST /api/credential-requests`

- **Runtime:** `nodejs`.
- **Body:** Credential submission from institution including passport id, access ids, issuer identity, credential fields, optional metadata (size limits enforced).
- **Behavior:** Validates issuer matches approved access request contact fields; creates pending doc in `passportCredentialRequests`.
- **Errors:** `400` validation errors, `403` issuer mismatch / invalid token / expiry, `404` unknown passport or request, `500` server error.

### `POST` / `GET /api/institutional-access-request`

- **Runtime:** `nodejs`. **Auth:** Shared secret header `x-mm-access-api-secret` must match `INSTITUTION_ACCESS_API_SECRET`.
- **POST:** Creates `accessRequests` doc under holder’s passport subtree (`scopes` must be from `INSTITUTION_ACCESS_SCOPES`).
- **GET:** Poll by `requestId` + `passportId` query params; returns `pending`, `denied`, or `approved` with optional `grant` `{ token, expires_at, scopes }`.
- **Errors:** `401`/`503` if secret missing or wrong, `400` validation, `404` unknown passport/request, `500` failures.

### `POST /api/consent-anchor`

- **Behavior:** Accepts `consentHash` (64 hex chars); sends **zero-value Polygon transaction** with hash as calldata using `OPERATOR_PRIVATE_KEY` and `POLYGON_RPC_URL`.
- **Privacy/legal:** On-chain anchoring creates a permanent record of the hash — disclose this to users in consent UX.
- **Errors:** `400` invalid hash, `503` chain not configured, `500` anchor failure.

### `GET /api/blog-sync`

- **Auth:** If `CRON_SECRET` is set, requires `Authorization: Bearer <CRON_SECRET>` (intended for Vercel cron).
- **Behavior:** Fetches `TOLP_RSS_URL`, parses RSS minimally, filters Mind Mechanism–tagged posts, upserts into `blog_crosslinks` in Firestore via Admin.
- **Errors:** `401`, `500` if feed URL missing or sync fails.

### `GET /api/support-places`

- **Behavior:** Proxies Google Places Nearby Search with server-side `GOOGLE_PLACES_API_KEY`; queries categories (hospital, therapy, refuge, etc.) around `lat`/`lng`.
- **Privacy:** User coordinates are sent to Google — disclose in crisis/support UX.
- **Errors:** `503` if API key missing, `400` if lat/lng invalid.

### `POST /api/phrase-transcribe`

- **Runtime:** `nodejs`. **`maxDuration`:** 60s.
- **Auth:** Firebase ID token via `verifyFirebaseRequestUid` (**401** if missing).
- **Body:** `multipart/form-data` with `file` audio blob.
- **Behavior:** Forwards to OpenAI Whisper (`OPENAI_API_KEY`); returns `text`, `language`, `duration`, word timestamps.
- **Privacy:** Audio leaves your infrastructure for OpenAI processing — disclose in UI copy.

### `GET /api/apple-music/token`

- **Runtime:** `nodejs`.
- **Behavior:** Signs ES256 MusicKit developer JWT from `APPLE_MUSIC_TEAM_ID`, `APPLE_MUSIC_KEY_ID`, `APPLE_MUSIC_PRIVATE_KEY`.
- **Response:** `{ token }`.
- **Errors:** `503` if credentials missing.

### `GET /api/hue/discover`

- **Behavior:** Proxies Philips Hue cloud discovery (`discovery.meethue.com`). Useful when dev machine can reach internet; **does not fix LAN-only bridge reachability from Vercel.**

### `POST /api/hue/pair`

- **Runtime:** `nodejs`.
- **Body:** `{ bridgeIp }`. LAN restriction via `lanHueBlockedReason` (**400** if blocked on cloud host).
- **Behavior:** Posts Hue pairing payloads to local bridge; returns `{ username }` on success or actionable error (e.g. bridge button press).

### `POST /api/hue/lights`

- **Runtime:** `nodejs`.
- **Body:** `{ bridgeIp, apiKey, state, lightIds? }` — sets Hue light state (CLIP v1); optional explicit ids or fetch all (capped).

### `GET /api/hue/rooms`

- **Runtime:** `nodejs`.
- **Query:** `bridgeIp`, `apiKey`.
- **Response:** `{ rooms, lights }` — Room groups and light names.

### `GET` / `POST /api/lobby/groups`

- **Runtime:** `nodejs`. **Auth:** Firebase ID token (**401** without valid uid).
- **GET:** Lists non-expired `lobby_groups` with sanitized fields for the caller (friends code only when member).
- **POST:** Actions: `create`, `create_friends`, `join`, `leave`, `join_code`, `update_schedule` — transactional membership updates, TTL checks, schedule validation.
- **Errors:** `503` if Admin unavailable, various `400`/`404` from validation.

### `GET /api/lobby/admin-config`

- **Runtime:** `nodejs`.
- **Auth:** None — returns **non-secret diagnostics**: which Firebase service-account env vars appear set, inferred project IDs, mismatch flags, Vercel env name. **Do not expose in production without access control** if considered sensitive operational detail.

### `POST /api/auth/dev-bypass`

- **Runtime:** `nodejs`.
- **Guard:** Only when `NODE_ENV === 'development'` (**403** otherwise).
- **Behavior:** Mints Firebase **custom tokens** for local QA: default admin uid, optional `DEV_LOCAL_*` username/password, or allowlisted emails (`DEV_AUTH_ALLOWLIST_EMAILS`).
- **Security:** Never enable behavior like this in production builds.

### `POST /api/profile/banner-url`

- **Runtime:** `nodejs`. **Auth:** Firebase ID token (**401**).
- **Body:** `{ bannerUrl }` — persisted to `user_profiles` and `users` docs via Admin batch (**trusted URL string** — ensure client only passes Storage URLs you expect).

---

## Appendix — File counts

- **`lib/`:** 96 TypeScript/TSX files (including `lib/hooks/`).
- **`components/`:** 136 `.tsx`/`.ts` modules plus `Clock.module.css` colocated with `Clock.tsx`.
- **`app/api/`:** 19 `route.ts` handlers.

---

*End of CODEBASE_MANUAL.md*
