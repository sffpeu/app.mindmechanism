'use client'

import { useMemo, useState } from 'react'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { ResearchConsentFlow } from './ResearchConsentFlow'

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function parseIsoMs(value?: string): number | null {
  if (!value) return null
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : null
}

export function ResearchConsentTrigger() {
  const { user, profile, loading } = useAuth()
  const [dismissed, setDismissed] = useState(false)

  const shouldShow = useMemo(() => {
    if (loading || dismissed || !user) return false
    const consent = profile?.researchConsent
    if (consent?.neverAsk === true) return false

    const createdAtMs = Date.parse(user.metadata.creationTime || '')
    if (!Number.isFinite(createdAtMs)) return false
    if (Date.now() - createdAtMs < FOURTEEN_DAYS_MS) return false

    const hasCategoryBDecision = consent?.categoryB?.granted === true || consent?.categoryB?.granted === false
    const hasCategoryCDecision = consent?.categoryC?.granted === true || consent?.categoryC?.granted === false
    if (hasCategoryBDecision && hasCategoryCDecision) return false

    const lastPromptMs = parseIsoMs(consent?.lastPromptedAt)
    if (lastPromptMs !== null && Date.now() - lastPromptMs < THIRTY_DAYS_MS) return false

    return !hasCategoryBDecision && !hasCategoryCDecision
  }, [loading, dismissed, user, profile?.researchConsent])

  if (!shouldShow) return null

  return <ResearchConsentFlow open={shouldShow} onClose={() => setDismissed(true)} />
}
