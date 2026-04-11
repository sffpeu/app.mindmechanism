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
  doc,
  runTransaction,
  FirestoreError,
} from 'firebase/firestore'

export const LOBBY_GROUP_MAX = 12
const COLLECTION = 'lobby_groups'
export const LOBBY_GROUP_TTL_MS = 4 * 60 * 60 * 1000

export interface LobbyGroup {
  id: string
  member_uids: string[]
  created_at: Timestamp
}

function isFresh(createdAt: Timestamp): boolean {
  return Date.now() - createdAt.toMillis() < LOBBY_GROUP_TTL_MS
}

export async function listLobbyGroups(): Promise<LobbyGroup[]> {
  if (!db) throw new Error('Firestore is not initialized')

  const q = query(collection(db, COLLECTION), orderBy('created_at', 'desc'), limit(48))
  const snapshot = await getDocs(q)
  return snapshot.docs
    .map((d) => {
      const data = d.data()
      const member_uids = Array.isArray(data.member_uids)
        ? (data.member_uids as string[]).filter((u) => typeof u === 'string')
        : []
      return {
        id: d.id,
        member_uids,
        created_at: data.created_at as Timestamp,
      }
    })
    .filter((g) => g.created_at && isFresh(g.created_at) && g.member_uids.length > 0)
}

export async function getMyLobbyGroup(userId: string): Promise<LobbyGroup | null> {
  if (!db || !userId) return null

  const q = query(
    collection(db, COLLECTION),
    where('member_uids', 'array-contains', userId),
    limit(1)
  )
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  const d = snapshot.docs[0]
  const data = d.data()
  const member_uids = Array.isArray(data.member_uids)
    ? (data.member_uids as string[]).filter((u) => typeof u === 'string')
    : []
  const created_at = data.created_at as Timestamp
  if (!created_at || !isFresh(created_at)) return null
  return { id: d.id, member_uids, created_at }
}

/** Create a new solo group. Leaves any non-solo group first. */
export async function createLobbyGroup(userId: string): Promise<string> {
  if (!db) throw new Error('Firestore is not initialized')
  if (!userId) throw new Error('User ID is required')

  const existing = await getMyLobbyGroup(userId)
  if (existing) {
    if (existing.member_uids.length === 1 && existing.member_uids[0] === userId) {
      return existing.id
    }
    await leaveLobbyGroup(existing.id, userId)
  }

  const docRef = await addDoc(collection(db, COLLECTION), {
    member_uids: [userId],
    created_at: Timestamp.now(),
  })
  return docRef.id
}

/** Leave current group if any, then append user to target group if there is room. */
export async function joinLobbyGroup(groupId: string, userId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized')
  if (!groupId || !userId) throw new Error('Group and user are required')

  const my = await getMyLobbyGroup(userId)
  if (my && my.id !== groupId) {
    await leaveLobbyGroup(my.id, userId)
  }

  const groupRef = doc(db, COLLECTION, groupId)

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(groupRef)
    if (!snap.exists()) {
      throw new Error('Group not found')
    }
    const data = snap.data()
    const members = Array.isArray(data.member_uids)
      ? (data.member_uids as unknown[]).filter((u): u is string => typeof u === 'string')
      : []
    const created_at = data.created_at as Timestamp
    if (!created_at || !isFresh(created_at)) {
      throw new Error('Group has expired')
    }
    if (members.includes(userId)) {
      return
    }
    if (members.length >= LOBBY_GROUP_MAX) {
      throw new Error('Group is full')
    }

    transaction.update(groupRef, {
      member_uids: [...members, userId],
    })
  })
}

/** Remove user from group; delete document if empty. */
export async function leaveLobbyGroup(groupId: string, userId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized')
  if (!groupId || !userId) throw new Error('Group and user are required')

  const groupRef = doc(db, COLLECTION, groupId)

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(groupRef)
    if (!snap.exists()) return
    const raw = snap.data().member_uids
    const members = Array.isArray(raw)
      ? (raw as unknown[]).filter((u): u is string => typeof u === 'string')
      : []
    if (!members.includes(userId)) return
    const next = members.filter((u) => u !== userId)
    if (next.length === 0) {
      transaction.delete(groupRef)
    } else {
      transaction.update(groupRef, { member_uids: next })
    }
  })
}

export function handleLobbyGroupError(error: unknown): string {
  if (error instanceof FirestoreError) {
    if (error.code === 'permission-denied') return 'Permission denied'
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}
