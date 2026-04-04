import type { User } from 'firebase/auth'

/** Email/password accounts must verify via email before full app access. */
export function usesPasswordProvider(user: User): boolean {
  return user.providerData.some((p) => p.providerId === 'password')
}

export function requiresEmailVerification(user: User | null): boolean {
  if (!user || user.emailVerified) return false
  return usesPasswordProvider(user)
}

export function getVerifyEmailContinueUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/verify-email`
  }
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || ''
  return `${base}/auth/verify-email`
}
