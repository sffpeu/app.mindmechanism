import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getFirebaseAdminApp } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

const PASSPORT_ID_RE = /^MM-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ALLOWED_TYPES = new Set(['completion', 'assessment', 'endorsement', 'placement', 'note'])

type Payload = {
  passport_id?: unknown
  access_request_id?: unknown
  token?: unknown
  issuer_name?: unknown
  issuer_email?: unknown
  credential_type?: unknown
  credential_title?: unknown
  credential_description?: unknown
  issued_at?: unknown
  expires_at?: unknown
  metadata?: unknown
}

async function resolveHolderUid(db: Firestore, passportId: string): Promise<string | null> {
  const snap = await db.collection('passport').where('passport_id', '==', passportId).limit(1).get()
  if (snap.empty) return null
  return snap.docs[0].id
}

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: NextRequest) {
  let body: Payload
  try {
    body = (await request.json()) as Payload
  } catch {
    return bad('Invalid JSON body')
  }

  const passportId = typeof body.passport_id === 'string' ? body.passport_id.trim() : ''
  const accessRequestId = typeof body.access_request_id === 'string' ? body.access_request_id.trim() : ''
  const token = typeof body.token === 'string' ? body.token.trim() : ''
  const issuerName = typeof body.issuer_name === 'string' ? body.issuer_name.trim() : ''
  const issuerEmail = typeof body.issuer_email === 'string' ? body.issuer_email.trim() : ''
  const credentialType = typeof body.credential_type === 'string' ? body.credential_type.trim() : ''
  const credentialTitle = typeof body.credential_title === 'string' ? body.credential_title.trim() : ''
  const credentialDescription =
    typeof body.credential_description === 'string' ? body.credential_description.trim() : ''
  const issuedAt = typeof body.issued_at === 'string' ? body.issued_at.trim() : ''
  const expiresAtRaw = typeof body.expires_at === 'string' ? body.expires_at.trim() : ''

  if (!PASSPORT_ID_RE.test(passportId)) return bad('Passport ID must match MM-XXXX-XXXX-XXXX-XXXX')
  if (!accessRequestId) return bad('access_request_id is required')
  if (!token || token.length < 32) return bad('Invalid token')
  if (issuerName.length < 2 || issuerName.length > 200) return bad('issuer_name length must be 2-200')
  if (!EMAIL_RE.test(issuerEmail)) return bad('issuer_email is invalid')
  if (!ALLOWED_TYPES.has(credentialType)) return bad('credential_type is invalid')
  if (credentialTitle.length < 3 || credentialTitle.length > 200) {
    return bad('credential_title length must be 3-200')
  }
  if (credentialDescription.length < 3 || credentialDescription.length > 4000) {
    return bad('credential_description length must be 3-4000')
  }

  const issuedDate = new Date(issuedAt)
  if (Number.isNaN(issuedDate.getTime())) return bad('issued_at must be a valid ISO date')

  let expiresAt: string | null = null
  if (expiresAtRaw) {
    const expiresDate = new Date(expiresAtRaw)
    if (Number.isNaN(expiresDate.getTime())) return bad('expires_at must be a valid ISO date when provided')
    expiresAt = expiresDate.toISOString()
  }

  let metadata: Record<string, string> = {}
  if (body.metadata !== undefined) {
    if (typeof body.metadata !== 'object' || body.metadata == null || Array.isArray(body.metadata)) {
      return bad('metadata must be an object of string values')
    }
    const entries = Object.entries(body.metadata as Record<string, unknown>)
    if (entries.length > 40) return bad('metadata cannot contain more than 40 keys')
    for (const [k, v] of entries) {
      if (typeof v !== 'string') return bad('metadata values must be strings')
      if (k.length === 0 || k.length > 80) return bad('metadata keys must be 1-80 chars')
      if (v.length > 500) return bad('metadata values must be <= 500 chars')
      metadata[k] = v
    }
  }

  try {
    const db = getFirestore(getFirebaseAdminApp())
    const uid = await resolveHolderUid(db, passportId)
    if (!uid) return bad('Unknown Passport ID', 404)

    const reqRef = db.collection('passport').doc(uid).collection('accessRequests').doc(accessRequestId)
    const reqSnap = await reqRef.get()
    if (!reqSnap.exists) return bad('Access request not found', 404)

    const req = reqSnap.data() as Record<string, unknown>
    if (req.status !== 'approved') return bad('Access is not approved', 403)

    const grantSnap = await db
      .collection('passport')
      .doc(uid)
      .collection('accessGrants')
      .where('request_id', '==', accessRequestId)
      .where('grant_token', '==', token)
      .limit(1)
      .get()

    if (grantSnap.empty) return bad('Invalid token', 403)
    const grant = grantSnap.docs[0].data() as Record<string, unknown>
    const grantExpires = typeof grant.expires_at === 'string' ? new Date(grant.expires_at) : null
    if (!grantExpires || Number.isNaN(grantExpires.getTime()) || grantExpires.getTime() < Date.now()) {
      return bad('Access token expired', 403)
    }

    const issuerMatches =
      req.institution_name === issuerName && req.institution_contact_email === issuerEmail
    if (!issuerMatches) return bad('Issuer details must match the approved access request', 403)

    const docRef = db.collection('passportCredentialRequests').doc()
    await docRef.set({
      passport_id: passportId,
      access_request_id: accessRequestId,
      token,
      issuer_name: issuerName,
      issuer_email: issuerEmail,
      credential_type: credentialType,
      credential_title: credentialTitle,
      credential_description: credentialDescription,
      issued_at: issuedDate.toISOString(),
      expires_at: expiresAt,
      metadata,
      status: 'pending',
      requested_at: new Date().toISOString(),
      responded_at: null,
    })

    return NextResponse.json({ ok: true, request_id: docRef.id })
  } catch (e) {
    console.error('credential-requests POST:', e)
    return bad('Could not submit credential request', 500)
  }
}
