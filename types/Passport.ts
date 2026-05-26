import type { SupportedLocale } from '@/lib/i18n/types'
import type { Portal } from '@/lib/portalConfig'

/** Firestore document at passport/{uid} */
export interface PassportDocument {
  passport_id?: string
  key_fingerprint?: string
  silo_version?: string
  created_at?: string
  lexicon_count?: number
  languageAccess?: LanguageAccessClaim
  betaAccess?: BetaAccessClaim
}

/**
 * Beta access credential.
 * Set when a user redeems a sector-specific beta key.
 * sector maps to the portal identity the key was issued for.
 * keyCode records which of the three keys was used (for audit).
 */
export interface BetaAccessClaim {
  sector: Portal
  grantedAt: string
  keyCode: string
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
