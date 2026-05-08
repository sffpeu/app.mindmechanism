import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  setDoc,
  where,
  limit,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'
import { db } from './firebase'
import { RESEARCH_PROTOCOL_VERSION } from './researchProtocol'
import type { UserProfile } from './FirebaseAuthContext'

function binToWeek(isoString: string): string {
  const d = new Date(isoString)
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

async function hashUid(uid: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(uid + '_mm_b_2026')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 24)
}

function hasConsentB(profile: UserProfile | null): boolean {
  return profile?.researchConsent?.categoryB?.granted === true
}

async function incrementContribution(
  uid: string,
  field: 'wheel_assignment_count' | 'session_count'
): Promise<void> {
  if (!db) return
  const summaryRef = doc(db as Firestore, 'users', uid, 'researchContribution', 'summary')
  const snap = await getDoc(summaryRef)
  if (!snap.exists()) {
    await setDoc(
      summaryRef,
      {
        contributing_since: Date.now(),
      },
      { merge: true }
    )
  }
  await setDoc(
    summaryRef,
    {
      [field]: increment(1),
      last_contribution_at: Date.now(),
    },
    { merge: true }
  )
}

export interface UserContributionSummary {
  wheelAssignmentCount: number
  sessionCount: number
  contributingSince: number | null
  lastContributionAt: number | null
}

export async function getUserContributionSummary(uid: string): Promise<UserContributionSummary> {
  const empty: UserContributionSummary = {
    wheelAssignmentCount: 0,
    sessionCount: 0,
    contributingSince: null,
    lastContributionAt: null,
  }
  if (!db) return empty
  const ref = doc(db as Firestore, 'users', uid, 'researchContribution', 'summary')
  const snap = await getDoc(ref)
  if (!snap.exists()) return empty
  const d = snap.data()
  return {
    wheelAssignmentCount: typeof d.wheel_assignment_count === 'number' ? d.wheel_assignment_count : 0,
    sessionCount: typeof d.session_count === 'number' ? d.session_count : 0,
    contributingSince: typeof d.contributing_since === 'number' ? d.contributing_since : null,
    lastContributionAt: typeof d.last_contribution_at === 'number' ? d.last_contribution_at : null,
  }
}

export interface CategoryBWheelEvent {
  event_type: 'wheel_assignment'
  user_hash: string
  wheel_assigned: number
  word_language: string
  word_grade: number
  week: string
  protocol_version: string
  research_excluded: boolean
}

export interface CategoryBSessionEvent {
  event_type: 'sequencer_session'
  user_hash: string
  node_usage: Record<number, number>
  total_steps_fired: number
  week: string
  protocol_version: string
  research_excluded: boolean
}

export async function logWheelAssignment(
  uid: string,
  profile: UserProfile | null,
  payload: {
    wheelIndex: number
    language: string
    grade: number
  }
): Promise<void> {
  if (!hasConsentB(profile)) return
  if (!db) return

  const user_hash = await hashUid(uid)
  const event: CategoryBWheelEvent = {
    event_type: 'wheel_assignment',
    user_hash,
    wheel_assigned: payload.wheelIndex,
    word_language: payload.language || 'und',
    word_grade: payload.grade ?? 0,
    week: binToWeek(new Date().toISOString()),
    protocol_version: RESEARCH_PROTOCOL_VERSION,
    research_excluded: false,
  }

  const ref = collection(db as Firestore, 'research_b_events')
  await addDoc(ref, event)
  await incrementContribution(uid, 'wheel_assignment_count')
}

export async function logSequencerSession(
  uid: string,
  profile: UserProfile | null,
  payload: {
    nodeUsage: Record<number, number>
    totalStepsFired: number
  }
): Promise<void> {
  if (!hasConsentB(profile)) return
  if (!db) return
  if (payload.totalStepsFired === 0) return

  const user_hash = await hashUid(uid)
  const event: CategoryBSessionEvent = {
    event_type: 'sequencer_session',
    user_hash,
    node_usage: payload.nodeUsage,
    total_steps_fired: payload.totalStepsFired,
    week: binToWeek(new Date().toISOString()),
    protocol_version: RESEARCH_PROTOCOL_VERSION,
    research_excluded: false,
  }

  const ref = collection(db as Firestore, 'research_b_events')
  await addDoc(ref, event)
  await incrementContribution(uid, 'session_count')
}

const BATCH_SIZE = 450

export async function excludeUserResearchData(uid: string): Promise<void> {
  if (!db) return
  const user_hash = await hashUid(uid)
  const ref = collection(db as Firestore, 'research_b_events')

  // Paginate — Firestore batches cap at 500 ops
  for (;;) {
    const q = query(
      ref,
      where('user_hash', '==', user_hash),
      where('research_excluded', '==', false),
      limit(BATCH_SIZE)
    )
    const snap = await getDocs(q)
    if (snap.empty) break

    const batch = writeBatch(db as Firestore)
    snap.docs.forEach((d) => batch.update(d.ref, { research_excluded: true }))
    await batch.commit()
  }
}
