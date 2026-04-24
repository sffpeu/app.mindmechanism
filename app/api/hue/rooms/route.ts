/**
 * GET /api/hue/rooms?bridgeIp=...&apiKey=...
 *
 * Returns the bridge's named rooms (groups of type "Room") and
 * individual lights, so the client can build a room-selection UI.
 *
 * Response shape:
 * {
 *   rooms: Array<{ id: string; name: string; lightIds: string[] }>
 *   lights: Record<string, { name: string; type: string }>
 * }
 */

import { NextRequest, NextResponse } from 'next/server'

interface HueGroup {
  name: string
  type: string
  lights: string[]
  state?: { all_on: boolean; any_on: boolean }
}

interface HueLight {
  name: string
  type: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const bridgeIp = searchParams.get('bridgeIp')?.trim()
  const apiKey   = searchParams.get('apiKey')?.trim()

  if (!bridgeIp || !apiKey) {
    return NextResponse.json({ error: 'bridgeIp and apiKey are required' }, { status: 400 })
  }

  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$|^[\w.-]+\.local$/
  if (!ipPattern.test(bridgeIp)) {
    return NextResponse.json({ error: 'Invalid bridge IP' }, { status: 400 })
  }

  const base = `http://${bridgeIp}/api/${apiKey}`

  try {
    const [groupsRes, lightsRes] = await Promise.all([
      fetch(`${base}/groups`, { signal: AbortSignal.timeout(6000) }),
      fetch(`${base}/lights`, { signal: AbortSignal.timeout(6000) }),
    ])

    if (!groupsRes.ok || !lightsRes.ok) {
      return NextResponse.json({ error: 'Bridge returned an error fetching rooms/lights' }, { status: 502 })
    }

    const rawGroups = (await groupsRes.json()) as Record<string, HueGroup>
    const rawLights = (await lightsRes.json()) as Record<string, HueLight>

    // Keep only groups of type "Room" (Hue's room grouping)
    const rooms = Object.entries(rawGroups)
      .filter(([, g]) => g.type === 'Room')
      .map(([id, g]) => ({ id, name: g.name, lightIds: g.lights ?? [] }))
      .sort((a, b) => a.name.localeCompare(b.name))

    const lights: Record<string, { name: string; type: string }> = {}
    for (const [id, l] of Object.entries(rawLights)) {
      lights[id] = { name: l.name, type: l.type }
    }

    return NextResponse.json({ rooms, lights })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Could not fetch rooms: ${message}` }, { status: 502 })
  }
}
