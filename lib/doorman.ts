import type { PortalConfig } from '@/lib/portalConfig'

/** Operator-assigned Firestore `users/{uid}.role === 'doorman'` — never set from client. */
export function isDoorman(role: string | null | undefined): boolean {
  return role === 'doorman'
}

/** Doorman always gets full node access regardless of portal view. */
export function getDoormanNodeTier() {
  return 'full' as const
}

/** All record/research features on for Doorman regardless of which portal identity is being viewed. */
export const DOORMAN_FEATURES: PortalConfig['features'] = {
  showResearchDashboard: true,
  showPassportPanel: true,
  showLexiconAnchor: true,
  showNodeAffinity: true,
  showPhraseProgress: true,
  showInstitutionalAccess: true,
  showCredentials: true,
  showTeamAggregates: true,
  researchCTA: 'prominent',
}
