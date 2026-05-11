import { doc, getDoc, setDoc, increment, type Firestore } from 'firebase/firestore'
import { db } from './firebase'
import { getKeyFingerprint } from './passportCrypto'

export async function syncPassportKeyMeta(uid: string, key: CryptoKey): Promise<void> {
  if (!db) return
  try {
    const fingerprint = await getKeyFingerprint(key)
    const ref = doc(db as Firestore, 'passport', uid)
    const snap = await getDoc(ref)
    await setDoc(
      ref,
      {
        key_fingerprint: fingerprint,
        silo_version: '1',
        ...(snap.exists() ? {} : { created_at: new Date().toISOString() }),
      },
      { merge: true }
    )
  } catch (e) {
    console.error('syncPassportKeyMeta:', e)
  }
}

export async function bumpPassportLexiconCount(uid: string, delta: number): Promise<void> {
  if (!db || delta === 0) return
  try {
    const ref = doc(db as Firestore, 'passport', uid)
    await setDoc(ref, { lexicon_count: increment(delta) }, { merge: true })
  } catch (e) {
    console.error('bumpPassportLexiconCount:', e)
  }
}
