import { NextResponse } from 'next/server'
import { getFirestore } from 'firebase-admin/firestore'
import { getFirebaseAdminApp } from '@/lib/firebaseAdmin'
import { verifyFirebaseRequestUid } from '@/lib/verifyFirebaseRequestUid'

export const runtime = 'nodejs'

const MAX_BANNER_URL_LEN = 4096

/**
 * Persists profile banner URL after client uploads to Storage.
 * Uses Admin SDK so saves succeed even when production Firestore rules lag or differ from the repo.
 */
export async function POST(request: Request) {
  let uid: string | null
  try {
    uid = await verifyFirebaseRequestUid(request)
  } catch (e) {
    console.error('profile/banner-url: Firebase Admin init failed', e)
    return NextResponse.json(
      { error: 'Server could not verify authentication. Try again later.' },
      { status: 503 }
    )
  }

  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null || !('bannerUrl' in body)) {
    return NextResponse.json({ error: 'Expected { bannerUrl: string }' }, { status: 400 })
  }

  const raw = (body as { bannerUrl: unknown }).bannerUrl
  if (typeof raw !== 'string') {
    return NextResponse.json({ error: 'bannerUrl must be a string' }, { status: 400 })
  }

  const bannerUrl = raw.trim()
  if (bannerUrl.length > MAX_BANNER_URL_LEN) {
    return NextResponse.json({ error: 'bannerUrl is too long' }, { status: 400 })
  }

  try {
    const db = getFirestore(getFirebaseAdminApp())
    const batch = db.batch()
    const profileRef = db.collection('user_profiles').doc(uid)
    const usersRef = db.collection('users').doc(uid)
    batch.set(profileRef, { bannerUrl }, { merge: true })
    batch.set(usersRef, { bannerUrl }, { merge: true })
    await batch.commit()
  } catch (e) {
    console.error('profile/banner-url: Firestore write failed', e)
    return NextResponse.json({ error: 'Could not save banner URL' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
