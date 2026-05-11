'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import { detectPortalFromPathname } from '@/lib/detectPortal'
import { getPortalConfig, type PortalConfig, type Portal } from '@/lib/portalConfig'

export interface PortalContextValue {
  portal: Portal
  config: PortalConfig
}

const PortalContext = createContext<PortalContextValue | null>(null)

export function PortalProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [subdomainPortal, setSubdomainPortal] = useState<Portal | null>(null)

  useEffect(() => {
    const h = typeof window !== 'undefined' ? window.location.hostname : ''
    if (h.startsWith('academic.')) setSubdomainPortal('academic')
    else if (h.startsWith('corporate.')) setSubdomainPortal('corporate')
    else setSubdomainPortal(null)
  }, [])

  const portal = useMemo<Portal>(() => {
    if (subdomainPortal) return subdomainPortal
    return detectPortalFromPathname(pathname)
  }, [pathname, subdomainPortal])

  const config = useMemo(() => getPortalConfig(portal), [portal])

  const value = useMemo(() => ({ portal, config }), [portal, config])

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>
}

export function usePortal(): PortalContextValue {
  const ctx = useContext(PortalContext)
  if (!ctx) throw new Error('usePortal must be used within PortalProvider')
  return ctx
}
