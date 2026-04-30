import { CardTable } from '@/components/deck/CardTable'

export const metadata = { title: 'Deck — Mind Mechanism' }

export default function DeckPage() {
  return (
    <main style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <CardTable />
    </main>
  )
}
