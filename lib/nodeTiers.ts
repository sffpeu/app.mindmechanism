import type { GlossaryWord } from '@/types/Glossary'

/** Master wheel band — global clock ids 1–91 (glossary may use wheel column 0–8 instead). */
export const WHEEL_MAX_CLOCK_ID = 91

export type NodeTier = 'wheel' | 'extended' | 'corporate' | 'full'

// ── To A Quiet Place Within — normalised lowercase names (brief + common spelling variants)
export const TAQPW_NODE_NAMES: Set<string> = new Set([
  'restlessness',
  'apprehension',
  'alarm',
  'doubt',
  'uncomfortable',
  'hesitation',
  'unsure',
  'seeking',
  'awareness',
  'curiosity',
  'spiritual',
  'presence',
  'spontaneity',
  'radiance',
  'bliss',
  'joyousness',
  'weightless',
  'union',
  'source',
  'infinity',
  'distraction',
  'aggravation',
  'disorientation',
  'limitation',
  'jitteriness',
  'misgivings',
  'deplorability',
  'left behind',
  'grounded',
  'core cantering',
  'core centring',
  'stability',
  'steady',
  'reflection',
  'calm',
  'peaceful',
  'assuredness',
  'self-care',
  'sanctuary',
  'process',
  'repetition',
  'isolation',
  'alienation',
  'loneliness',
  'overbearing',
  'complexity',
  'compulsion',
  'apathetic',
  'resonating',
  'empathy',
  'connection',
  'vitality',
  'wholeness',
  'heartbeat',
  'insight',
  'belonging',
  'authentic',
  'discourse',
  'universal',
  'grief',
  'sorrow',
  'heavy',
  'crippling',
  'ordeal',
  'trapped',
  'pathetic',
  'flight',
  'imagination',
  'freedom',
  'release',
  'relief',
  'soaring',
  'liberty',
  'majesty',
  'grace',
  'rebirth',
  'uplifted',
  'transcultural',
  'reminiscence',
  'chaos',
  'outrageousness',
  'pretentions',
  'confusion',
  'disdain',
  'shamefulness',
  'forbidden',
  'boldness',
  'daring',
  'achievement',
  'motivation',
  'resistance',
  'authority',
  'solid',
  'transform',
  'cherished',
  'excellence',
  'inherent right',
  'sovereignty',
])

export function isWheelNode(clockId: number | null | undefined): boolean {
  if (clockId == null) return false
  if (clockId >= 1 && clockId <= WHEEL_MAX_CLOCK_ID) return true
  /** App glossary uses wheel column indices 0–8 for default taxonomy. */
  if (clockId >= 0 && clockId <= 8) return true
  return false
}

export function isTAQPWNode(word: string | null | undefined): boolean {
  if (!word) return false
  return TAQPW_NODE_NAMES.has(word.trim().toLowerCase())
}

export function isNodeAccessible(
  clockId: number | null | undefined,
  word: string | null | undefined,
  tier: NodeTier
): boolean {
  switch (tier) {
    case 'wheel':
      return isWheelNode(clockId)
    case 'extended':
    case 'corporate':
      return isWheelNode(clockId) || isTAQPWNode(word)
    case 'full':
      return true
    default:
      return false
  }
}

export function filterNodesByTier<T extends { clock_id?: number | null; word?: string | null }>(
  nodes: T[],
  tier: NodeTier
): T[] {
  if (tier === 'full') return nodes
  return nodes.filter((n) => isNodeAccessible(n.clock_id, n.word, tier))
}

export function resolveNodeTier(portalTier: NodeTier, subscriptionTier: string | null | undefined): NodeTier {
  if (subscriptionTier === 'academic_pro') return 'full'
  return portalTier
}

/** User-owned lexicon rows are always visible regardless of taxonomy tier. */
export function isUserOwnedGlossaryWord(word: GlossaryWord, uid: string | undefined): boolean {
  if (!uid) return false
  if (word.personal === true) return true
  if (word.version === 'User') return true
  return word.source === 'user' && word.user_id === uid
}

export function isGlossaryWordAccessibleForTier(word: GlossaryWord, tier: NodeTier, uid: string | undefined): boolean {
  if (isUserOwnedGlossaryWord(word, uid)) return true
  return isNodeAccessible(word.clock_id, word.word, tier)
}

export function filterGlossaryWordsByTier(words: GlossaryWord[], tier: NodeTier, uid: string | undefined): GlossaryWord[] {
  return words.filter((w) => isGlossaryWordAccessibleForTier(w, tier, uid))
}
