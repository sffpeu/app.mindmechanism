import { doc, getDoc, setDoc, type Firestore } from 'firebase/firestore'
import { db } from './firebase'
import { getKeyFingerprint, loadKey } from './passportCrypto'

const PASSPORT_ID_RE = /^MM-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/

async function derivePassportId(fingerprint: string): Promise<string> {
  const raw = fingerprint + 'mm-passport-id'
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  const hex = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16)
    .toUpperCase()
  return `MM-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`
}

/**
 * Returns the stable Passport ID for this holder (public reference, not a secret).
 * Uses the passport encryption key already in IndexedDB; does not generate a new key.
 */
export async function getOrCreatePassportId(uid: string): Promise<string | null> {
  if (!db) return null

  const metaRef = doc(db as Firestore, 'passport', uid)
  const snap = await getDoc(metaRef)
  const stored = snap.data()?.passport_id
  if (typeof stored === 'string' && PASSPORT_ID_RE.test(stored)) {
    return stored
  }

  const key = await loadKey()
  if (!key) return null

  const fingerprint = await getKeyFingerprint(key)
  const passportId = await derivePassportId(fingerprint)

  await setDoc(metaRef, { passport_id: passportId }, { merge: true })

  return passportId
}
