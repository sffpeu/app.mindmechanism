import type { NodeTier } from '@/lib/nodeTiers'

export type Portal = 'consumer' | 'academic' | 'corporate'

export interface PortalConfig {
  id: Portal
  name: string
  tagline: string
  heroHeadline: string
  heroSubtext: string
  nodeTier: NodeTier
  features: {
    showResearchDashboard: boolean
    showPassportPanel: boolean
    showLexiconAnchor: boolean
    showNodeAffinity: boolean
    showPhraseProgress: boolean
    showInstitutionalAccess: boolean
    showCredentials: boolean
    showTeamAggregates: boolean
    researchCTA: 'none' | 'soft' | 'prominent'
  }
  copy: {
    passportLabel: string
    lexiconLabel: string
    practiceLabel: string
    recordSectionTitle: string
  }
  theme: {
    accentClass: string
  }
}

export const PORTAL_CONFIGS: Record<Portal, PortalConfig> = {
  consumer: {
    id: 'consumer',
    name: 'Mind Mechanism',
    tagline: 'Your language, your intelligence.',
    heroHeadline: 'Language intelligence that belongs to you.',
    heroSubtext: 'Build your vocabulary, track your patterns, own your record.',
    nodeTier: 'wheel',
    features: {
      showResearchDashboard: true,
      showPassportPanel: true,
      showLexiconAnchor: true,
      showNodeAffinity: true,
      showPhraseProgress: true,
      showInstitutionalAccess: true,
      showCredentials: true,
      showTeamAggregates: false,
      researchCTA: 'soft',
    },
    copy: {
      passportLabel: "Learner's Passport",
      lexiconLabel: 'Personal Vocabulary',
      practiceLabel: 'Practice',
      recordSectionTitle: 'My Record',
    },
    theme: {
      accentClass: 'text-indigo-600 dark:text-indigo-400',
    },
  },
  academic: {
    id: 'academic',
    name: 'Mind Mechanism Academic',
    tagline: 'Evidence-based language intelligence for learners and researchers.',
    heroHeadline: 'Your learning, made legible.',
    heroSubtext:
      'A structured academic record of your language development — portable, sovereign, verifiable.',
    nodeTier: 'extended',
    features: {
      showResearchDashboard: true,
      showPassportPanel: true,
      showLexiconAnchor: true,
      showNodeAffinity: true,
      showPhraseProgress: true,
      showInstitutionalAccess: true,
      showCredentials: true,
      showTeamAggregates: false,
      researchCTA: 'prominent',
    },
    copy: {
      passportLabel: 'Academic Record',
      lexiconLabel: 'Academic Vocabulary',
      practiceLabel: 'Study',
      recordSectionTitle: 'My Academic Record',
    },
    theme: {
      accentClass: 'text-emerald-600 dark:text-emerald-400',
    },
  },
  corporate: {
    id: 'corporate',
    name: 'Mind Mechanism Corporate',
    tagline: 'Language capability as organisational intelligence.',
    heroHeadline: 'Language is a leadership competency.',
    heroSubtext:
      'Track individual profiles, understand team-level capability, support evidence-based L&D decisions.',
    nodeTier: 'corporate',
    features: {
      showResearchDashboard: false,
      showPassportPanel: true,
      showLexiconAnchor: false,
      showNodeAffinity: true,
      showPhraseProgress: true,
      showInstitutionalAccess: true,
      showCredentials: true,
      showTeamAggregates: true,
      researchCTA: 'none',
    },
    copy: {
      passportLabel: 'Language Profile',
      lexiconLabel: 'Working Vocabulary',
      practiceLabel: 'Training',
      recordSectionTitle: 'My Profile',
    },
    theme: {
      accentClass: 'text-slate-700 dark:text-slate-300',
    },
  },
}

export function getPortalConfig(portal: Portal): PortalConfig {
  return PORTAL_CONFIGS[portal]
}
