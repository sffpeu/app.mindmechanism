/**
 * Grant all language access to a user's Learner's Passport.
 *
 * Usage:
 *   node scripts/grant-language-access.mjs <uid> [tier]
 *
 * Example:
 *   node scripts/grant-language-access.mjs abc123uid extended
 *
 * Tier options: wheel | extended | corporate (default: extended)
 *
 * Requires FIREBASE_SERVICE_ACCOUNT env var or a serviceAccount.json in project root.
 * Get the UID from the Firebase Console → Authentication → Users.
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const uid = process.argv[2]
const tier = process.argv[3] ?? 'extended'

if (!uid) {
  console.error('Usage: node scripts/grant-language-access.mjs <uid> [tier]')
  process.exit(1)
}

const SUPPORTED_LOCALES = ['en', 'de', 'fi', 'fr', 'es', 'it']
const VALID_TIERS = ['wheel', 'extended', 'corporate']

if (!VALID_TIERS.includes(tier)) {
  console.error(`Invalid tier "${tier}". Must be one of: ${VALID_TIERS.join(', ')}`)
  process.exit(1)
}

// Load service account
let serviceAccount
const saPath = resolve(process.cwd(), 'serviceAccount.json')

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
} else if (existsSync(saPath)) {
  serviceAccount = JSON.parse(readFileSync(saPath, 'utf8'))
} else {
  console.error(
    'No service account found.\n' +
    'Either set FIREBASE_SERVICE_ACCOUNT env var or place serviceAccount.json in the project root.\n' +
    'Download it from Firebase Console → Project Settings → Service Accounts → Generate new private key.'
  )
  process.exit(1)
}

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const claim = {
  codes: SUPPORTED_LOCALES,
  grantedAt: new Date().toISOString(),
  tier,
}

await db.collection('passport').doc(uid).set({ languageAccess: claim }, { merge: true })

console.log(`✓ Granted all languages to uid: ${uid}`)
console.log(`  Codes: ${SUPPORTED_LOCALES.join(', ')}`)
console.log(`  Tier:  ${tier}`)
