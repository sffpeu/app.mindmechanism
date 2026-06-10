import { db } from '@/lib/firebase'
import { collection, getDocs, query, orderBy, FirestoreError } from 'firebase/firestore'
import type { SavedSession } from '@/components/deck/SessionsPanel'

export type { SavedSession }

export const getUserDeckSessions = async (userId: string): Promise<SavedSession[]> => {
  try {
    if (!db) throw new Error('Firestore is not initialized')
    if (!userId) throw new Error('User ID is required')

    const q = query(
      collection(db, `users/${userId}/deckSessions`),
      orderBy('savedAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SavedSession))
  } catch (error) {
    if (error instanceof FirestoreError && error.code === 'permission-denied') {
      return []
    }
    console.error('Error fetching deck sessions:', error)
    return []
  }
}
