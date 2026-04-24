/**
 * POST /api/hue/lights
 * Body: { bridgeIp, apiKey, state, lightIds? }
 *
 * Sets one or more lights to the given state via the local Hue CLIP v1 API.
 * Tries HTTPS first (Bridge v2), falls back to HTTP. Self-signed cert accepted.
 * When lightIds is omitted, fetches all lights and addresses each.
 */

import { NextRequest, NextResponse } from 'next/server'
import { bridgeRequest, parseBridgeJson } from '@/lib/hueBridge'

export const runtime = 'nodejs'
import type { HueLightState } from '@/lib/hueColors'

interface LightsBody {
  bridgeIp: string
  apiKey: string
  state: HueLightState
  lightIds?: string[]
}

const MAX_LIGHTS = 50

export async function POST(req: NextRequest) {
  let body: LightsBody
  try {
    body = (await req.json()) as LightsBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { bridgeIp, apiKey, state, lightIds } = body
  if (!bridgeIp || !apiKey || !state) {
    return NextResponse.json({ error: 'bridgeIp, apiKey and state are required' }, { status: 400 })
  }

  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$|^[\w.-]+\.local$/
  if (!ipPattern.test(bridgeIp.trim())) {
    return NextResponse.json({ error: 'Invalid bridge IP address' }, { status: 400 })
  }

  const base = `/api/${apiKey}`
  let ids: string[] = lightIds ?? []

  if (ids.length === 0) {
    try {
      const res = await bridgeRequest(bridgeIp, `${base}/lights`)
      const lights = parseBridgeJson<Record<string, unknown>>(res.body)
      ids = Object.keys(lights).slice(0, MAX_LIGHTS)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return NextResponse.json({ error: `Light list fetch failed: ${message}` }, { status: 502 })
    }
  }

  if (ids.length === 0) {
    return NextResponse.json({ ok: true, addressed: 0, note: 'No lights found on bridge' })
  }

  const statePayload = JSON.stringify(state)
  const results = await Promise.allSettled(
    ids.map((id) => bridgeRequest(bridgeIp, `${base}/lights/${id}/state`, 'PUT', statePayload))
  )

  const succeeded = results.filter((r) => r.status === 'fulfilled').length
  return NextResponse.json({ ok: true, addressed: succeeded, total: ids.length })
}
