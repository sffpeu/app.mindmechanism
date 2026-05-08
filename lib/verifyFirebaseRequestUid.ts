import { cookies } from 'next/headers'
import { getAuth } from 'firebase-admin/auth'
import { getFirebaseAdminApp } from '@/lib/firebaseAdmin'

/** Resolves the signed-in Firebase uid from Bearer token or `__firebase_auth_token` cookie. */
export async function verifyFirebaseRequestUid(request: Request): Promise<string | null> {
  const app = getFirebaseAdminApp()
  const authAdmin = getAuth(app)

  const bearer = request.headers.get('authorization')
  if (bearer?.startsWith('Bearer ')) {
    const raw = bearer.slice(7).trim()
    if (raw) {
      try {
        const decoded = await authAdmin.verifyIdToken(raw)
        return decoded.uid
      } catch {
        /* try cookie */
      }
    }
  }

  const cookieStore = await cookies()
  const cookieToken = cookieStore.get('__firebase_auth_token')?.value
  if (cookieToken) {
    try {
      const decoded = await authAdmin.verifyIdToken(cookieToken)
      return decoded.uid
    } catch {
      return null
    }
  }

  return null
}
