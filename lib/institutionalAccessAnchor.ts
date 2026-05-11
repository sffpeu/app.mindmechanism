/**
 * Best-effort Polygon anchor for approve/deny decisions (same relay as consent — 64 hex in tx data).
 */
export async function anchorInstitutionalAccessDecision(
  passportId: string,
  requestId: string,
  decision: 'approved' | 'denied'
): Promise<string | null> {
  try {
    const raw = `mm.access.v1|${passportId}|${requestId}|${decision}`
    const encoded = new TextEncoder().encode(raw)
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
    const consentHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    const res = await fetch('/api/consent-anchor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consentHash }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { txHash?: string }
    return data.txHash ?? null
  } catch {
    return null
  }
}
