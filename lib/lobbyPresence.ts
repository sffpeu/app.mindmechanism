import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface PresenceDoc {
  uid: string
  clock_id: number
  /** null = free-run (no timer) */
  duration_mins: number | null
  is_free_run: boolean
  joined_uids: string[]
  joined_at: Date
}

/** Companion appears after this many ms with no real join */
export const COMPANION_DELAY_MS = 3 * 60 * 1000
/** Presence docs older than this are filtered out client-side */
const PRESENCE_TTL_MS = 90 * 60 * 1000

function requireDb(): Firestore {
  if (!db) throw new Error('Firestore not initialised')
  return db
}

export async function setPresence(
  uid: string,
  clockId: number,
  durationMins: number | null
): Promise<void> {
  await setDoc(doc(requireDb(), 'lobby_presence', uid), {
    uid,
    clock_id: clockId,
    duration_mins: durationMins,
    is_free_run: durationMins === null,
    joined_uids: [],
    joined_at: serverTimestamp(),
  })
}

export async function clearPresence(uid: string): Promise<void> {
  await deleteDoc(doc(requireDb(), 'lobby_presence', uid))
}

/** Record that the current user is joining someone else's broadcast */
export async function joinPresence(
  broadcasterUid: string,
  joinerUid: string
): Promise<void> {
  await updateDoc(doc(requireDb(), 'lobby_presence', broadcasterUid), {
    joined_uids: arrayUnion(joinerUid),
  })
}

export function subscribePresence(
  onChange: (docs: PresenceDoc[]) => void
): Unsubscribe {
  return onSnapshot(collection(requireDb(), 'lobby_presence'), (snap) => {
    const now = Date.now()
    const active: PresenceDoc[] = []
    for (const d of snap.docs) {
      const raw = d.data()
      const joinedAt = raw.joined_at?.toDate?.() as Date | undefined
      if (!joinedAt) continue
      if (now - joinedAt.getTime() > PRESENCE_TTL_MS) continue
      active.push({
        uid: raw.uid as string,
        clock_id: raw.clock_id as number,
        duration_mins: (raw.duration_mins as number | null) ?? null,
        is_free_run: (raw.is_free_run as boolean) ?? true,
        joined_uids: (raw.joined_uids as string[]) ?? [],
        joined_at: joinedAt,
      })
    }
    onChange(active)
  })
}
