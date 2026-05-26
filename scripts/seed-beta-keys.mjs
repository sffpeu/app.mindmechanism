/**
 * Seed the three beta access keys into Firestore `beta_keys` collection.
 *
 * Run with Node 18 or 20 (firebase-admin incompatibility with Node 24):
 *   nvm use 20 && node scripts/seed-beta-keys.mjs
 *
 * Requires serviceAccount.json in the project root (never commit this file).
 * Idempotent — existing keys are not overwritten.
 */

import { createRequire } from 'module'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const admin = require('firebase-admin')

const serviceAccountPath = path.join(__dirname, '..', 'serviceAccount.json')
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'))

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}

const db = admin.firestore()

const BETA_KEYS = [
  {
    code:    'MMW-Q2TC-PFTJ',
    sector:  'consumer',
    label:   'Consumer Beta',
    active:  true,
    created_at: new Date().toISOString(),
  },
  {
    code:    'MME-J2EG-RZ32',
    sector:  'academic',
    label:   'Academic Beta',
    active:  true,
    created_at: new Date().toISOString(),
  },
  {
    code:    'MMC-63Y5-VIWK',
    sector:  'corporate',
    label:   'Corporate Beta',
    active:  true,
    created_at: new Date().toISOString(),
  },
]

async function seed() {
  console.log(`Seeding ${BETA_KEYS.length} beta keys…\n`)

  for (const key of BETA_KEYS) {
    const ref = db.collection('beta_keys').doc(key.code)
    const snap = await ref.get()

    if (snap.exists) {
      console.log(`  SKIP  ${key.code}  (${key.label}) — already exists`)
      continue
    }

    const { code, ...data } = key
    await ref.set(data)
    console.log(`  OK    ${key.code}  (${key.label})`)
  }

  console.log('\nDone.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
