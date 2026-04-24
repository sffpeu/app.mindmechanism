/**
 * Spotify PKCE OAuth2 utilities.
 *
 * No client secret required — PKCE is entirely client-side.
 * Requires NEXT_PUBLIC_SPOTIFY_CLIENT_ID in .env.local.
 *
 * Scopes requested:
 *   streaming                — Web Playback SDK (requires Spotify Premium)
 *   user-read-email          — identify the user
 *   user-read-private        — check Premium status
 *   user-library-read        — liked songs
 *   playlist-read-private    — private playlists
 *   user-read-playback-state — current playback
 *   user-modify-playback-state — play/pause/seek
 */

export const SPOTIFY_SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-library-read',
  'playlist-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
].join(' ')

export interface SpotifyTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number // epoch ms
}

// ── PKCE helpers ─────────────────────────────────────────────────────────────

function randomBase64Url(byteCount: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteCount))
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function sha256Base64Url(plain: string): Promise<string> {
  const encoded = new TextEncoder().encode(plain)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// ── Auth flow ─────────────────────────────────────────────────────────────────

export async function startSpotifyAuth(): Promise<void> {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
  if (!clientId) throw new Error('NEXT_PUBLIC_SPOTIFY_CLIENT_ID is not set')

  const redirectUri = `${window.location.origin}/auth/spotify/callback`
  const verifier = randomBase64Url(64)
  const challenge = await sha256Base64Url(verifier)

  sessionStorage.setItem('spotify_code_verifier', verifier)

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SPOTIFY_SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  })

  window.location.href = `https://accounts.spotify.com/authorize?${params}`
}

export async function exchangeSpotifyCode(code: string): Promise<SpotifyTokens> {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
  if (!clientId) throw new Error('NEXT_PUBLIC_SPOTIFY_CLIENT_ID is not set')

  const verifier = sessionStorage.getItem('spotify_code_verifier')
  if (!verifier) throw new Error('No PKCE verifier found — please try connecting again')

  const redirectUri = `${window.location.origin}/auth/spotify/callback`

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: verifier,
    }),
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error_description?: string }
    throw new Error(err.error_description ?? `Spotify token exchange failed (${res.status})`)
  }

  const data = (await res.json()) as {
    access_token: string
    refresh_token: string
    expires_in: number
  }

  sessionStorage.removeItem('spotify_code_verifier')

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
}

export async function refreshSpotifyToken(refreshToken: string): Promise<SpotifyTokens> {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
  if (!clientId) throw new Error('NEXT_PUBLIC_SPOTIFY_CLIENT_ID is not set')

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  })

  if (!res.ok) throw new Error(`Spotify token refresh failed (${res.status})`)

  const data = (await res.json()) as {
    access_token: string
    refresh_token?: string
    expires_in: number
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
}

export function spotifyTokensValid(tokens: SpotifyTokens | null): boolean {
  if (!tokens) return false
  return Date.now() < tokens.expiresAt - 60_000 // 60s buffer
}
