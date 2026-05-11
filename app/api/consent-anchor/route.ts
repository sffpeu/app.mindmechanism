import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, http } from 'viem'
import { polygon } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

const HEX64 = /^[0-9a-fA-F]{64}$/

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const consentHash = body?.consentHash

    if (typeof consentHash !== 'string' || consentHash.length !== 64 || !HEX64.test(consentHash)) {
      return NextResponse.json({ error: 'Invalid hash' }, { status: 400 })
    }

    const privateKeyRaw = process.env.OPERATOR_PRIVATE_KEY
    const rpcUrl = process.env.POLYGON_RPC_URL

    if (!privateKeyRaw || !rpcUrl) {
      return NextResponse.json({ error: 'Chain not configured' }, { status: 503 })
    }

    const privateKey = (
      privateKeyRaw.startsWith('0x') ? privateKeyRaw : `0x${privateKeyRaw}`
    ) as `0x${string}`

    const account = privateKeyToAccount(privateKey)
    const walletClient = createWalletClient({
      account,
      chain: polygon,
      transport: http(rpcUrl),
    })

    const txHash = await walletClient.sendTransaction({
      to: account.address,
      value: BigInt(0),
      data: `0x${consentHash}` as `0x${string}`,
    })

    return NextResponse.json({ txHash })
  } catch (err) {
    console.error('consent-anchor error:', err)
    return NextResponse.json({ error: 'Anchor failed' }, { status: 500 })
  }
}
