/**
 * POST /api/hue/lights
 *
 * Body: {
 *   bridgeIp: string
 *   apiKey:   string          (username from pairing)
 *   state:    HueLightState   (xy, bri, transitiontime, on)
 *   lightIds?: string[]       (optional — omit to address all lights)
 * }
 *
 * Sets one or more lights to the given state via the local Hue CLIP v1 API.
 * When lightIds is omitted the route fetches the bridge's light list first
 * and addresses each light individually (Hue v1 has no "all lights" shortcut
 * that works reliably across firmware versions).
 *
 * Returns: { ok: true, addressed: number } on success.
 */

import { NextRequest, NextResponse } from 'next/server'
import type { HueLightState } from '@/lib/hueColors'

interface LightsBody {
  bridgeIp: string
  apiKey: string
  state: HueLightState
  lightIds?: string[]
}

// Safety limits
const MAX_LIGHTS = 50
const REQUEST_TIMEOUT_MS = 6000

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

  // SSRF guard
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$|^[\w.-]+\.local$/
  if (!ipPattern.test(bridgeIp.trim())) {
    return NextResponse.json({ error: 'Invalid bridge IP address' }, { status: 400 })
  }

  const base = `http://${bridgeIp}/api/${apiKey}`

  // Resolve light IDs
  let ids: string[] = lightIds ?? []
  if (ids.length === 0) {
    try {
      const listRes = await fetch(`${base}/lights`, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
      if (!listRes.ok) {
        return NextResponse.json({ error: 'Could not fetch light list from bridge' }, { status: 502 })
      }
      const lights = (await listRes.json()) as Record<string, unknown>
      ids = Object.keys(lights).slice(0, MAX_LIGHTS)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return NextResponse.json({ error: `Light list fetch failed: ${message}` }, { status: 502 })
    }
  }

  if (ids.length === 0) {
    return NextResponse.json({ ok: true, addressed: 0, note: 'No lights found on bridge' })
  }

  // Send state to each light (fire-and-forget race — we don't fail on individual light errors)
  const results = await Promise.allSettled(
    ids.map((id) =>
      fetch(`${base}/lights/${id}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    )
  )

  const succeeded = results.filter((r) => r.status === 'fulfilled').length
  return NextResponse.json({ ok: true, addressed: succeeded, total: ids.length })
}
