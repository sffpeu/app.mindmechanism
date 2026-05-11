export type AccessRequestStatus = 'pending' | 'approved' | 'denied'

/** Sections an institution may request read access to (scoped grants). */
export const INSTITUTION_ACCESS_SCOPES = [
  'phrase_progress',
  'node_affinity',
  'personal_lexicon_meta',
  'research_consent_summary',
] as const

export type InstitutionAccessScope = (typeof INSTITUTION_ACCESS_SCOPES)[number]

export interface AccessRequestDoc {
  institution_name: string
  institution_contact_email: string
  purpose: string
  scopes: string[]
  duration_days: number
  status: AccessRequestStatus
  created_at: string
  responded_at?: string
}

export interface AccessGrantDoc {
  request_id: string
  grant_token: string
  scopes: string[]
  expires_at: string
  approved_at: string
}

export type AccessLogAction = 'approved' | 'denied' | 'revoked' | 'read'

export interface AccessLogEntry {
  request_id: string
  requester_name: string
  requester_email?: string
  scope: string[]
  action: AccessLogAction
  action_at: string
  expires_at?: string | null
  token_fingerprint?: string
}
