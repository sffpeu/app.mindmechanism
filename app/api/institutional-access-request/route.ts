import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getFirebaseAdminApp } from '@/lib/firebaseAdmin'
import { INSTITUTION_ACCESS_SCOPES } from '@/types/InstitutionalAccess'

export const runtime = 'nodejs'

const PASSPORT_ID_RE = /^MM-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/

function checkSecret(request: Request): boolean {
  const secret = process.env.INSTITUTION_ACCESS_API_SECRET?.trim()
  if (!secret) return false
  return request.headers.get('x-mm-access-api-secret') === secret
}

async function resolveHolderUid(db: Firestore, passportId: string): Promise<string | null> {
  const id = passportId.trim()
  if (!PASSPORT_ID_RE.test(id)) return null
  const qs = await db.collection('passport').where('passport_id', '==', id).limit(1).get()
  if (qs.empty) return null
  return qs.docs[0].id
}

function normalizeScopes(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null
  const scopes = raw.filter((s): s is string => typeof s === 'string').map((s) => s.trim())
  if (scopes.length === 0) return null
  const allowed = new Set(INSTITUTION_ACCESS_SCOPES as readonly string[])
  for (const s of scopes) {
    if (!allowed.has(s)) return null
  }
  return scopes
}

/** Institution creates a scoped access request targeting a Passport ID. */
export async function POST(request: NextRequest) {
  if (!checkSecret(request)) {
    const configured = Boolean(process.env.INSTITUTION_ACCESS_API_SECRET?.trim())
    return NextResponse.json(
      {
        error: configured ? 'Unauthorized' : 'Institutional access API is not configured (missing INSTITUTION_ACCESS_API_SECRET)',
      },
      { status: configured ? 401 : 503 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const passportId = typeof body.passportId === 'string' ? body.passportId.trim() : ''
  const institutionName = typeof body.institutionName === 'string' ? body.institutionName.trim() : ''
  const institutionContactEmail =
    typeof body.institutionContactEmail === 'string' ? body.institutionContactEmail.trim() : ''
  const purpose = typeof body.purpose === 'string' ? body.purpose.trim() : ''
  const durationDaysRaw = body.durationDays

  const scopes = normalizeScopes(body.scopes)
  if (!scopes) {
    return NextResponse.json({ error: 'scopes must be a non-empty array of allowed scope strings' }, { status: 400 })
  }

  if (!PASSPORT_ID_RE.test(passportId)) {
    return NextResponse.json({ error: 'passportId must be formatted as MM-XXXX-XXXX-XXXX-XXXX' }, { status: 400 })
  }
  if (institutionName.length < 2 || institutionName.length > 200) {
    return NextResponse.json({ error: 'institutionName length 2–200' }, { status: 400 })
  }
  if (institutionContactEmail.length < 3 || institutionContactEmail.length > 320) {
    return NextResponse.json({ error: 'institutionContactEmail invalid' }, { status: 400 })
  }
  if (purpose.length < 10 || purpose.length > 4000) {
    return NextResponse.json({ error: 'purpose length 10–4000' }, { status: 400 })
  }

  const durationDays =
    typeof durationDaysRaw === 'number' && Number.isFinite(durationDaysRaw)
      ? Math.floor(durationDaysRaw)
      : NaN
  if (durationDays < 1 || durationDays > 730) {
    return NextResponse.json({ error: 'durationDays must be 1–730' }, { status: 400 })
  }

  try {
    const db = getFirestore(getFirebaseAdminApp())
    const holderUid = await resolveHolderUid(db, passportId)
    if (!holderUid) {
      return NextResponse.json({ error: 'Unknown Passport ID' }, { status: 404 })
    }

    const reqCol = db.collection('passport').doc(holderUid).collection('accessRequests')
    const docRef = reqCol.doc()
    const createdAt = new Date().toISOString()

    await docRef.set({
      institution_name: institutionName,
      institution_contact_email: institutionContactEmail,
      purpose,
      scopes,
      duration_days: durationDays,
      status: 'pending',
      created_at: createdAt,
    })

    return NextResponse.json({
      ok: true,
      requestId: docRef.id,
      passportId,
    })
  } catch (e) {
    console.error('institutional-access-request POST:', e)
    return NextResponse.json({ error: 'Could not create request' }, { status: 500 })
  }
}

/** Poll request status; returns grant token once approved. */
export async function GET(request: NextRequest) {
  if (!checkSecret(request)) {
    const configured = Boolean(process.env.INSTITUTION_ACCESS_API_SECRET?.trim())
    return NextResponse.json(
      {
        error: configured ? 'Unauthorized' : 'Institutional access API is not configured (missing INSTITUTION_ACCESS_API_SECRET)',
      },
      { status: configured ? 401 : 503 }
    )
  }

  const url = request.nextUrl
  const requestId = url.searchParams.get('requestId')?.trim() ?? ''
  const passportId = url.searchParams.get('passportId')?.trim() ?? ''

  if (!requestId || !PASSPORT_ID_RE.test(passportId)) {
    return NextResponse.json({ error: 'requestId and passportId query params required' }, { status: 400 })
  }

  try {
    const db = getFirestore(getFirebaseAdminApp())
    const holderUid = await resolveHolderUid(db, passportId)
    if (!holderUid) {
      return NextResponse.json({ error: 'Unknown Passport ID' }, { status: 404 })
    }

    const reqRef = db.collection('passport').doc(holderUid).collection('accessRequests').doc(requestId)
    const reqSnap = await reqRef.get()
    if (!reqSnap.exists) {
      return NextResponse.json({ error: 'Unknown request' }, { status: 404 })
    }

    const st = reqSnap.data()?.status as string | undefined
    if (st === 'pending') {
      return NextResponse.json({ status: 'pending' })
    }
    if (st === 'denied') {
      return NextResponse.json({ status: 'denied' })
    }
    if (st !== 'approved') {
      return NextResponse.json({ error: 'Invalid request state' }, { status: 500 })
    }

    const grants = await db
      .collection('passport')
      .doc(holderUid)
      .collection('accessGrants')
      .where('request_id', '==', requestId)
      .limit(1)
      .get()

    if (grants.empty) {
      return NextResponse.json({ status: 'approved', grant: null })
    }

    const g = grants.docs[0].data()
    return NextResponse.json({
      status: 'approved',
      grant: {
        token: g.grant_token as string,
        expires_at: g.expires_at as string,
        scopes: g.scopes as string[],
      },
    })
  } catch (e) {
    console.error('institutional-access-request GET:', e)
    return NextResponse.json({ error: 'Could not load request' }, { status: 500 })
  }
}
