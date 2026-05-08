/**
 * Apple Music — library playlist discovery for session autoplay.
 * Uses the Apple Music REST API from the browser (requires subscriber + dev token).
 */

export function normalizeAppleMusicPlaylistId(
  input: string | null | undefined
): string | null {
  if (!input?.trim()) return null
  const s = input.trim()
  const fromPath = s.match(/\/playlist\/[^/]+\/(pl\.[^/?#]+|p\.[^/?#]+)/i)
  if (fromPath?.[1]) return fromPath[1]
  if (/^(pl\.|p\.)[a-zA-Z0-9-]+$/i.test(s)) return s
  return null
}

export async function fetchAppleLibraryPlaylistIds(
  musicUserToken: string
): Promise<string[]> {
  const tokRes = await fetch('/api/apple-music/token')
  if (!tokRes.ok) return []
  const { token: devToken } = (await tokRes.json()) as { token?: string }
  if (!devToken) return []

  const r = await fetch(
    'https://api.music.apple.com/v1/me/library/playlists?limit=20',
    {
      headers: {
        Authorization: `Bearer ${devToken}`,
        'Music-User-Token': musicUserToken,
      },
    }
  )
  if (!r.ok) return []
  const j = (await r.json()) as { data?: { id: string }[] }
  return (j.data ?? []).map((x) => x.id).filter(Boolean)
}
