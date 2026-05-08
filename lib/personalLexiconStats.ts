import { collection, getDocs, query, where, type Firestore } from 'firebase/firestore'
import { db } from './firebase'

/** Personal Lexicon words only — counts per wheel (0–8) for My Record. */
export async function fetchPersonalLexiconWheelCounts(uid: string): Promise<{
  total: number
  byWheel: number[]
}> {
  const byWheel = Array(9).fill(0) as number[]
  if (!db) return { total: 0, byWheel }

  const q = query(
    collection(db as Firestore, 'glossary'),
    where('source', '==', 'user'),
    where('user_id', '==', uid),
    where('personal', '==', true)
  )
  const snap = await getDocs(q)
  snap.docs.forEach((d) => {
    const data = d.data()
    const cid = typeof data.clock_id === 'number' ? data.clock_id : null
    if (cid != null && cid >= 0 && cid <= 8) {
      byWheel[cid]++
    }
  })
  return { total: snap.size, byWheel }
}
