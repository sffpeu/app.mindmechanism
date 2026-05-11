'use client'

import { usePortal } from '@/contexts/PortalContext'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { resolveNodeTier, type NodeTier } from '@/lib/nodeTiers'

export function useEffectiveNodeTier(): NodeTier {
  const { config } = usePortal()
  const { profile } = useAuth()
  return resolveNodeTier(config.nodeTier, profile?.tier)
}
