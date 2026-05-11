import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'
import { db } from './firebase'
import { getOrCreatePassportId } from './passportIdentity'

export type CredentialType = 'completion' | 'assessment' | 'endorsement' | 'placement' | 'note'
export type CredentialStatus = 'pending' | 'accepted' | 'rejected'

export interface CredentialRequest {
  id: string
  passport_id: string
  access_request_id: string
  token: string
  issuer_name: string
  issuer_email: string
  credential_type: CredentialType
  credential_title: string
  credential_description: string
  issued_at: string
  expires_at: string | null
  metadata: Record<string, string>
  status: CredentialStatus
  requested_at: string
  responded_at: string | null
}

export interface AcceptedCredential {
  id: string
  credential_type: CredentialType
  credential_title: string
  credential_description: string
  issuer_name: string
  issuer_email: string
  issued_at: string
  accepted_at: string
  expires_at: string | null
  metadata: Record<string, string>
  access_request_id: string
  credential_request_id: string
  visible: boolean
}

type SubmitPayload = {
  passport_id: string
  access_request_id: string
  token: string
  issuer_name: string
  issuer_email: string
  credential_type: CredentialType
  credential_title: string
  credential_description: string
  issued_at: string
  expires_at?: string
  metadata?: Record<string, string>
}

// Institution-side submit (server validates token + access state).
export async function submitCredentialRequest(payload: SubmitPayload): Promise<string> {
  const res = await fetch('/api/credential-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = (await res.json().catch(() => ({}))) as { request_id?: string; error?: string }
  if (!res.ok) throw new Error(data.error ?? 'Could not submit credential')
  if (!data.request_id) throw new Error('Server response missing request_id')
  return data.request_id
}

export async function getPendingCredentialRequests(passportId: string): Promise<CredentialRequest[]> {
  if (!db || !passportId) return []
  const ref = collection(db as Firestore, 'passportCredentialRequests')
  const q = query(
    ref,
    where('passport_id', '==', passportId),
    where('status', '==', 'pending'),
    orderBy('requested_at', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CredentialRequest, 'id'>) }))
}

export async function acceptCredential(uid: string, credentialRequestId: string): Promise<void> {
  if (!db) return
  const now = new Date().toISOString()
  const passportId = await getOrCreatePassportId(uid)
  if (!passportId) throw new Error('Passport ID not available for this user')

  const reqRef = doc(db as Firestore, 'passportCredentialRequests', credentialRequestId)
  const reqSnap = await getDoc(reqRef)
  if (!reqSnap.exists()) throw new Error('Credential request not found')
  const req = reqSnap.data() as Omit<CredentialRequest, 'id'>
  if (req.passport_id !== passportId) throw new Error('This credential does not belong to your Passport')
  if (req.status !== 'pending') throw new Error('This credential request is no longer pending')

  const credRef = doc(collection(db as Firestore, 'passport', uid, 'credentials'))
  const batch = writeBatch(db as Firestore)
  batch.set(credRef, {
    credential_type: req.credential_type,
    credential_title: req.credential_title,
    credential_description: req.credential_description,
    issuer_name: req.issuer_name,
    issuer_email: req.issuer_email,
    issued_at: req.issued_at,
    accepted_at: now,
    expires_at: req.expires_at ?? null,
    metadata: req.metadata ?? {},
    access_request_id: req.access_request_id,
    credential_request_id: credentialRequestId,
    visible: true,
  })
  batch.update(reqRef, {
    status: 'accepted',
    responded_at: now,
  })
  await batch.commit()
}

export async function rejectCredential(uid: string, credentialRequestId: string): Promise<void> {
  if (!db) return
  const passportId = await getOrCreatePassportId(uid)
  if (!passportId) throw new Error('Passport ID not available for this user')

  const reqRef = doc(db as Firestore, 'passportCredentialRequests', credentialRequestId)
  const reqSnap = await getDoc(reqRef)
  if (!reqSnap.exists()) throw new Error('Credential request not found')
  const req = reqSnap.data() as Omit<CredentialRequest, 'id'>
  if (req.passport_id !== passportId) throw new Error('This credential does not belong to your Passport')
  if (req.status !== 'pending') throw new Error('This credential request is no longer pending')

  await updateDoc(reqRef, {
    status: 'rejected',
    responded_at: new Date().toISOString(),
  })
}

export async function getAcceptedCredentials(uid: string): Promise<AcceptedCredential[]> {
  if (!db) return []
  const ref = collection(db as Firestore, 'passport', uid, 'credentials')
  const q = query(ref, orderBy('accepted_at', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AcceptedCredential, 'id'>) }))
}

export async function setCredentialVisibility(uid: string, credentialId: string, visible: boolean): Promise<void> {
  if (!db) return
  const ref = doc(db as Firestore, 'passport', uid, 'credentials', credentialId)
  await updateDoc(ref, { visible })
}

