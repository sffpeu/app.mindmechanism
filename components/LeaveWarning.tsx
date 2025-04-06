import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function LeaveWarning() {
  const router = useRouter()

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'You are about to leave this session. Are you sure you want to continue?'
      return e.returnValue
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  return null
} 