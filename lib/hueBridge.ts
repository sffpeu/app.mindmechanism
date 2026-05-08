/**
 * hueBridge.ts — server-only (Node.js runtime) helper for Philips Hue local bridge.
 *
 * Uses Node.js http/https modules with rejectUnauthorized: false so the
 * bridge's self-signed certificate is accepted. Agent is created lazily
 * inside the request function to avoid module-init issues.
 */

import http from 'node:http'
import https from 'node:https'

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
    // Agent created per-call — avoids stale state and module-init failures
    const agent = scheme === 'https'
      ? new https.Agent({ rejectUnauthorized: false })
      : undefined

    const options: https.RequestOptions = {
      hostname,
      port: scheme === 'https' ? 443 : 80,
      path,
      method,
      agent,
      headers: {
        'Content-Type': 'application/json',
        ...(body ? { 'Content-Length': String(Buffer.byteLength(body)) } : {}),
      },
    }

    const lib = scheme === 'https' ? https : http

    const req = lib.request(options, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () =>
        resolve({ statusCode: res.statusCode ?? 200, body: Buffer.concat(chunks).toString('utf8') })
      )
    })

    req.on('error', reject)
    req.setTimeout(timeoutMs, () =>
      req.destroy(new Error(`No response from bridge within ${timeoutMs / 1000}s`))
    )

    if (body) req.write(body)
    req.end()
  })
}

export function looksLikeJson(s: string): boolean {
  const t = s.trimStart().replace(/^\uFEFF/, '')
  return t.startsWith('[') || t.startsWith('{')
}

/**
 * Try HTTPS first (Bridge v2). If response isn't JSON, try HTTP (Bridge v1).
 * Throws with a full trace including raw responses if both fail.
 */
export async function bridgeRequest(
  hostname: string,
  path: string,
  method = 'GET',
  body?: string
): Promise<BridgeResponse> {
  const trace: string[] = []

  try {
    const res = await nodeRequest('https', hostname, path, method, body)
    if (looksLikeJson(res.body)) return res
    trace.push(`HTTPS [${res.statusCode}] non-JSON: ${res.body.slice(0, 160).replace(/\s+/g, ' ')}`)
  } catch (e) {
    trace.push(`HTTPS failed: ${e instanceof Error ? e.message : String(e)}`)
  }

  try {
    const res = await nodeRequest('http', hostname, path, method, body)
    if (looksLikeJson(res.body)) return res
    trace.push(`HTTP [${res.statusCode}] non-JSON: ${res.body.slice(0, 160).replace(/\s+/g, ' ')}`)
  } catch (e) {
    trace.push(`HTTP failed: ${e instanceof Error ? e.message : String(e)}`)
  }

  throw new Error(`Bridge at ${hostname} returned no JSON.\n${trace.join('\n')}`)
}

export function parseBridgeJson<T = unknown>(raw: string): T {
  const trimmed = raw.replace(/^\uFEFF/, '').trim()
  if (!trimmed) {
    throw new Error('Bridge returned an empty body — check the IP and that this is your Hue bridge.')
  }
  if (!looksLikeJson(trimmed)) {
    const preview = trimmed.slice(0, 160).replace(/\s+/g, ' ')
    throw new Error(
      `Bridge did not return JSON (wrong IP, captive portal, or not a Hue bridge). Starts with: ${preview}`
    )
  }
  try {
    return JSON.parse(trimmed) as T
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(
      `Bridge JSON parse failed (${msg}). Raw start: ${trimmed.slice(0, 200).replace(/\s+/g, ' ')}`
    )
  }
}
