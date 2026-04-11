import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue, type Firestore, type Timestamp } from 'firebase-admin/firestore'
import { getFirebaseAdminApp } from '@/lib/firebaseAdmin'
import { LOBBY_GROUP_MAX, LOBBY_GROUP_TTL_MS } from '@/lib/lobbyGroups'

export const runtime = 'nodejs'

const COLLECTION = 'lobby_groups'

function normalizeMembers(data: Record<string, unknown> | undefined): string[] {
  const raw = data?.member_uids
  if (!Array.isArray(raw)) return []
  return raw.filter((u): u is string => typeof u === 'string')
}

function adminFresh(createdAt: Timestamp | undefined): boolean {
  if (!createdAt) return false
  return Date.now() - createdAt.toMillis() < LOBBY_GROUP_TTL_MS
}

async function verifyUid(): Promise<string | null> {
  const token = cookies().get('__firebase_auth_token')?.value
  if (!token) return null
  try {
    const app = getFirebaseAdminApp()
    const decoded = await getAuth(app).verifyIdToken(token)
    return decoded.uid
  } catch {
    return null
  }
}

function getDb(): Firestore {
  const app = getFirebaseAdminApp()
  return getFirestore(app)
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

  const uid = await verifyUid()
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { action?: string; groupId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const action = body.action

  try {
    if (action === 'create') {
      const qs = await db.collection(COLLECTION).where('member_uids', 'array-contains', uid).get()
      for (const d of qs.docs) {
        const m = normalizeMembers(d.data() as Record<string, unknown>)
        if (m.length === 1 && m[0] === uid) {
          return NextResponse.json({ groupId: d.id })
        }
      }
      for (const d of qs.docs) {
        await leaveGroupAdmin(db, d.id, uid)
      }
      const ref = await db.collection(COLLECTION).add({
        member_uids: [uid],
        created_at: FieldValue.serverTimestamp(),
      })
      return NextResponse.json({ groupId: ref.id })
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

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Request failed'
    const status = message === 'Group not found' || message === 'Group has expired' ? 404 : 400
    console.error('lobby/groups:', e)
    return NextResponse.json({ error: message }, { status })
  }
}
