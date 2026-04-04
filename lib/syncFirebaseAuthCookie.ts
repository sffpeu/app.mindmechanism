import type { User } from 'firebase/auth'
import { setCookie } from 'cookies-next'

/** Must match middleware cookie name and options so the next request passes auth. */
export async function syncFirebaseAuthCookie(user: User): Promise<void> {
  const token = await user.getIdToken()
  setCookie('__firebase_auth_token', token, {
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })
}
