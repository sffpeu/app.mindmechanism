import type { Metadata } from 'next'
import { GateForm } from './GateForm'

export const metadata: Metadata = {
  title: 'Closed',
  description: '',
  robots: { index: false, follow: false },
}

export default function GatePage() {
  return <GateForm />
}
