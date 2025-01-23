'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the first clock by default
    router.push('/clock/0')
  }, [router])

  return null
}

