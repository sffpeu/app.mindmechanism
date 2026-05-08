/**
 * Hosted deployments (e.g. Vercel) cannot open TCP to RFC1918 addresses inside the user's home.
 * Hue bridge pairing/control must run where Next.js can reach the LAN — typically `next dev` locally.
 */

export function isPrivateLanHost(host: string): boolean {
  const h = host.trim().toLowerCase()
  if (h.endsWith('.local') || h.endsWith('.lan')) return true
  const parts = h.split('.')
  if (parts.length !== 4) return false
  const a = Number(parts[0])
  const b = Number(parts[1])
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false
  if (a === 10) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 127) return true
  if (a === 169 && b === 254) return true
  return false
}

/** True when this Node process is almost certainly a cloud serverless region, not your laptop. */
export function isDeployedServerless(): boolean {
  return process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined
}

export const HUE_CLOUD_LAN_MESSAGE =
  'This site is hosted in the cloud — it cannot reach a Hue bridge at a home address (192.168.x.x). ' +
  'On your Mac or PC, run the app on the same Wi‑Fi as the bridge: `npm run dev`, open http://localhost:3000, ' +
  'then Settings → Smart Home → Pair.'

export function lanHueBlockedReason(bridgeIp: string): string | null {
  if (!isDeployedServerless()) return null
  if (!isPrivateLanHost(bridgeIp)) return null
  return HUE_CLOUD_LAN_MESSAGE
}

/**
 * Browser hostname check: pairing works only when the user opens the app where the Next.js server
 * can reach the bridge — localhost, *.local, or the machine’s LAN IP (e.g. http://192.168.1.5:3000).
 */
export function isHueLanUiAllowedHostname(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true
  if (hostname.endsWith('.local')) return true
  return isPrivateLanHost(hostname)
}
