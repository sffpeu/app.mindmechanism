'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import { detectPortalFromPathname } from '@/lib/detectPortal'
import { getPortalConfig, type PortalConfig, type Portal } from '@/lib/portalConfig'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { DOORMAN_FEATURES, isDoorman } from '@/lib/doorman'

export interface PortalContextValue {
  portal: Portal
  config: PortalConfig
  isDoorman: boolean
  /** Which portal identity is being previewed (Doorman only; matches `portal` for everyone else). */
  viewingAs: Portal
  setViewingAs: (portal: Portal) => void
}

const PortalContext = createContext<PortalContextValue | null>(null)

export function PortalProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { profile } = useAuth()
  const [subdomainPortal, setSubdomainPortal] = useState<Portal | null>(null)
  const [viewingAsOverride, setViewingAsOverride] = useState<Portal | null>(null)

  useEffect(() => {
    const h = typeof window !== 'undefined' ? window.location.hostname : ''
    if (h.startsWith('academic.')) setSubdomainPortal('academic')
    else if (h.startsWith('corporate.')) setSubdomainPortal('corporate')
    else setSubdomainPortal(null)
  }, [])

  const detectedPortal = useMemo<Portal>(() => {
    if (subdomainPortal) return subdomainPortal
    return detectPortalFromPathname(pathname)
  }, [pathname, subdomainPortal])

  const doorman = isDoorman(profile?.role)

  useEffect(() => {
    if (!doorman) setViewingAsOverride(null)
  }, [doorman])

  const viewingAs: Portal = doorman ? (viewingAsOverride ?? detectedPortal) : detectedPortal

  const activePortal = viewingAs

  const baseConfig = useMemo(() => getPortalConfig(activePortal), [activePortal])

  const config: PortalConfig = useMemo(() => {
    if (!doorman) return baseConfig
    return {
      ...baseConfig,
      features: DOORMAN_FEATURES,
      nodeTier: 'full',
    }
  }, [doorman, baseConfig])

  const setViewingAs = useCallback(
    (next: Portal) => {
      if (!isDoorman(profile?.role)) return
      setViewingAsOverride(next)
    },
    [profile?.role]
  )

  const value = useMemo(
    () => ({
      portal: activePortal,
      config,
      isDoorman: doorman,
      viewingAs,
      setViewingAs,
    }),
    [activePortal, config, doorman, viewingAs, setViewingAs]
  )

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>
}

export function usePortal(): PortalContextValue {
  const ctx = useContext(PortalContext)
  if (!ctx) throw new Error('usePortal must be used within PortalProvider')
  return ctx
}
