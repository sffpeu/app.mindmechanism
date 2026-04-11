import { db } from '@/lib/firebase'
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  increment,
  FirestoreError,
} from 'firebase/firestore'

const COLLECTION = 'symbolic_lobby'
/** Entries older than this are ignored in the UI */
export const LOBBY_ENTRY_TTL_MS = 4 * 60 * 60 * 1000

export interface SymbolicLobbyEntry {
  id: string
  created_at: Timestamp
  symbolic_alignments: number
  /** Present in Firestore for rules; never shown in the lobby UI */
  owner_uid: string
}

function isFresh(createdAt: Timestamp): boolean {
  return Date.now() - createdAt.toMillis() < LOBBY_ENTRY_TTL_MS
}

export async function listLobbyEntries(): Promise<SymbolicLobbyEntry[]> {
  if (!db) throw new Error('Firestore is not initialized')

  const q = query(
    collection(db, COLLECTION),
    orderBy('created_at', 'desc'),
    limit(48)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs
    .map((d) => {
      const data = d.data()
      return {
        id: d.id,
        created_at: data.created_at as Timestamp,
        symbolic_alignments: typeof data.symbolic_alignments === 'number' ? data.symbolic_alignments : 0,
        owner_uid: data.owner_uid as string,
      }
    })
    .filter((e) => e.created_at && isFresh(e.created_at))
}

export async function getMyPresenceEntry(
  userId: string
): Promise<SymbolicLobbyEntry | null> {
  if (!db || !userId) return null

  const q = query(collection(db, COLLECTION), where('owner_uid', '==', userId))
  const snapshot = await getDocs(q)
  for (const d of snapshot.docs) {
    const data = d.data()
    const created_at = data.created_at as Timestamp
    if (!created_at || !isFresh(created_at)) continue
    return {
      id: d.id,
      created_at,
      symbolic_alignments:
        typeof data.symbolic_alignments === 'number' ? data.symbolic_alignments : 0,
      owner_uid: data.owner_uid as string,
    }
  }
  return null
}

/** Remove stale or duplicate presence rows for this user (best-effort cleanup). */
async function deleteAllMyEntries(userId: string): Promise<void> {
  if (!db) return
  const q = query(collection(db, COLLECTION), where('owner_uid', '==', userId))
  const snapshot = await getDocs(q)
  await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)))
}

export async function appearInLobby(userId: string): Promise<string> {
  if (!db) throw new Error('Firestore is not initialized')
  if (!userId) throw new Error('User ID is required')

  const existing = await getMyPresenceEntry(userId)
  if (existing) return existing.id

  await deleteAllMyEntries(userId)

  const docRef = await addDoc(collection(db, COLLECTION), {
    owner_uid: userId,
    created_at: Timestamp.now(),
    symbolic_alignments: 0,
  })
  return docRef.id
}

export async function withdrawFromLobby(entryId: string, userId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized')
  if (!entryId || !userId) throw new Error('Entry and user are required')

  const ref = doc(db, COLLECTION, entryId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Entry not found')
  if (snap.data().owner_uid !== userId) throw new Error('Not your presence entry')
  await deleteDoc(ref)
}

export async function alignSymbolically(entryId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized')
  if (!entryId) throw new Error('Entry ID is required')

  try {
    await updateDoc(doc(db, COLLECTION, entryId), {
      symbolic_alignments: increment(1),
    })
  } catch (error) {
    console.error('alignSymbolically:', error)
    if (error instanceof FirestoreError) {
      if (error.code === 'permission-denied') {
        throw new Error('Could not record symbolic alignment')
      }
    }
    throw error
  }
}
