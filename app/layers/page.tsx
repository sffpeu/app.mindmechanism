'use client'

import { MultiViewContent } from '@/components/MultiViewContent'
import { MvpHomePanel } from '@/components/MvpHomePanel'

export default function LayersPage() {
  return (
    <>
      <MvpHomePanel />
      <MultiViewContent type={2} />
    </>
  )
}
