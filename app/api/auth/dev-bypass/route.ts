import { NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getFirebaseAdminApp } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

/** Stable UID for local dev; first sign-in creates this user in Firebase Auth. */
const DEFAULT_DEV_ADMIN_UID = 'dev_admin_local'

function parseEmailAllowlist(): string[] {
  const raw = process.env.DEV_AUTH_ALLOWLIST_EMAILS ?? ''
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * POST with no body (or empty JSON): mints token for fixed dev UID (admin claim).
 * POST with `{ "email": "..." }`: mints token for that email if listed in DEV_AUTH_ALLOWLIST_EMAILS.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Dev bypass is only available in development.' }, { status: 403 })
  }

  let body: { email?: string } = {}
  try {
    const text = await request.text()
    if (text) body = JSON.parse(text) as { email?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  try {
    const adminApp = getFirebaseAdminApp()
    const auth = getAuth(adminApp)

    const emailRaw = body.email?.trim()
    if (emailRaw) {
      const allowlist = parseEmailAllowlist()
      if (allowlist.length === 0) {
        return NextResponse.json(
          {
            error:
              'Email bypass is not configured. Set DEV_AUTH_ALLOWLIST_EMAILS in .env.local (comma-separated).',
          },
          { status: 403 }
        )
      }
      const normalized = normalizeEmail(emailRaw)
      if (!allowlist.includes(normalized)) {
        return NextResponse.json({ error: 'That email is not on the dev allowlist.' }, { status: 403 })
      }

      let userRecord
      try {
        userRecord = await auth.getUserByEmail(normalized)
      } catch (err: unknown) {
        const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : ''
        if (code === 'auth/user-not-found') {
          userRecord = await auth.createUser({ email: normalized, emailVerified: true })
        } else {
          throw err
        }
      }

      const grantAdmin = process.env.DEV_AUTH_ALLOWLIST_GRANT_ADMIN === 'true'
      const token = await auth.createCustomToken(
        userRecord.uid,
        grantAdmin ? { admin: true } : undefined
      )
      return NextResponse.json({ token })
    }

    const uid = process.env.FIREBASE_DEV_ADMIN_UID?.trim() || DEFAULT_DEV_ADMIN_UID
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
