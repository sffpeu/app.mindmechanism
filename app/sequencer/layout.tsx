import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sequencer · Mind Mechanism',
  description: '16-step sample sequencer — build loops and save them to your Sound library.',
}

export default function SequencerLayout({ children }: { children: React.ReactNode }) {
  return children
}
