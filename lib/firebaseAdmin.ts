import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

/**
 * Firebase Admin for server routes (Node runtime only).
 *
 * **Vercel (if JSON paste keeps failing):**
 * - `FIREBASE_SERVICE_ACCOUNT_BASE64` — locally: `base64 -i serviceAccount.json | tr -d '\n' | pbcopy`
 *   Paste one line into Vercel (no quotes).
 *
 * - `FIREBASE_SERVICE_ACCOUNT_JSON` — minified one-line JSON. Do not wrap the whole value in extra `"..."`.
 */
function tryParseServiceAccount(): Record<string, unknown> | null {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim()
  if (b64) {
    try {
      const json = Buffer.from(b64, 'base64').toString('utf8')
      return JSON.parse(json) as Record<string, unknown>
    } catch {
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_BASE64 (must be base64 of the raw .json file)')
    }
  }

  let raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()
  if (!raw) return null

  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    raw = raw.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n')
  }

  try {
    let parsed: unknown = JSON.parse(raw)
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed)
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('not an object')
    }
    return parsed as Record<string, unknown>
  } catch {
    throw new Error(
      'Invalid FIREBASE_SERVICE_ACCOUNT_JSON. Use minified JSON, or FIREBASE_SERVICE_ACCOUNT_BASE64 (base64 of the .json file).'
    )
  }
}

export function getFirebaseAdminApp(): App {
  const existing = getApps()[0]
  if (existing) return existing

  const credentials = tryParseServiceAccount()
  if (credentials) {
    return initializeApp({ credential: cert(credentials) })
  }

  return initializeApp()
}

export function getAdminFirestore(): Firestore {
  return getFirestore(getFirebaseAdminApp())
}
