export async function computeConsentHash(
  userHash: string,
  category: 'B' | 'C',
  action: 'grant' | 'withdraw',
  protocolVersion: string
): Promise<string> {
  const d = new Date()
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  d.setUTCHours(0, 0, 0, 0)
  const weekBin = d.toISOString().slice(0, 10)

  const raw = `${userHash}${category}${action}${weekBin}${protocolVersion}`
  const encoded = new TextEncoder().encode(raw)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function anchorConsentEvent(
  userHash: string,
  category: 'B' | 'C',
  action: 'grant' | 'withdraw',
  protocolVersion: string
): Promise<string | null> {
  try {
    const consentHash = await computeConsentHash(userHash, category, action, protocolVersion)

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
