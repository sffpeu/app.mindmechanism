/**
 * hueBridge.ts — server-only helper for Philips Hue local bridge requests.
 *
 * Uses Node.js http/https modules with an explicit https.Agent so that
 * rejectUnauthorized: false is guaranteed to apply (bridge uses self-signed cert).
 */

import http from 'http'
import https from 'https'

// Reuse a single agent for all HTTPS bridge requests within this process.
// Explicitly set rejectUnauthorized via the agent — more reliable than the
// per-request options approach in some Node.js versions.
const HTTPS_AGENT = new https.Agent({ rejectUnauthorized: false })

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
    const options: https.RequestOptions = {
      hostname,
      port: scheme === 'https' ? 443 : 80,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(body ? { 'Content-Length': String(Buffer.byteLength(body)) } : {}),
      },
      agent: scheme === 'https' ? HTTPS_AGENT : undefined,
    }

    const lib = scheme === 'https' ? https : http
    const req = lib.request(options, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve({ statusCode: res.statusCode ?? 200, body: raw })
      })
    })

    req.on('error', reject)
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`No response from bridge within ${timeoutMs / 1000}s`))
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
 * Try HTTPS first (Bridge v2). If the response isn't JSON (web UI on port 443),
 * fall back to HTTP (Bridge v1 / nginx redirect path won't apply for POST).
 * Returns raw BridgeResponse — caller calls parseBridgeJson to decode.
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
    trace.push(`HTTPS→ non-JSON [${res.statusCode}]: ${res.body.slice(0, 160).replace(/\s+/g, ' ')}`)
  } catch (e) {
    trace.push(`HTTPS→ ${e instanceof Error ? e.message : String(e)}`)
  }

  try {
    const res = await nodeRequest('http', hostname, path, method, body)
    if (looksLikeJson(res.body)) return res
    trace.push(`HTTP→ non-JSON [${res.statusCode}]: ${res.body.slice(0, 160).replace(/\s+/g, ' ')}`)
  } catch (e) {
    trace.push(`HTTP→ ${e instanceof Error ? e.message : String(e)}`)
  }

  // Both attempts gave non-JSON or failed — include trace in error so the
  // pair API route can surface it to the UI for diagnosis.
  throw new Error(`Hue bridge at ${hostname} did not return JSON:\n${trace.join('\n')}`)
}

/**
 * Parse bridge JSON. Throws with the raw body visible so failures are diagnosable.
 */
export function parseBridgeJson<T = unknown>(raw: string): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    const preview = raw.slice(0, 300).replace(/\s+/g, ' ')
    throw new Error(`Bridge returned non-JSON: "${preview}"`)
  }
}
