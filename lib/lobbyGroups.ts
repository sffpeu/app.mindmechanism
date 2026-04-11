import { db, waitForFirebaseAuth } from '@/lib/firebase'
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

type LobbyApiResult =
  | { mode: 'success'; groupId?: string }
  | { mode: 'fallback' }
  | { mode: 'error'; message: string }

async function getClientIdTokenForLobbyApi(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  try {
    const authInstance = await waitForFirebaseAuth(15000)
    const u = authInstance.currentUser
    if (!u) return null
    return await u.getIdToken()
  } catch {
    return null
  }
}

/** List groups via Admin (bypasses client read rules). */
async function fetchLobbyGroupsViaApi(): Promise<LobbyGroup[] | null> {
  if (typeof window === 'undefined') return null
  const idToken = await getClientIdTokenForLobbyApi()
  const headers: Record<string, string> = {}
  if (idToken) {
    headers.Authorization = `Bearer ${idToken}`
  }
  try {
    const res = await fetch(`${window.location.origin}/api/lobby/groups`, {
      method: 'GET',
      credentials: 'same-origin',
      headers,
    })
    if (res.status === 503 || res.status === 401) {
      return null
    }
    if (!res.ok) {
      return null
    }
    const json = (await res.json()) as {
      groups?: Array<{ id: string; member_uids: string[]; created_at_ms: number }>
    }
    const raw = json.groups ?? []
    return raw.map((g) => ({
      id: g.id,
      member_uids: g.member_uids.filter((u) => typeof u === 'string'),
      created_at: Timestamp.fromMillis(g.created_at_ms),
    }))
  } catch {
    return null
  }
}

/** Prefer server writes (bypasses client rules when Admin is configured). */
async function callLobbyGroupsApi(payload: {
  action: 'create' | 'join' | 'leave'
  groupId?: string
}): Promise<LobbyApiResult> {
  if (typeof window === 'undefined') {
    return { mode: 'fallback' }
  }
  const idToken = await getClientIdTokenForLobbyApi()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (idToken) {
    headers.Authorization = `Bearer ${idToken}`
  }
  try {
    const res = await fetch(`${window.location.origin}/api/lobby/groups`, {
      method: 'POST',
      credentials: 'same-origin',
      headers,
      body: JSON.stringify(payload),
    })
    // No usable session for API, or Admin rejected token — use Firestore SDK (user is still signed in there).
    if (res.status === 503 || res.status === 401) {
      return { mode: 'fallback' }
    }
    const json = (await res.json().catch(() => ({}))) as { error?: string; groupId?: string }
    if (!res.ok) {
      return { mode: 'error', message: json.error || res.statusText }
    }
    return { mode: 'success', groupId: json.groupId }
  } catch {
    return { mode: 'fallback' }
  }
}

export interface LobbyGroup {
  id: string
  member_uids: string[]
  created_at: Timestamp
}

function isFresh(createdAt: Timestamp): boolean {
  return Date.now() - createdAt.toMillis() < LOBBY_GROUP_TTL_MS
}

export async function listLobbyGroups(): Promise<LobbyGroup[]> {
  if (typeof window !== 'undefined') {
    const fromApi = await fetchLobbyGroupsViaApi()
    if (fromApi !== null) {
      return fromApi
    }
  }

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
  if (!userId) return null

  if (typeof window !== 'undefined') {
    const fromApi = await fetchLobbyGroupsViaApi()
    if (fromApi !== null) {
      return fromApi.find((g) => g.member_uids.includes(userId)) ?? null
    }
  }

  if (!db) return null

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
  if (!userId) throw new Error('User ID is required')

  const api = await callLobbyGroupsApi({ action: 'create' })
  if (api.mode === 'success' && api.groupId) {
    return api.groupId
  }
  if (api.mode === 'error') {
    throw new Error(api.message)
  }

  if (!db) throw new Error('Firestore is not initialized')

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
  if (!groupId || !userId) throw new Error('Group and user are required')

  const api = await callLobbyGroupsApi({ action: 'join', groupId })
  if (api.mode === 'success') {
    return
  }
  if (api.mode === 'error') {
    throw new Error(api.message)
  }

  if (!db) throw new Error('Firestore is not initialized')

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
  if (!groupId || !userId) throw new Error('Group and user are required')

  const api = await callLobbyGroupsApi({ action: 'leave', groupId })
  if (api.mode === 'success') {
    return
  }
  if (api.mode === 'error') {
    throw new Error(api.message)
  }

  if (!db) throw new Error('Firestore is not initialized')

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
    if (error.code === 'permission-denied') {
      return 'Lobby needs server access: add FIREBASE_SERVICE_ACCOUNT_JSON in Vercel (Project settings → Environment variables) with your Firebase service account JSON, then redeploy. Alternatively deploy Firestore rules for lobby_groups in Firebase Console.'
    }
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}
