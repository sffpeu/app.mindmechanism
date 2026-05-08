# On-Chain Consent Anchoring — Build Brief
### Phase 2.4 — Cursor Implementation Brief
**Version 1.0 | 2026-05-08**

---

> ⚠️ LEGAL CHECKPOINT — Before this goes to production, obtain legal confirmation that the double-hashed consent identifier described below does not constitute personal data under GDPR Art. 4(1). The build can be completed and tested in staging. It must not activate in production until this review is complete. See the AUDITABILITY_NOTE.md for the full legal prerequisite list.

---

## What This Is

Every consent event (grant or withdrawal for Category B or C) is currently written to Firestore — timestamps, protocol version, status. The operator controls that database. A motivated adversary — or a compelled operator — could alter those records.

On-chain anchoring makes the consent record independently verifiable. The consent hash is written to a public blockchain. The user receives a transaction hash. At any point, they or any third party can look up that transaction and confirm the hash matches — without trusting the operator's database.

This is the structural enforcement of the sovereignty commitment. The operator cannot claim consent existed when the chain shows it did not.

---

## Architecture: Operator-Relay Model

The user requires no cryptocurrency, no wallet, no Web3 knowledge. The operator holds a relay wallet (funded with a small amount of MATIC for gas — each transaction costs approximately $0.001). When a consent event fires, the client calls a Next.js API route. The API route signs and submits the transaction from the operator wallet. The transaction hash is returned and stored in the user's Firestore consent record alongside the existing timestamp and protocol version.

**Chain: Polygon PoS**
- Proof-of-stake (environmentally sustainable)
- Gas cost per transaction: ~$0.001
- EVM compatible, mature tooling
- Block explorer: polygonscan.com — user-accessible without technical knowledge

**Library: `viem`**
- Modern, TypeScript-native, minimal bundle size
- Works cleanly in Next.js API routes (server-side only)
- No client-side import required

---

## Installation

```bash
npm install viem
```

No other blockchain dependencies required.

---

## The Consent Hash

The value written to chain is not personal data — it is a hash of a hash:

```
consentHash = SHA-256(
  userHash +          // already a one-way hash of uid (from researchLogging.ts)
  consentCategory +   // 'B' or 'C'
  action +            // 'grant' or 'withdraw'
  weekBin +           // timestamp binned to week ('YYYY-MM-DD')
  protocolVersion     // '1.0'
)
```

`userHash` is the same 24-char hex computed in `researchLogging.ts`. The `weekBin` is the Monday of the consent event's week — the same binning function used for research events. The result is a 64-char hex string with no reversible path to the user's identity.

The on-chain transaction carries this hash in its `data` field (a simple `eth_sendTransaction` with `data: consentHash`, `value: 0`, `to: operatorAddress`). No smart contract required.

---

## New File: `app/api/consent-anchor/route.ts`

Server-side only. The operator private key never touches the client.

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, parseGwei } from 'viem'
import { polygon } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// Environment variables (set in Vercel dashboard — never in .env.local committed to git)
// OPERATOR_PRIVATE_KEY — funded Polygon wallet private key (0x...)
// POLYGON_RPC_URL — Polygon RPC endpoint (e.g. from Alchemy or Infura)

export async function POST(req: NextRequest) {
  try {
    const { consentHash } = await req.json()

    if (!consentHash || typeof consentHash !== 'string' || consentHash.length !== 64) {
      return NextResponse.json({ error: 'Invalid hash' }, { status: 400 })
    }

    const privateKey = process.env.OPERATOR_PRIVATE_KEY as `0x${string}`
    const rpcUrl = process.env.POLYGON_RPC_URL

    if (!privateKey || !rpcUrl) {
      return NextResponse.json({ error: 'Chain not configured' }, { status: 503 })
    }

    const account = privateKeyToAccount(privateKey)
    const walletClient = createWalletClient({
      account,
      chain: polygon,
      transport: http(rpcUrl),
    })

    const txHash = await walletClient.sendTransaction({
      to: account.address,       // self-send — lowest possible cost
      value: BigInt(0),
      data: `0x${consentHash}` as `0x${string}`,
    })

    return NextResponse.json({ txHash })
  } catch (err) {
    console.error('consent-anchor error:', err)
    return NextResponse.json({ error: 'Anchor failed' }, { status: 500 })
  }
}
```

The transaction is a self-send (operator wallet to operator wallet) with `value: 0`. Gas cost is minimised. The consent hash is in the `data` field — publicly readable on any Polygon block explorer.

---

## New File: `lib/consentAnchor.ts`

Client-side orchestration. Computes the hash, calls the API route, returns the transaction hash.

```typescript
export async function computeConsentHash(
  userHash: string,
  category: 'B' | 'C',
  action: 'grant' | 'withdraw',
  protocolVersion: string
): Promise<string> {
  // Bin timestamp to week
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
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
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
    const { txHash } = await res.json()
    return txHash ?? null
  } catch {
    return null
  }
}
```

The anchor is **non-blocking and best-effort**. If it fails (network issue, gas issue, chain congestion), the consent event still completes. The Firestore record is the primary consent record. The chain anchor is the verification layer. A failed anchor is logged but does not block the user's consent action.

---

## Update: `lib/researchLogging.ts`

The `hashUid` function already exists here. Import and use it in the consent flow.

Add to the export:

```typescript
export { hashUid }   // expose for use in consentAnchor.ts
```

---

## Update: `components/research/ResearchConsentFlow.tsx`

After writing the consent record to Firestore (the existing `setDoc` call on Screen 4 confirmation), fire the anchor as a background operation:

```typescript
import { anchorConsentEvent } from '@/lib/consentAnchor'
import { hashUid } from '@/lib/researchLogging'
import { RESEARCH_PROTOCOL_VERSION } from '@/lib/researchProtocol'

// After Firestore write, before closing the flow:
if (user?.uid) {
  const userHash = await hashUid(user.uid)

  // Fire both anchors in parallel — non-blocking
  const anchors: Promise<string | null>[] = []

  if (consentB !== null) {
    anchors.push(
      anchorConsentEvent(userHash, 'B', consentB ? 'grant' : 'withdraw', RESEARCH_PROTOCOL_VERSION)
        .then(txHash => {
          if (txHash) updateConsentAnchor(user.uid, 'categoryB', txHash)
          return txHash
        })
    )
  }
  if (consentC !== null) {
    anchors.push(
      anchorConsentEvent(userHash, 'C', consentC ? 'grant' : 'withdraw', RESEARCH_PROTOCOL_VERSION)
        .then(txHash => {
          if (txHash) updateConsentAnchor(user.uid, 'categoryC', txHash)
          return txHash
        })
    )
  }

  // Do not await — fire and forget
  Promise.allSettled(anchors)
}
```

---

## Update: `lib/researchLogging.ts` — Store TX Hash

```typescript
import { doc, updateDoc } from 'firebase/firestore'

export async function updateConsentAnchor(
  uid: string,
  category: 'categoryB' | 'categoryC',
  txHash: string
): Promise<void> {
  if (!db) return
  const ref = doc(db, 'users', uid)
  await updateDoc(ref, {
    [`researchConsent.${category}.txHash`]: txHash,
    [`researchConsent.${category}.chainId`]: 137,  // Polygon PoS chain ID
  })
}
```

The `txHash` and `chainId` fields are added to the existing `ResearchConsent` type:

```typescript
// In lib/FirebaseAuthContext.tsx — update ResearchConsent interface:
export interface ResearchConsent {
  granted: boolean
  timestamp: string
  protocolVersion: string
  txHash?: string     // Polygon transaction hash — present when anchor succeeded
  chainId?: number    // 137 = Polygon PoS
}
```

---

## Surface in My Record

### File: `components/record/ResearchStatusPanel.tsx`

When `txHash` is present on a consent record, show a verification link:

```tsx
{consent.txHash && (
  <a
    href={`https://polygonscan.com/tx/${consent.txHash}`}
    target="_blank"
    rel="noopener noreferrer"
    className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline underline-offset-2"
  >
    Verify on Polygon ↗
  </a>
)}
```

No explanation needed beyond the link text. The user who understands it will use it. The user who doesn't is unaffected.

---

## Environment Variables Required

Add to Vercel project settings (not committed to git):

```
OPERATOR_PRIVATE_KEY=0x...   # funded Polygon PoS wallet
POLYGON_RPC_URL=https://...  # Alchemy/Infura Polygon endpoint
```

The operator wallet needs a small MATIC balance. At $0.001 per transaction and two transactions per consent event (B + C), 10,000 consent events costs approximately $20 in gas. Fund with 0.5 MATIC initially (~$0.40 at current rates). Top up as needed.

---

## Files to Create

```
app/api/consent-anchor/route.ts   — server-side relay, operator wallet
lib/consentAnchor.ts              — hash computation + API call
```

## Files to Modify

```
lib/researchLogging.ts                         — export hashUid, add updateConsentAnchor
lib/FirebaseAuthContext.tsx                    — add txHash + chainId to ResearchConsent type
components/research/ResearchConsentFlow.tsx    — fire anchors after Firestore write
components/settings/ResearchParticipationSettings.tsx — fire anchor on toggle change
components/record/ResearchStatusPanel.tsx      — show verify link when txHash present
```

## Files NOT to Touch

```
phraseAcousticAnalysis.ts
StepSequencer.tsx
SolarSystemResonance.tsx
app/sequencer/page.tsx
lib/nodeAffinity.ts
lib/phraseProgress.ts
```

---

## What Phase 2 Delivers — Complete

When 2.4 ships, Phase 2 is done:

| Step | What it delivers |
|---|---|
| 2.1 My Record | Unified view of everything the platform holds for the user |
| 2.2 Data Export | GDPR Art. 20 portable download — the Passport as a file |
| 2.3 Research Dashboard | Transparent window into the research programme |
| 2.4 On-Chain Anchoring | Consent records independently verifiable, beyond operator control |

The user can now see their record, download it, understand their research contribution, and verify their consent is what they said it was — on a chain neither party controls.

**Phase 3 begins next: Sovereignty Infrastructure** — holder-controlled keys, silo separation, personal lexicon ownership anchoring. The architecture deepens.

---

*Prepared by Claude Code (EIC) for Sean Fortune (Creative Authority)*
*⚠️ Legal review required before production activation — see AUDITABILITY_NOTE.md*
*Phase 2.4 of PASSPORT_ROADMAP.md*
