/**
 * Apple MusicKit JS — client-side utilities.
 *
 * MusicKit JS loads dynamically from Apple's CDN. It requires a developer
 * token (short-lived JWT signed server-side) to initialise, then the user
 * authorises to get a user music token for their personal library.
 *
 * Usage:
 *   const userToken = await authorizeAppleMusic()  // opens Apple sign-in sheet
 *   const mk = getMusicKit()                        // after init, access instance
 */

// ── Type shim ─────────────────────────────────────────────────────────────────
// MusicKit JS doesn't ship TS types in all environments.
declare global {
  interface Window {
    MusicKit?: {
      configure: (config: {
        developerToken: string
        app: { name: string; build: string }
      }) => MusicKitInstance
      getInstance: () => MusicKitInstance
    }
  }
}

interface MusicKitInstance {
  authorize: () => Promise<string>
  unauthorize: () => Promise<void>
  isAuthorized: boolean
  musicUserToken: string | null
  player: {
    nowPlayingItem: unknown
    playbackState: number
    play: () => Promise<void>
    pause: () => void
    skipToNextItem: () => Promise<void>
    skipToPreviousItem: () => Promise<void>
    seekToTime: (time: number) => Promise<void>
  }
  setQueue: (options: { playlist?: string; album?: string; song?: string; url?: string }) => Promise<void>
}

// ── Script loader ─────────────────────────────────────────────────────────────

let scriptPromise: Promise<void> | null = null

function loadMusicKitScript(): Promise<void> {
  if (scriptPromise) return scriptPromise
  if (typeof window === 'undefined') return Promise.reject(new Error('SSR'))

  // Already loaded
  if (window.MusicKit) return Promise.resolve()

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load MusicKit JS'))
    document.head.appendChild(script)
  })

  return scriptPromise
}

// ── Developer token fetch ─────────────────────────────────────────────────────

async function fetchDeveloperToken(): Promise<string> {
  const res = await fetch('/api/apple-music/token')
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `Apple Music token fetch failed (${res.status})`)
  }
  const { token } = (await res.json()) as { token: string }
  return token
}

// ── Init / get instance ───────────────────────────────────────────────────────

let initPromise: Promise<MusicKitInstance> | null = null

export async function initMusicKit(): Promise<MusicKitInstance> {
  if (initPromise) return initPromise

  initPromise = (async () => {
    await loadMusicKitScript()
    if (!window.MusicKit) throw new Error('MusicKit failed to load')

    const developerToken = await fetchDeveloperToken()

    return window.MusicKit.configure({
      developerToken,
      app: { name: 'Mind Mechanism', build: '1.0.0' },
    })
  })()

  return initPromise
}

export function getMusicKit(): MusicKitInstance | null {
  if (typeof window === 'undefined' || !window.MusicKit) return null
  try {
    return window.MusicKit.getInstance()
  } catch {
    return null
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

/**
 * Initialises MusicKit (if needed) and opens the Apple Music sign-in sheet.
 * Returns the music user token on success.
 */
export async function authorizeAppleMusic(): Promise<string> {
  const mk = await initMusicKit()
  const userToken = await mk.authorize()
  return userToken
}

export async function unauthorizeAppleMusic(): Promise<void> {
  const mk = getMusicKit()
  if (mk) await mk.unauthorize()
}

export function appleMusicIsAuthorized(): boolean {
  const mk = getMusicKit()
  return mk?.isAuthorized ?? false
}
