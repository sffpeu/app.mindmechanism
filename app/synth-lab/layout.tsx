import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Mixing Pot · Mind Mechanism',
  description:
    'Build your own tonal atmosphere. Drop sound elements into the pot, blend them, and save the mixture to a wheel or your session.',
}

export default function SynthLabLayout({ children }: { children: React.ReactNode }) {
  return children
}
