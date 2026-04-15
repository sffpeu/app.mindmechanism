import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue, type Firestore, type Timestamp } from 'firebase-admin/firestore'
import { getFirebaseAdminApp } from '@/lib/firebaseAdmin'
import {
  LOBBY_GROUP_MAX,
  LOBBY_GROUP_TTL_MS,
  memberCapFromLobbyData,
  parseFriendsMemberCapInput,
} from '@/lib/lobbyGroups'
import type { LobbySessionConfigInput, LobbySessionPlan } from '@/lib/lobbySessionConfig'
import {
  finalizeLobbySessionIndices,
  parseLobbySessionPlan,
  storedSessionMatchesInput,
  validateLobbySessionConfig,
} from '@/lib/lobbySessionConfig'
import type { LobbyScheduledGathering } from '@/lib/lobbySchedule'
import {
  normalizeScheduledGatheringsFromClient,
  parseScheduledGatheringsFromFirestore,
  scheduledGatheringsMatch,
  validateScheduledGatherings,
} from '@/lib/lobbySchedule'

export const runtime = 'nodejs'

const COLLECTION = 'lobby_groups'

function normalizeFriendsCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function normalizeMembers(data: Record<string, unknown> | undefined): string[] {
  const raw = data?.member_uids
  if (!Array.isArray(raw)) return []
  return raw.filter((u): u is string => typeof u === 'string')
}

function adminFresh(createdAt: Timestamp | undefined): boolean {
  if (!createdAt) return false
  return Date.now() - createdAt.toMillis() < LOBBY_GROUP_TTL_MS
}

async function verifyUid(request: Request): Promise<string | null> {
  const app = getFirebaseAdminApp()
  const authAdmin = getAuth(app)

  const bearer = request.headers.get('authorization')
  if (bearer?.startsWith('Bearer ')) {
    const raw = bearer.slice(7).trim()
    if (raw) {
      try {
        const decoded = await authAdmin.verifyIdToken(raw)
        return decoded.uid
      } catch {
        /* try cookie */
      }
    }
  }

  const cookieToken = cookies().get('__firebase_auth_token')?.value
  if (cookieToken) {
    try {
      const decoded = await authAdmin.verifyIdToken(cookieToken)
      return decoded.uid
    } catch {
      return null
    }
  }

  return null
}

function getDb(): Firestore {
  const app = getFirebaseAdminApp()
  return getFirestore(app)
}

export async function GET(request: Request) {
  let db: Firestore
  try {
    db = getDb()
  } catch (e) {
    console.error('lobby/groups GET: Firebase Admin not available', e)
    return NextResponse.json({ error: 'Admin unavailable' }, { status: 503 })
  }

  const uid = await verifyUid(request)
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const snap = await db.collection(COLLECTION).orderBy('created_at', 'desc').limit(48).get()
    const now = Date.now()
    const groups: Array<{
      id: string
      member_uids: string[]
      created_at_ms: number
      friends_code?: string | null
      member_cap: number
      session: LobbySessionPlan | null
      scheduled_gatherings: LobbyScheduledGathering[]
    }> = []

    for (const d of snap.docs) {
      const data = d.data() as Record<string, unknown>
      const member_uids = normalizeMembers(data)
      const ts = data.created_at as Timestamp | undefined
      if (!ts || typeof ts.toMillis !== 'function') continue
      const created_at_ms = ts.toMillis()
      if (now - created_at_ms >= LOBBY_GROUP_TTL_MS) continue
      if (member_uids.length === 0) continue
      const isMember = member_uids.includes(uid)
      const friendsCode = isMember && typeof data.friends_code === 'string' ? data.friends_code : null
      const friendsCodeForCap = typeof data.friends_code === 'string' ? data.friends_code : null
      const member_cap = memberCapFromLobbyData(data, friendsCodeForCap)
      const session = parseLobbySessionPlan(data)
      const scheduled_gatherings = parseScheduledGatheringsFromFirestore(data)
      groups.push({
        id: d.id,
        member_uids,
        created_at_ms,
        friends_code: friendsCode,
        member_cap,
        session,
        scheduled_gatherings,
      })
    }

    return NextResponse.json({ groups })
  } catch (e) {
    console.error('lobby/groups GET:', e)
    return NextResponse.json({ error: 'Failed to list groups' }, { status: 500 })
  }
}

async function leaveGroupAdmin(db: Firestore, groupId: string, uid: string): Promise<void> {
  const ref = db.collection(COLLECTION).doc(groupId)
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) return
    const members = normalizeMembers(snap.data() as Record<string, unknown>)
    if (!members.includes(uid)) return
    const next = members.filter((u) => u !== uid)
    if (next.length === 0) {
      tx.delete(ref)
    } else {
      tx.update(ref, { member_uids: next })
    }
  })
}

export async function POST(request: Request) {
  let db: Firestore
  try {
    db = getDb()
  } catch (e) {
    console.error('lobby/groups: Firebase Admin not available', e)
    return NextResponse.json(
      {
        error:
          'Lobby server writes are unavailable. Deploy Firestore rules for lobby_groups or set FIREBASE_SERVICE_ACCOUNT_JSON on Vercel.',
      },
      { status: 503 }
    )
  }

  const uid = await verifyUid(request)
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    action?: string
    groupId?: string
    friendsCode?: string
    memberCap?: number
    mandalaClockId?: number
    sessionDurationMinutes?: number
    focusNodeIndices?: number[]
    scheduledGatherings?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const action = body.action

  try {
    if (action === 'create' || action === 'create_friends') {
      const requestedFriendsCode =
        action === 'create_friends' && typeof body.friendsCode === 'string'
          ? normalizeFriendsCode(body.friendsCode)
          : ''
      if (action === 'create_friends' && requestedFriendsCode.length < 4) {
        return NextResponse.json({ error: 'Friends code must be at least 4 characters' }, { status: 400 })
      }

      let desiredCap = LOBBY_GROUP_MAX
      if (action === 'create_friends') {
        const defaultFriendsCap =
          body.memberCap !== undefined && body.memberCap !== null ? body.memberCap : LOBBY_GROUP_MAX
        const parsed = parseFriendsMemberCapInput(defaultFriendsCap)
        if (parsed === null) {
          return NextResponse.json({ error: 'Invalid friends group size' }, { status: 400 })
        }
        desiredCap = parsed
      }

      const sessionInput: LobbySessionConfigInput = {
        mandalaClockId: typeof body.mandalaClockId === 'number' ? body.mandalaClockId : NaN,
        sessionDurationMinutes:
          typeof body.sessionDurationMinutes === 'number' ? body.sessionDurationMinutes : NaN,
        focusNodeIndices: Array.isArray(body.focusNodeIndices)
          ? body.focusNodeIndices.filter((n): n is number => typeof n === 'number' && Number.isInteger(n))
          : [],
      }
      const sessionErr = validateLobbySessionConfig(sessionInput)
      if (sessionErr) {
        return NextResponse.json({ error: sessionErr }, { status: 400 })
      }
      const finalized = finalizeLobbySessionIndices(sessionInput)
      const normalizedGatherings = normalizeScheduledGatheringsFromClient(body.scheduledGatherings ?? [])
      const schedErr = validateScheduledGatherings(normalizedGatherings)
      if (schedErr) {
        return NextResponse.json({ error: schedErr }, { status: 400 })
      }

      const qs = await db.collection(COLLECTION).where('member_uids', 'array-contains', uid).get()
      for (const d of qs.docs) {
        const m = normalizeMembers(d.data() as Record<string, unknown>)
        const row = d.data() as Record<string, unknown>
        const existingCode = row.friends_code
        const codeMatch =
          ((typeof existingCode === 'string' ? existingCode : '') || '') === requestedFriendsCode
        const existingCap = memberCapFromLobbyData(
          row,
          typeof existingCode === 'string' && existingCode.length > 0 ? existingCode : null
        )
        const capMatch = existingCap === desiredCap
        const sessionMatch = storedSessionMatchesInput(row, sessionInput, finalized)
        const schedMatch = scheduledGatheringsMatch(
          parseScheduledGatheringsFromFirestore(row),
          normalizedGatherings
        )
        if (m.length === 1 && m[0] === uid && codeMatch && capMatch && sessionMatch && schedMatch) {
          return NextResponse.json({ groupId: d.id, friendsCode: requestedFriendsCode || null })
        }
      }
      for (const d of qs.docs) {
        await leaveGroupAdmin(db, d.id, uid)
      }
      const ref = await db.collection(COLLECTION).add({
        member_uids: [uid],
        created_at: FieldValue.serverTimestamp(),
        friends_code: requestedFriendsCode || null,
        member_cap: desiredCap,
        mandala_clock_id: sessionInput.mandalaClockId,
        session_duration_minutes: sessionInput.sessionDurationMinutes,
        focus_node_indices: finalized,
        creator_uid: uid,
        scheduled_gatherings: normalizedGatherings,
      })
      return NextResponse.json({ groupId: ref.id, friendsCode: requestedFriendsCode || null })
    }

    if (action === 'join') {
      const groupId = body.groupId
      if (!groupId || typeof groupId !== 'string') {
        return NextResponse.json({ error: 'groupId required' }, { status: 400 })
      }

      const mine = await db.collection(COLLECTION).where('member_uids', 'array-contains', uid).get()
      for (const d of mine.docs) {
        if (d.id !== groupId) {
          await leaveGroupAdmin(db, d.id, uid)
        }
      }

      const ref = db.collection(COLLECTION).doc(groupId)
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref)
        if (!snap.exists) {
          throw new Error('Group not found')
        }
        const data = snap.data() as Record<string, unknown>
        const members = normalizeMembers(data)
        const createdAt = data.created_at as Timestamp | undefined
        if (!adminFresh(createdAt)) {
          throw new Error('Group has expired')
        }
        if (members.includes(uid)) {
          return
        }
        const friendsForCap = typeof data.friends_code === 'string' ? data.friends_code : null
        const cap = memberCapFromLobbyData(data, friendsForCap)
        if (members.length >= cap) {
          throw new Error('Group is full')
        }
        tx.update(ref, { member_uids: [...members, uid] })
      })
      return NextResponse.json({ ok: true })
    }

    if (action === 'leave') {
      const groupId = body.groupId
      if (!groupId || typeof groupId !== 'string') {
        return NextResponse.json({ error: 'groupId required' }, { status: 400 })
      }
      await leaveGroupAdmin(db, groupId, uid)
      return NextResponse.json({ ok: true })
    }

    if (action === 'join_code') {
      const requestedFriendsCode =
        typeof body.friendsCode === 'string' ? normalizeFriendsCode(body.friendsCode) : ''
      if (!requestedFriendsCode) {
        return NextResponse.json({ error: 'friendsCode required' }, { status: 400 })
      }

      const candidateSnap = await db
        .collection(COLLECTION)
        .where('friends_code', '==', requestedFriendsCode)
        .limit(8)
        .get()
      if (candidateSnap.empty) {
        return NextResponse.json({ error: 'Friends group not found' }, { status: 404 })
      }

      let selectedId: string | null = null
      for (const docSnap of candidateSnap.docs) {
        const data = docSnap.data() as Record<string, unknown>
        const members = normalizeMembers(data)
        const createdAt = data.created_at as Timestamp | undefined
        if (!adminFresh(createdAt)) continue
        const cap = memberCapFromLobbyData(data, requestedFriendsCode)
        if (members.length >= cap && !members.includes(uid)) continue
        selectedId = docSnap.id
        break
      }
      if (!selectedId) {
        return NextResponse.json({ error: 'Friends group is unavailable' }, { status: 404 })
      }

      const mine = await db.collection(COLLECTION).where('member_uids', 'array-contains', uid).get()
      for (const d of mine.docs) {
        if (d.id !== selectedId) {
          await leaveGroupAdmin(db, d.id, uid)
        }
      }

      const ref = db.collection(COLLECTION).doc(selectedId)
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref)
        if (!snap.exists) throw new Error('Friends group not found')
        const data = snap.data() as Record<string, unknown>
        const members = normalizeMembers(data)
        const createdAt = data.created_at as Timestamp | undefined
        if (!adminFresh(createdAt)) throw new Error('Group has expired')
        if (members.includes(uid)) return
        const cap = memberCapFromLobbyData(data, requestedFriendsCode)
        if (members.length >= cap) throw new Error('Group is full')
        tx.update(ref, { member_uids: [...members, uid] })
      })
      return NextResponse.json({ ok: true, groupId: selectedId })
    }

    if (action === 'update_schedule') {
      const groupId = body.groupId
      if (!groupId || typeof groupId !== 'string') {
        return NextResponse.json({ error: 'groupId required' }, { status: 400 })
      }
      const normalizedGatherings = normalizeScheduledGatheringsFromClient(body.scheduledGatherings ?? [])
      const schedErr = validateScheduledGatherings(normalizedGatherings)
      if (schedErr) {
        return NextResponse.json({ error: schedErr }, { status: 400 })
      }

      const ref = db.collection(COLLECTION).doc(groupId)
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref)
        if (!snap.exists) throw new Error('Group not found')
        const data = snap.data() as Record<string, unknown>
        const members = normalizeMembers(data)
        if (!members.includes(uid)) throw new Error('Not in this group')
        const creator = data.creator_uid
        const isCreator = creator === uid || (creator == null && members[0] === uid)
        if (!isCreator) throw new Error('Only the group creator can edit the schedule')
        const createdAt = data.created_at as Timestamp | undefined
        if (!adminFresh(createdAt)) throw new Error('Group has expired')
        tx.update(ref, { scheduled_gatherings: normalizedGatherings })
      })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Request failed'
    const status = message === 'Group not found' || message === 'Group has expired' ? 404 : 400
    console.error('lobby/groups:', e)
    return NextResponse.json({ error: message }, { status })
  }
}
