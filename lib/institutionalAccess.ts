import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  writeBatch,
  orderBy,
  type Firestore,
} from 'firebase/firestore'
import { db } from './firebase'
import type { AccessGrantDoc, AccessRequestDoc } from '@/types/InstitutionalAccess'
import { INSTITUTION_ACCESS_SCOPES } from '@/types/InstitutionalAccess'
import { getOrCreatePassportId } from './passportIdentity'
import { anchorInstitutionalAccessDecision } from './institutionalAccessAnchor'

export function isValidScope(s: string): boolean {
  return (INSTITUTION_ACCESS_SCOPES as readonly string[]).includes(s)
}

export async function listAccessRequests(uid: string): Promise<Array<{ id: string; data: AccessRequestDoc }>> {
  if (!db) return []
  const cref = collection(db as Firestore, 'passport', uid, 'accessRequests')
  const q = query(cref, orderBy('created_at', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as AccessRequestDoc }))
}

function randomGrantToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function approveAccessRequest(uid: string, requestId: string): Promise<boolean> {
  if (!db) return false
  const reqRef = doc(db as Firestore, 'passport', uid, 'accessRequests', requestId)
  const snap = await getDoc(reqRef)
  if (!snap.exists()) return false

  const data = snap.data() as AccessRequestDoc
  if (data.status !== 'pending') return false

  const respondedAt = new Date().toISOString()
  const expires = new Date()
  expires.setUTCDate(expires.getUTCDate() + Math.min(Math.max(1, data.duration_days), 730))

  const grantId = crypto.randomUUID()
  const grantToken = randomGrantToken()
  const grant: AccessGrantDoc = {
    request_id: requestId,
    grant_token: grantToken,
    scopes: data.scopes,
    expires_at: expires.toISOString(),
    approved_at: respondedAt,
  }

  const batch = writeBatch(db as Firestore)
  batch.update(reqRef, { status: 'approved' as const, responded_at: respondedAt })
  batch.set(doc(db as Firestore, 'passport', uid, 'accessGrants', grantId), grant)

  await batch.commit()

  const passportId = await getOrCreatePassportId(uid)
  if (passportId) {
    void anchorInstitutionalAccessDecision(passportId, requestId, 'approved')
  }

  return true
}

export async function listAccessGrants(uid: string): Promise<Array<{ id: string; data: AccessGrantDoc }>> {
  if (!db) return []
  const cref = collection(db as Firestore, 'passport', uid, 'accessGrants')
  const q = query(cref, orderBy('approved_at', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as AccessGrantDoc }))
}

export async function denyAccessRequest(uid: string, requestId: string): Promise<boolean> {
  if (!db) return false
  const reqRef = doc(db as Firestore, 'passport', uid, 'accessRequests', requestId)
  const snap = await getDoc(reqRef)
  if (!snap.exists()) return false

  const data = snap.data() as AccessRequestDoc
  if (data.status !== 'pending') return false

  const respondedAt = new Date().toISOString()
  const batch = writeBatch(db as Firestore)
  batch.update(reqRef, {
    status: 'denied' as const,
    responded_at: respondedAt,
  })
  await batch.commit()

  const passportId = await getOrCreatePassportId(uid)
  if (passportId) {
    void anchorInstitutionalAccessDecision(passportId, requestId, 'denied')
  }

  return true
}
