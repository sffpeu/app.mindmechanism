/** Firebase email-link (passwordless) sign-in: storage + continue URL. */

export const FIREBASE_EMAIL_LINK_STORAGE_KEY = 'emailForSignIn'

export function getEmailLinkFinishPath(callbackUrl: string): string {
  const path = '/auth/email-link'
  if (!callbackUrl || callbackUrl === '/dashboard') {
    return path
  }
  const q = new URLSearchParams({ callbackUrl })
  return `${path}?${q.toString()}`
}

export function getEmailLinkActionUrl(callbackUrl: string): string {
  if (typeof window === 'undefined') {
    const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || ''
    return `${base}${getEmailLinkFinishPath(callbackUrl)}`
  }
  return `${window.location.origin}${getEmailLinkFinishPath(callbackUrl)}`
}

export function sanitizeEmailLinkCallback(raw: string | null): string {
  if (
    !raw ||
    raw === '/' ||
    raw === '/home' ||
    raw === '/home/' ||
    raw.startsWith('/auth/')
  ) {
    return '/dashboard'
  }
  return raw.startsWith('/') ? raw : '/dashboard'
}
