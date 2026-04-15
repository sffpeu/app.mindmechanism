import { db, waitForFirebaseAuth } from '@/lib/firebase'
import type { LobbySessionConfigInput, LobbySessionPlan } from '@/lib/lobbySessionConfig'
import {
  finalizeLobbySessionIndices,
  parseLobbySessionPlan,
  storedSessionMatchesInput,
  validateLobbySessionConfig,
} from '@/lib/lobbySessionConfig'
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
  getDoc,
  runTransaction,
  FirestoreError,
} from 'firebase/firestore'

export const LOBBY_GROUP_MAX = 12
const COLLECTION = 'lobby_groups'
export const LOBBY_GROUP_TTL_MS = 4 * 60 * 60 * 1000

type LobbyApiResult =
  | { mode: 'success'; groupId?: string; friendsCode?: string }
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
      groups?: Array<{
        id: string
        member_uids: string[]
        created_at_ms: number
        friends_code?: string | null
        session?: LobbySessionPlan | null
      }>
    }
    const raw = json.groups ?? []
    return raw.map((g) => ({
      id: g.id,
      member_uids: g.member_uids.filter((u) => typeof u === 'string'),
      created_at: Timestamp.fromMillis(g.created_at_ms),
      friends_code: typeof g.friends_code === 'string' ? g.friends_code : null,
      session: g.session ?? null,
    }))
  } catch {
    return null
  }
}

/** Prefer server writes (bypasses client rules when Admin is configured). */
async function callLobbyGroupsApi(payload: {
  action: 'create' | 'create_friends' | 'join' | 'join_code' | 'leave'
  groupId?: string
  friendsCode?: string
  mandalaClockId?: number
  sessionDurationMinutes?: number
  focusNodeIndices?: number[]
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
    const json = (await res.json().catch(() => ({}))) as { error?: string; groupId?: string; friendsCode?: string }
    if (!res.ok) {
      return { mode: 'error', message: json.error || res.statusText }
    }
    return { mode: 'success', groupId: json.groupId, friendsCode: json.friendsCode }
  } catch {
    return { mode: 'fallback' }
  }
}

export interface LobbyGroup {
  id: string
  member_uids: string[]
  created_at: Timestamp
  friends_code?: string | null
  session: LobbySessionPlan | null
}

function sessionFromFirestoreData(data: Record<string, unknown>): LobbySessionPlan | null {
  return parseLobbySessionPlan(data)
}

export function normalizeFriendsCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function generateFriendsCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
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
        friends_code: typeof data.friends_code === 'string' ? data.friends_code : null,
        session: sessionFromFirestoreData(data as Record<string, unknown>),
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
  return {
    id: d.id,
    member_uids,
    created_at,
    friends_code: typeof data.friends_code === 'string' ? data.friends_code : null,
    session: sessionFromFirestoreData(data as Record<string, unknown>),
  }
}

/** Create a new solo group. Leaves any non-solo group first. */
export async function createLobbyGroup(
  userId: string,
  session: LobbySessionConfigInput,
  options?: { friendsCode?: string | null }
): Promise<string> {
  if (!userId) throw new Error('User ID is required')
  const err = validateLobbySessionConfig(session)
  if (err) throw new Error(err)
  const finalized = finalizeLobbySessionIndices(session)
  const normalizedCode = options?.friendsCode ? normalizeFriendsCode(options.friendsCode) : ''

  const api = await callLobbyGroupsApi(
    normalizedCode
      ? {
          action: 'create_friends',
          friendsCode: normalizedCode,
          mandalaClockId: session.mandalaClockId,
          sessionDurationMinutes: session.sessionDurationMinutes,
          focusNodeIndices: finalized,
        }
      : {
          action: 'create',
          mandalaClockId: session.mandalaClockId,
          sessionDurationMinutes: session.sessionDurationMinutes,
          focusNodeIndices: finalized,
        }
  )
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
      const existingSnap = await getDoc(doc(db, COLLECTION, existing.id))
      const raw = existingSnap.data() as Record<string, unknown> | undefined
      const codeOk =
        ((typeof raw?.friends_code === 'string' ? raw.friends_code : '') || '') === normalizedCode
      if (raw && codeOk && storedSessionMatchesInput(raw, session, finalized)) {
        return existing.id
      }
    }
    await leaveLobbyGroup(existing.id, userId)
  }

  const docRef = await addDoc(collection(db, COLLECTION), {
    member_uids: [userId],
    created_at: Timestamp.now(),
    friends_code: normalizedCode || null,
    mandala_clock_id: session.mandalaClockId,
    session_duration_minutes: session.sessionDurationMinutes,
    focus_node_indices: finalized,
    creator_uid: userId,
  })
  return docRef.id
}

export async function createFriendsLobbyGroup(
  userId: string,
  session: LobbySessionConfigInput,
  requestedCode?: string
): Promise<{ groupId: string; friendsCode: string }> {
  const friendsCode = normalizeFriendsCode(requestedCode || generateFriendsCode())
  if (friendsCode.length < 4) {
    throw new Error('Friends code must be at least 4 characters')
  }
  const groupId = await createLobbyGroup(userId, session, { friendsCode })
  return { groupId, friendsCode }
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

export async function joinLobbyGroupByFriendsCode(
  code: string,
  userId: string
): Promise<void> {
  const friendsCode = normalizeFriendsCode(code)
  if (!friendsCode) throw new Error('Friends code is required')

  const api = await callLobbyGroupsApi({ action: 'join_code', friendsCode })
  if (api.mode === 'success') {
    return
  }
  if (api.mode === 'error') {
    throw new Error(api.message)
  }

  if (!db) throw new Error('Firestore is not initialized')
  const q = query(
    collection(db, COLLECTION),
    where('friends_code', '==', friendsCode),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) throw new Error('Friends group not found')
  const target = snap.docs[0]
  await joinLobbyGroup(target.id, userId)
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
      return 'Missing or insufficient permissions.'
    }
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}

/** Same as handleLobbyGroupError, plus server hints from /api/lobby/admin-config. */
export async function handleLobbyGroupErrorWithHints(error: unknown): Promise<string> {
  const base = handleLobbyGroupError(error)
  if (!(error instanceof FirestoreError) || error.code !== 'permission-denied') {
    return base
  }

  try {
    const res = await fetch('/api/lobby/admin-config', {
      credentials: 'same-origin',
    })
    if (!res.ok) return `${base} Open Firebase Console → Firestore → Rules → copy firestore.rules from GitHub → Publish (lobby_groups must allow read/write for signed-in users).`

    const j = (await res.json()) as {
      anyServiceAccountEnv?: boolean
      serviceAccountProjectId?: string | null
      clientProjectId?: string | null
      projectIdMismatch?: boolean
    }

    const parts = [base]

    if (j.projectIdMismatch) {
      parts.push(
        ` Service account project_id (${j.serviceAccountProjectId}) does not match NEXT_PUBLIC_FIREBASE_PROJECT_ID (${j.clientProjectId}). Download a new key from the same Firebase project as the web app.`
      )
    } else if (!j.anyServiceAccountEnv) {
      parts.push(
        ' Vercel has no FIREBASE_SERVICE_ACCOUNT_BASE64 (or JSON). Add it and Redeploy — or publish Firestore rules in Firebase Console (Firestore → Rules) from this repo’s firestore.rules.'
      )
    } else if (!j.serviceAccountProjectId) {
      parts.push(
        ' Vercel has a service account variable but it does not parse as JSON — recreate FIREBASE_SERVICE_ACCOUNT_BASE64 (base64 -i key.json | tr -d "\\n" | pbcopy) and redeploy.'
      )
    } else {
      parts.push(
        ' Publish Firestore rules: Firebase Console → your project → Firestore → Rules → paste rules from GitHub (include lobby_groups) → Publish.'
      )
    }

    return parts.join('')
  } catch {
    return `${base} Publish Firestore rules (Firebase Console → Firestore → Rules) from this repo’s firestore.rules, or set FIREBASE_SERVICE_ACCOUNT_BASE64 on Vercel and redeploy.`
  }
}
