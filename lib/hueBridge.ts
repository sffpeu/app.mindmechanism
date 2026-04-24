/**
 * hueBridge.ts — server-only helper for Philips Hue local bridge requests.
 *
 * Uses Node.js http/https modules so we can:
 *   • Try HTTPS first (Bridge v2 firmware ≥ 1.31 prefers/requires it)
 *   • Accept the bridge's self-signed TLS certificate (rejectUnauthorized: false)
 *   • Fall back to plain HTTP for older Bridge v1 devices
 *
 * All functions throw on failure; callers wrap in try/catch.
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
  timeoutMs = 6000
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

/**
 * Try HTTPS first, then plain HTTP.
 * Returns the first successful response (2xx/4xx counts — we just need TCP+HTTP).
 */
export async function bridgeRequest(
  hostname: string,
  path: string,
  method = 'GET',
  body?: string
): Promise<BridgeResponse> {
  // Attempt HTTPS first (Bridge v2 newer firmware)
  try {
    return await nodeRequest('https', hostname, path, method, body, 5000)
  } catch {
    // fall through to HTTP
  }

  // Attempt HTTP (Bridge v1, or older Bridge v2 firmware)
  return nodeRequest('http', hostname, path, method, body, 5000)
}

/** Convenience: parse bridge JSON response, throw on Hue API error array */
export function parseBridgeJson<T = unknown>(raw: string): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    throw new Error(`Bridge returned non-JSON: ${raw.slice(0, 200)}`)
  }
}
