import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Synth lab · Mind Mechanism',
  description:
    'Play with planetary resonance in real time — a playful look at the sonic framework behind the wheels.',
}

export default function SynthLabLayout({ children }: { children: React.ReactNode }) {
  return children
}
