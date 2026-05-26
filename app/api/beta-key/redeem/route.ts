import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from 'firebase-admin/firestore'
import { getFirebaseAdminApp } from '@/lib/firebaseAdmin'
import { verifyFirebaseRequestUid } from '@/lib/verifyFirebaseRequestUid'
import type { BetaAccessClaim } from '@/types/Passport'
import type { Portal } from '@/lib/portalConfig'

export const runtime = 'nodejs'

interface BetaKeyDoc {
  sector: Portal
  label: string
  active: boolean
  created_at: string
}

export async function POST(req: NextRequest) {
  const uid = await verifyFirebaseRequestUid(req)
  if (!uid) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  let code: string
  try {
    const body = await req.json()
    code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!code) {
    return NextResponse.json({ error: 'No key provided.' }, { status: 400 })
  }

  const db = getFirestore(getFirebaseAdminApp())

  const keySnap = await db.collection('beta_keys').doc(code).get()
  if (!keySnap.exists) {
    return NextResponse.json({ error: 'Invalid key.' }, { status: 404 })
  }

  const keyData = keySnap.data() as BetaKeyDoc
  if (!keyData.active) {
    return NextResponse.json({ error: 'This key is no longer active.' }, { status: 403 })
  }

  const claim: BetaAccessClaim = {
    sector: keyData.sector,
    grantedAt: new Date().toISOString(),
    keyCode: code,
  }

  await db.collection('passport').doc(uid).set(
    { betaAccess: claim },
    { merge: true },
  )

  return NextResponse.json({
    sector: keyData.sector,
    label: keyData.label,
  })
}
