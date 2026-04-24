/**
 * POST /api/hue/pair
 * Body: { bridgeIp: string }
 *
 * Proxies the Hue bridge button-press pairing call.
 * Tries HTTPS first (Bridge v2 new firmware), falls back to HTTP (Bridge v1).
 * Self-signed certificate is accepted.
 *
 * User must press the physical button on the bridge before calling this.
 * On success: { username: string }
 * On failure: { error: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { bridgeRequest, parseBridgeJson } from '@/lib/hueBridge'

interface HuePairSuccess { success: { username: string } }
interface HuePairError   { error:   { type: number; description: string } }
type HuePairResult = HuePairSuccess | HuePairError

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

  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$|^[\w.-]+\.local$/
  if (!ipPattern.test(bridgeIp)) {
    return NextResponse.json({ error: 'Invalid bridge IP address' }, { status: 400 })
  }

  try {
    const payload = JSON.stringify({ devicetype: 'mindmechanism#webapp', generateclientkey: true })
    const res = await bridgeRequest(bridgeIp, '/api', 'POST', payload)
    const data = parseBridgeJson<HuePairResult[]>(res.body)

    const first = Array.isArray(data) ? data[0] : null
    if (!first) {
      return NextResponse.json({ error: 'Unexpected response from bridge' }, { status: 502 })
    }

    if ('success' in first && first.success?.username) {
      return NextResponse.json({ username: first.success.username })
    }

    if ('error' in first) {
      const { type, description } = first.error
      const message = type === 101
        ? 'Press the button on your Hue bridge, then try again within 30 seconds.'
        : description
      return NextResponse.json({ error: message }, { status: 409 })
    }

    return NextResponse.json({ error: 'Unexpected response from bridge' }, { status: 502 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `Could not reach bridge at ${bridgeIp}: ${message}` },
      { status: 502 }
    )
  }
}
