import { NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getFirebaseAdminApp } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

/** Stable UID for local dev; first sign-in creates this user in Firebase Auth. */
const DEFAULT_DEV_ADMIN_UID = 'dev_admin_local'

/**
 * Mints a custom token for local development only.
 * Requires Firebase Admin credentials (see .env.local.example).
 */
export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Dev bypass is only available in development.' }, { status: 403 })
  }

  const uid = process.env.FIREBASE_DEV_ADMIN_UID?.trim() || DEFAULT_DEV_ADMIN_UID

  try {
    const adminApp = getFirebaseAdminApp()
    const auth = getAuth(adminApp)
    const token = await auth.createCustomToken(uid, { admin: true })
    return NextResponse.json({ token })
  } catch (err) {
    console.error('[dev-bypass] Failed to mint custom token:', err)
    return NextResponse.json(
      {
        error:
          'Could not create a dev token. Add FIREBASE_SERVICE_ACCOUNT_JSON to .env.local (service account JSON, one line) or configure Application Default Credentials.',
      },
      { status: 500 }
    )
  }
}
