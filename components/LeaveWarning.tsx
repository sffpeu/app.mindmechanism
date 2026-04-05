import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function LeaveWarning() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only show warning when actually leaving the page (not during internal navigation)
      if (document.visibilityState === 'hidden') {
        e.preventDefault()
        e.returnValue = 'You are about to leave this session. Are you sure you want to continue?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  return null
} 