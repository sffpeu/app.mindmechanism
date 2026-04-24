/**
 * POST /api/hue/pair
 *
 * Body: { bridgeIp: string }
 *
 * Proxies the Hue bridge pairing call (CLIP v1).
 * The user must press the physical button on the bridge first — this endpoint
 * should be called within ~30 seconds of the button press.
 *
 * On success returns: { username: string } — store this as the API key.
 * On failure returns: { error: string, hueErrors?: object[] }
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  let bridgeIp: string

  try {
    const body = (await req.json()) as { bridgeIp?: string }
    if (!body.bridgeIp || typeof body.bridgeIp !== 'string') {
      return NextResponse.json({ error: 'bridgeIp is required' }, { status: 400 })
    }
    bridgeIp = body.bridgeIp.trim()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Basic IP/hostname sanity check — no arbitrary SSRF
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$|^[\w.-]+\.local$/
  if (!ipPattern.test(bridgeIp)) {
    return NextResponse.json({ error: 'Invalid bridge IP address' }, { status: 400 })
  }

  try {
    const res = await fetch(`http://${bridgeIp}/api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ devicetype: 'mindmechanism#webapp', generateclientkey: true }),
      signal: AbortSignal.timeout(8000),
    })

    const data = (await res.json()) as Array<{ success?: { username: string }; error?: { type: number; description: string } }>

    // Hue API always returns 200 — check body for errors
    const first = Array.isArray(data) ? data[0] : null
    if (first?.success?.username) {
      return NextResponse.json({ username: first.success.username })
    }

    if (first?.error) {
      const { type, description } = first.error
      // type 101 = "link button not pressed"
      const message =
        type === 101
          ? 'Press the button on your Hue bridge, then try again within 30 seconds.'
          : description
      return NextResponse.json({ error: message, hueErrors: data }, { status: 409 })
    }

    return NextResponse.json({ error: 'Unexpected response from bridge', raw: data }, { status: 502 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Could not reach bridge at ${bridgeIp}: ${message}` }, { status: 502 })
  }
}
