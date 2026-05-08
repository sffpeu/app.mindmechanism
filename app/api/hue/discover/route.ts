/**
 * GET /api/hue/discover
 *
 * Proxies the Hue mDNS/N-UPnP discovery endpoint.
 * Returns an array of bridge objects: [{ id, internalipaddress, port }]
 *
 * Works when the Next.js server is on the same local network as the bridge
 * (development / self-hosted). Production deployments on Vercel cannot reach
 * a home bridge directly — the Remote Hue API is needed for that path.
 */

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('https://discovery.meethue.com/', {
      headers: { 'Accept': 'application/json' },
      // 5-second timeout is generous for LAN discovery
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Discovery endpoint returned ${res.status}` },
        { status: 502 }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Discovery failed: ${message}` }, { status: 502 })
  }
}
