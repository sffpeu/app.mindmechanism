/**
 * POST /api/hue/pair
 * Body: { bridgeIp: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { bridgeRequest, parseBridgeJson } from '@/lib/hueBridge'
import { lanHueBlockedReason } from '@/lib/hueLanReachability'

export const runtime = 'nodejs'

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

  const blocked = lanHueBlockedReason(bridgeIp)
  if (blocked) {
    return NextResponse.json({ error: blocked }, { status: 400 })
  }

  /**
   * Pair without generateclientkey first — older bridges and some firmware reject extra fields
   * or return odd bodies; colour sync only needs the whitelist username.
   */
  const payloads = [
    JSON.stringify({ devicetype: 'mindmechanism#webapp' }),
    JSON.stringify({ devicetype: 'mindmechanism#webapp', generateclientkey: true }),
  ]

  let rawBody = ''
  try {
    let res: { statusCode: number; body: string } | null = null
    let lastBridgeErr: Error | null = null

    for (const payload of payloads) {
      try {
        res = await bridgeRequest(bridgeIp, '/api', 'POST', payload)
        rawBody = res.body
        if (rawBody.trim()) break
      } catch (e) {
        lastBridgeErr = e instanceof Error ? e : new Error(String(e))
        res = null
      }
    }

    if (!res?.body?.trim()) {
      return NextResponse.json(
        {
          error:
            lastBridgeErr?.message ??
            'No response from bridge — confirm IP, same Wi‑Fi as the bridge, and not a captive portal.',
        },
        { status: 502 }
      )
    }

    // Log to dev server terminal so we can see exactly what the bridge returned
    console.log('[hue/pair] raw bridge response:', rawBody.slice(0, 400))

    const data = parseBridgeJson<HuePairResult[] | HuePairResult>(rawBody)
    const first: HuePairResult | null = Array.isArray(data)
      ? (data[0] ?? null)
      : (data && typeof data === 'object' ? data : null)

    if (!first) {
      return NextResponse.json({ error: 'Empty response from bridge' }, { status: 502 })
    }

    if ('success' in first && first.success?.username) {
      return NextResponse.json({ username: first.success.username })
    }

    if ('error' in first) {
      const { type, description } = first.error
      const message = type === 101
        ? 'Press the button on your Hue bridge, then click Connect within 30 seconds.'
        : `Bridge error ${type}: ${description}`
      return NextResponse.json({ error: message }, { status: 409 })
    }

    return NextResponse.json({ error: 'Unexpected response from bridge', raw: rawBody.slice(0, 200) }, { status: 502 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[hue/pair] error:', message, '| raw so far:', rawBody.slice(0, 200))
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
