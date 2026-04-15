import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue, type Firestore, type Timestamp } from 'firebase-admin/firestore'
import { getFirebaseAdminApp } from '@/lib/firebaseAdmin'
import { LOBBY_GROUP_MAX, LOBBY_GROUP_TTL_MS } from '@/lib/lobbyGroups'

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
      groups.push({ id: d.id, member_uids, created_at_ms, friends_code: friendsCode })
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

  let body: { action?: string; groupId?: string; friendsCode?: string }
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
      const qs = await db.collection(COLLECTION).where('member_uids', 'array-contains', uid).get()
      for (const d of qs.docs) {
        const m = normalizeMembers(d.data() as Record<string, unknown>)
        const existingCode = d.data().friends_code
        if (
          m.length === 1 &&
          m[0] === uid &&
          ((typeof existingCode === 'string' ? existingCode : '') || '') === requestedFriendsCode
        ) {
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
        if (members.length >= LOBBY_GROUP_MAX) {
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
        if (members.length >= LOBBY_GROUP_MAX && !members.includes(uid)) continue
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
        if (members.length >= LOBBY_GROUP_MAX) throw new Error('Group is full')
        tx.update(ref, { member_uids: [...members, uid] })
      })
      return NextResponse.json({ ok: true, groupId: selectedId })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Request failed'
    const status = message === 'Group not found' || message === 'Group has expired' ? 404 : 400
    console.error('lobby/groups:', e)
    return NextResponse.json({ error: message }, { status })
  }
}
