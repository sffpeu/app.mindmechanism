import type { Portal } from '@/lib/portalConfig'

/**
 * Path-based and env-based portal detection (hostname handled in PortalProvider after mount).
 */
export function detectPortalFromPathname(pathname: string | null | undefined): Portal {
  const p = pathname ?? ''
  if (p === '/academic' || p.startsWith('/academic/')) return 'academic'
  if (p === '/corporate' || p.startsWith('/corporate/')) return 'corporate'
  const envPortal = process.env.NEXT_PUBLIC_PORTAL
  if (envPortal === 'academic' || envPortal === 'corporate') return envPortal
  return 'consumer'
}
