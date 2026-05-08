'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NodesPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/1')
  }, [router])

  return null
} 