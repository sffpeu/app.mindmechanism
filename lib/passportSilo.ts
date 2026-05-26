import { doc, getDoc, setDoc, increment, type Firestore } from 'firebase/firestore'
import { db } from './firebase'
import { getKeyFingerprint } from './passportCrypto'
import type { LanguageAccessClaim } from '@/types/Passport'
import type { SupportedLocale } from '@/lib/i18n/types'

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

/** Returns the language codes accessible to this user. English is always included. */
export async function getLanguageAccess(uid: string): Promise<SupportedLocale[]> {
  if (!db) return ['en']
  try {
    const ref = doc(db as Firestore, 'passport', uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) return ['en']
    const claim = snap.data()?.languageAccess as LanguageAccessClaim | undefined
    if (!claim?.codes?.length) return ['en']
    const codes: SupportedLocale[] = claim.codes.includes('en')
      ? claim.codes
      : (['en', ...claim.codes] as SupportedLocale[])
    return codes
  } catch (e) {
    console.error('getLanguageAccess:', e)
    return ['en']
  }
}

/** Grants one or more language codes to a user's passport (server-side / admin use). */
export async function grantLanguageAccess(
  uid: string,
  codes: SupportedLocale[],
  tier: LanguageAccessClaim['tier'],
): Promise<void> {
  if (!db) return
  try {
    const ref = doc(db as Firestore, 'passport', uid)
    const allCodes: SupportedLocale[] = Array.from(new Set(['en', ...codes]))
    const claim: LanguageAccessClaim = {
      codes: allCodes,
      grantedAt: new Date().toISOString(),
      tier,
    }
    await setDoc(ref, { languageAccess: claim }, { merge: true })
  } catch (e) {
    console.error('grantLanguageAccess:', e)
  }
}
