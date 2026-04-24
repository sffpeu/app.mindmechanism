/**
 * hueBridge.ts — server-only helper for Philips Hue local bridge requests.
 *
 * Uses Node.js http/https modules directly so we can:
 *   • Accept the bridge's self-signed TLS certificate
 *   • Try HTTPS first (Bridge v2 firmware prefers it), validate the response
 *     looks like JSON before accepting it; fall back to HTTP if not
 *   • Give descriptive errors that include the raw bridge response
 */

import http from 'http'
import https from 'https'

interface BridgeResponse {
  statusCode: number
  body: string
}

function nodeRequest(
  scheme: 'http' | 'https',
  hostname: string,
  path: string,
  method: string,
  body?: string,
  timeoutMs = 5000
): Promise<BridgeResponse> {
  return new Promise((resolve, reject) => {
    const lib = scheme === 'https' ? https : http
    const options: https.RequestOptions = {
      hostname,
      port: scheme === 'https' ? 443 : 80,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
      },
      rejectUnauthorized: false, // bridge uses a self-signed cert
    }

    const req = lib.request(options, (res) => {
      let data = ''
      res.on('data', (chunk: Buffer) => { data += chunk.toString() })
      res.on('end', () => resolve({ statusCode: res.statusCode ?? 200, body: data }))
    })

    req.on('error', reject)
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Bridge did not respond within ${timeoutMs / 1000}s`))
    })

    if (body) req.write(body)
    req.end()
  })
}

function looksLikeJson(s: string): boolean {
  const t = s.trimStart()
  return t.startsWith('[') || t.startsWith('{')
}

/**
 * Try HTTPS first. If the response doesn't look like JSON (bridge web UI
 * may answer on 443 before the API does), fall back to plain HTTP.
 * Throws with a descriptive message including raw response if both fail.
 */
export async function bridgeRequest(
  hostname: string,
  path: string,
  method = 'GET',
  body?: string
): Promise<BridgeResponse> {
  const trace: string[] = []

  // ── HTTPS attempt ────────────────────────────────────────────────────────
  try {
    const res = await nodeRequest('https', hostname, path, method, body, 5000)
    if (looksLikeJson(res.body)) return res
    // Got a response but it's not JSON (likely the bridge web UI)
    trace.push(`HTTPS port 443 → non-JSON (${res.statusCode}): ${res.body.slice(0, 120).replace(/\n/g, ' ')}`)
  } catch (e) {
    trace.push(`HTTPS port 443 → ${e instanceof Error ? e.message : String(e)}`)
  }

  // ── HTTP fallback ────────────────────────────────────────────────────────
  try {
    const res = await nodeRequest('http', hostname, path, method, body, 5000)
    return res // return whatever HTTP gives us — let caller validate
  } catch (e) {
    trace.push(`HTTP port 80 → ${e instanceof Error ? e.message : String(e)}`)
  }

  throw new Error(`Could not reach Hue bridge at ${hostname}:\n${trace.join('\n')}`)
}

/**
 * Parse JSON from a bridge response body.
 * Throws with the raw body included so callers can surface it to the user.
 */
export function parseBridgeJson<T = unknown>(raw: string): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    const preview = raw.slice(0, 200).replace(/\n/g, ' ')
    throw new Error(`Bridge returned non-JSON response: "${preview}"`)
  }
}
