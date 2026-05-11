import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from 'firebase-admin/firestore'
import { getFirebaseAdminApp } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

const PASSPORT_ID_RE = /^MM-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/

function hasScope(scopes: string[], keys: string[]): boolean {
  return keys.some((k) => scopes.includes(k))
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      passport_id?: string
      access_request_id?: string
      token?: string
    }
    const passportId = (body.passport_id ?? '').trim()
    const accessRequestId = (body.access_request_id ?? '').trim()
    const token = (body.token ?? '').trim()

    if (!passportId || !accessRequestId || !token) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!PASSPORT_ID_RE.test(passportId)) {
      return NextResponse.json({ error: 'Passport ID must match MM-XXXX-XXXX-XXXX-XXXX' }, { status: 400 })
    }

    // TODO: if needed, move to dedicated service account / isolated read service.
    const db = getFirestore(getFirebaseAdminApp())

    const passportSnap = await db.collection('passport').where('passport_id', '==', passportId).limit(1).get()
    if (passportSnap.empty) {
      return NextResponse.json({ error: 'Passport not found' }, { status: 404 })
    }
    const uid = passportSnap.docs[0].id

    const accessRef = db.collection('passport').doc(uid).collection('accessRequests').doc(accessRequestId)
    const accessSnap = await accessRef.get()
    if (!accessSnap.exists) {
      return NextResponse.json({ error: 'Access request not found' }, { status: 404 })
    }
    const access = accessSnap.data() as Record<string, unknown>
    if (access.status !== 'approved') {
      const st = typeof access.status === 'string' ? access.status : 'not approved'
      return NextResponse.json({ error: `Access is ${st}` }, { status: 403 })
    }

    const grantSnap = await db
      .collection('passport')
      .doc(uid)
      .collection('accessGrants')
      .where('request_id', '==', accessRequestId)
      .where('grant_token', '==', token)
      .limit(1)
      .get()

    if (grantSnap.empty) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
    }
    const grant = grantSnap.docs[0].data() as Record<string, unknown>
    const expiresAt = typeof grant.expires_at === 'string' ? grant.expires_at : null
    if (!expiresAt || Number.isNaN(new Date(expiresAt).getTime()) || new Date(expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Access token expired' }, { status: 403 })
    }
    const scopes = Array.isArray(grant.scopes)
      ? grant.scopes.filter((s): s is string => typeof s === 'string')
      : []

    const result: Record<string, unknown> = {
      passport_id: passportId,
      requester_name:
        typeof access.institution_name === 'string'
          ? access.institution_name
          : typeof access.requester_name === 'string'
            ? access.requester_name
            : 'Institution',
      access_expires_at: expiresAt,
      scope: scopes,
    }

    if (hasScope(scopes, ['personal_lexicon_meta', 'lexicon'])) {
      const lexSnap = await db
        .collection('glossary')
        .where('user_id', '==', uid)
        .where('personal', '==', true)
        .orderBy('created_at', 'desc')
        .get()
      result.lexicon = lexSnap.docs.map((d) => {
        const data = d.data()
        return {
          word: data.word ?? '',
          language: data.language ?? null,
          clock_id: data.clock_id ?? null,
          created_at: data.created_at ?? null,
        }
      })
    }

    if (hasScope(scopes, ['phrase_progress', 'phrases'])) {
      const phraseSnap = await db.collection('passport').doc(uid).collection('phrases').get()
      result.phrases = phraseSnap.docs.map((d) => {
        const p = d.data()
        return {
          phrase: p.phrase ?? '',
          ipaText: p.ipaText ?? '',
          latestScore: p.latestScore ?? 0,
          bestScore: p.bestScore ?? 0,
          sessionCount: p.sessionCount ?? 0,
          latestSessionAt: p.latestSessionAt ?? 0,
        }
      })
    }

    if (hasScope(scopes, ['node_affinity', 'affinity'])) {
      const latestAffinity = await db
        .collection('users')
        .doc(uid)
        .collection('nodeAffinityLog')
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get()
      result.affinity = latestAffinity.empty ? null : latestAffinity.docs[0].data()
    }

    if (hasScope(scopes, ['research_consent_summary', 'consent_record'])) {
      const userSnap = await db.collection('users').doc(uid).get()
      const userData = userSnap.data() as Record<string, any> | undefined
      const consent = userData?.researchConsent
      result.consent_record = {
        categoryB: consent?.categoryB
          ? {
              granted: consent.categoryB.granted,
              timestamp: consent.categoryB.timestamp,
              protocolVersion: consent.categoryB.protocolVersion,
              txHash: consent.categoryB.txHash ?? null,
            }
          : null,
        categoryC: consent?.categoryC
          ? {
              granted: consent.categoryC.granted,
              timestamp: consent.categoryC.timestamp,
              protocolVersion: consent.categoryC.protocolVersion,
              txHash: consent.categoryC.txHash ?? null,
            }
          : null,
      }
    }

    await db
      .collection('passport')
      .doc(uid)
      .collection('accessLog')
      .add({
        request_id: accessRequestId,
        requester_name: result.requester_name,
        requester_email:
          typeof access.institution_contact_email === 'string'
            ? access.institution_contact_email
            : typeof access.requester_email === 'string'
              ? access.requester_email
              : '',
        scope: scopes,
        action: 'read',
        action_at: new Date().toISOString(),
        expires_at: expiresAt,
        token_fingerprint: token.slice(0, 8),
      })

    return NextResponse.json(result)
  } catch (err) {
    console.error('passport-read error:', err)
    return NextResponse.json({ error: 'Read failed' }, { status: 500 })
  }
}

