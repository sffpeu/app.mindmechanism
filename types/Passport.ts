import type { SupportedLocale } from '@/lib/i18n/types'

/** Firestore document at passport/{uid} */
export interface PassportDocument {
  passport_id?: string
  key_fingerprint?: string
  silo_version?: string
  created_at?: string
  lexicon_count?: number
  languageAccess?: LanguageAccessClaim
}

/**
 * Language access credential stored on the passport.
 * English ('en') is always available to all passport holders without this field.
 * Additional locales are added here and verified before serving locale bundles.
 */
export interface LanguageAccessClaim {
  /** ISO 639-1 codes the user has been granted access to (always includes 'en'). */
  codes: SupportedLocale[]
  /** ISO timestamp when the claim was last updated. */
  grantedAt: string
  /** The portal tier that granted the access. */
  tier: 'wheel' | 'extended' | 'corporate'
}
