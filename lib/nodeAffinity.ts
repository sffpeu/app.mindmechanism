import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
  type Firestore,
} from 'firebase/firestore'
import { db } from './firebase'

export interface NodeAffinitySession {
  sessionId: string
  timestamp: number
  nodeFires: Record<number, number>
  totalFires: number
}

export interface NodeAffinityProfile {
  vector: number[]
  totalSessions: number
  totalFires: number
  windowDays: number
  computedAt: number
}

const WINDOW_MS = 28 * 24 * 60 * 60 * 1000

export async function logNodeAffinitySession(
  uid: string,
  nodeFires: Record<number, number>
): Promise<void> {
  if (!db) return
  const totalFires = Object.values(nodeFires).reduce((a, b) => a + b, 0)
  if (totalFires === 0) return

  const sessionId = new Date().toISOString()
  const nodePayload: Record<string, number> = {}
  for (const [k, v] of Object.entries(nodeFires)) {
    nodePayload[k] = v
  }

  await setDoc(
    doc(db as Firestore, 'users', uid, 'nodeAffinityLog', sessionId),
    {
      timestamp: Date.now(),
      nodeFires: nodePayload,
      totalFires,
    }
  )
}

export async function computeNodeAffinityProfile(uid: string): Promise<NodeAffinityProfile> {
  const empty: NodeAffinityProfile = {
    vector: Array(9).fill(0),
    totalSessions: 0,
    totalFires: 0,
    windowDays: 28,
    computedAt: Date.now(),
  }

  if (!db) return empty

  const cutoff = Date.now() - WINDOW_MS
  const ref = collection(db as Firestore, 'users', uid, 'nodeAffinityLog')
  const q = query(ref, where('timestamp', '>=', cutoff), orderBy('timestamp', 'asc'))
  const snap = await getDocs(q)

  if (snap.empty) return empty

  const totals: Record<number, number> = {}
  let grandTotal = 0
  let sessionCount = 0

  snap.docs.forEach((d) => {
    const data = d.data()
    const fires = data.nodeFires as Record<string, number> | undefined
    if (!fires) return
    Object.entries(fires).forEach(([node, count]) => {
      const n = parseInt(node, 10)
      if (Number.isNaN(n) || n < 0 || n > 8) return
      const c = typeof count === 'number' && !Number.isNaN(count) ? count : 0
      totals[n] = (totals[n] ?? 0) + c
      grandTotal += c
    })
    sessionCount++
  })

  const vector = Array.from({ length: 9 }, (_, i) =>
    grandTotal > 0 ? (totals[i] ?? 0) / grandTotal : 0
  )

  return {
    vector,
    totalSessions: sessionCount,
    totalFires: grandTotal,
    windowDays: 28,
    computedAt: Date.now(),
  }
}
