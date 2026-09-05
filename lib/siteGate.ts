/**
 * Site-wide passcode gate.
 *
 * The whole site sits behind a single private code. Nothing is reachable, not
 * even the landing page, until the code is entered. Firebase sign-in still
 * happens afterwards, so per-user data and Firestore rules are unaffected.
 *
 * Both values live in environment variables only. The repository is public, so
 * the passcode must never appear in the source tree.
 */

/** Cookie holding the gate token. httpOnly, so page scripts cannot read it. */
export const GATE_COOKIE = '__mm_gate'

/** Where an ungated visitor is sent. */
export const GATE_PATH = '/gate'

/** Thirty days, matching the Firebase auth cookie. */
export const GATE_COOKIE_MAX_AGE = 30 * 24 * 60 * 60

/**
 * The opaque value written to the cookie once the passcode is accepted. A long
 * random string set in the deployment environment, never the passcode itself.
 */
export function getGateToken(): string | undefined {
  const token = process.env.SITE_GATE_TOKEN?.trim()
  return token ? token : undefined
}

/** The private code that opens the gate. */
export function getGatePasscode(): string | undefined {
  const code = process.env.SITE_PASSCODE?.trim()
  return code ? code : undefined
}

/** Paths that must stay reachable without the cookie, or the gate cannot work. */
export function isGateExemptPath(path: string): boolean {
  const p = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path
  return (
    p === GATE_PATH ||
    p === '/api/gate' ||
    // Vercel cron calls this on a schedule and carries no cookies.
    p === '/api/blog-sync'
  )
}

/**
 * New account creation. Closed unless explicitly opened in the environment.
 * This hides and blocks the sign-up path in the app itself; Firebase's own
 * provider settings are the authoritative lock.
 */
export const REGISTRATION_OPEN = process.env.NEXT_PUBLIC_REGISTRATION_OPEN === 'true'
