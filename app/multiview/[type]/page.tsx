'use client'

import { useParams } from 'next/navigation'
import { MultiViewContent } from '@/components/MultiViewContent'

export default function MultiViewPage() {
  const params = useParams()
  const type = parseInt(params.type as string)
  return <MultiViewContent type={type} />
}
