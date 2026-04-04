import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'

/**
 * Firebase Admin for server routes (Node runtime only).
 * Set FIREBASE_SERVICE_ACCOUNT_JSON to the full service account JSON as a single-line string in .env.local,
 * or use Application Default Credentials (e.g. GOOGLE_APPLICATION_CREDENTIALS).
 */
export function getFirebaseAdminApp(): App {
  const existing = getApps()[0]
  if (existing) return existing

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (raw) {
    const credentials = JSON.parse(raw) as Record<string, unknown>
    return initializeApp({ credential: cert(credentials) })
  }

  return initializeApp()
}
