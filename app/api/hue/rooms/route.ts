/**
 * GET /api/hue/rooms?bridgeIp=...&apiKey=...
 *
 * Returns the bridge's named rooms (groups of type "Room") and light names.
 * Tries HTTPS first, falls back to HTTP. Self-signed cert accepted.
 */

import { NextRequest, NextResponse } from 'next/server'
import { bridgeRequest, parseBridgeJson } from '@/lib/hueBridge'

interface HueGroup {
  name: string
  type: string
  lights: string[]
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

  const base = `/api/${apiKey}`

  try {
    const [groupsRes, lightsRes] = await Promise.all([
      bridgeRequest(bridgeIp, `${base}/groups`),
      bridgeRequest(bridgeIp, `${base}/lights`),
    ])

    const rawGroups = parseBridgeJson<Record<string, HueGroup>>(groupsRes.body)
    const rawLights = parseBridgeJson<Record<string, HueLight>>(lightsRes.body)

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
