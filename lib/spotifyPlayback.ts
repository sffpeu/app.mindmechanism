/**
 * Spotify Web API — transfer device, shuffle, play context, pause/resume.
 * Used with Web Playback SDK device_id from useSpotifyPlayer.
 */

export async function spotifyFetch(
  accessToken: string,
  path: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(`https://api.spotify.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
}

export async function spotifyTransferPlayback(
  accessToken: string,
  deviceId: string,
  play = false
): Promise<boolean> {
  const res = await spotifyFetch(accessToken, '/me/player', {
    method: 'PUT',
    body: JSON.stringify({ device_ids: [deviceId], play }),
  })
  return res.ok || res.status === 204
}

export async function spotifySetShuffle(
  accessToken: string,
  deviceId: string,
  state: boolean
): Promise<boolean> {
  const q = new URLSearchParams({ state: String(state), device_id: deviceId })
  const res = await spotifyFetch(accessToken, `/me/player/shuffle?${q}`, {
    method: 'PUT',
  })
  return res.ok || res.status === 204
}

export async function spotifyStartContext(
  accessToken: string,
  deviceId: string,
  contextUri: string
): Promise<boolean> {
  const q = new URLSearchParams({ device_id: deviceId })
  const res = await spotifyFetch(accessToken, `/me/player/play?${q}`, {
    method: 'PUT',
    body: JSON.stringify({ context_uri: contextUri }),
  })
  if (res.status === 204) return true
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
    throw new Error(err.error?.message ?? `Spotify play failed (${res.status})`)
  }
  return true
}

export async function spotifyPause(
  accessToken: string,
  deviceId: string
): Promise<void> {
  const q = new URLSearchParams({ device_id: deviceId })
  await spotifyFetch(accessToken, `/me/player/pause?${q}`, { method: 'PUT' })
}

/** Pauses whichever device is currently active (works after Web Player disconnect). */
export async function spotifyPausePlayback(accessToken: string): Promise<void> {
  await spotifyFetch(accessToken, '/me/player/pause', { method: 'PUT' })
}

export async function spotifyResume(
  accessToken: string,
  deviceId: string
): Promise<void> {
  const q = new URLSearchParams({ device_id: deviceId })
  await spotifyFetch(accessToken, `/me/player/play?${q}`, {
    method: 'PUT',
    body: JSON.stringify({}),
  })
}

export interface SpotifyPlaylistItem {
  id: string
  uri: string
  name: string
}

/** First few playlists from the current user (for session autoplay). */
export async function spotifyFetchUserPlaylists(
  accessToken: string,
  limit = 20
): Promise<SpotifyPlaylistItem[]> {
  const res = await spotifyFetch(
    accessToken,
    `/me/playlists?limit=${limit}`
  )
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
    throw new Error(err.error?.message ?? `Spotify playlists failed (${res.status})`)
  }
  const data = (await res.json()) as {
    items: { id: string; uri: string; name: string }[]
  }
  return (data.items ?? []).map((p) => ({ id: p.id, uri: p.uri, name: p.name }))
}

/** Accepts spotify:playlist:id, open.spotify.com URL, or raw playlist id. */
export function normalizeSpotifyPlaylistUri(input: string | null | undefined): string | null {
  if (!input?.trim()) return null
  const s = input.trim()
  if (s.startsWith('spotify:playlist:')) return s
  const m = s.match(/playlist\/([a-zA-Z0-9]+)/)
  if (m?.[1]) return `spotify:playlist:${m[1]}`
  if (/^[a-zA-Z0-9]+$/.test(s)) return `spotify:playlist:${s}`
  return null
}
