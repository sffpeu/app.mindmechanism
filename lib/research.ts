import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  type Firestore,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

function requireDb(): Firestore {
  if (!db) throw new Error('Firestore not initialised')
  return db
}

export interface ResearchPaper {
  id: string
  title: string
  authors: string
  year: number
  abstract: string
  pdf_url: string
  tags: string[]
  published_at: string
}

export interface BlogCrosslink {
  id: string
  title: string
  url: string
  excerpt: string
  published_at: string
  tags: string[]
}

export async function hasResearchAccess(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(requireDb(), 'research_access', uid))
    return snap.exists()
  } catch {
    return false
  }
}

export async function getResearchPapers(): Promise<ResearchPaper[]> {
  try {
    const q = query(collection(requireDb(), 'research_papers'), orderBy('year', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ResearchPaper))
  } catch {
    return []
  }
}

export async function getBlogCrosslinks(): Promise<BlogCrosslink[]> {
  try {
    const q = query(collection(requireDb(), 'blog_crosslinks'), orderBy('published_at', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as BlogCrosslink))
  } catch {
    return []
  }
}

/** Public programme status — readable without auth (see Firestore rules). */
export interface ResearchStatusPublic {
  hypothesis: string
  status: string
  statusLabel: string
  consentingUsers: number
  languageFamiliesRepresented: number
  totalWheelAssignments: number
  thresholdUsersRequired: number
  thresholdFamiliesRequired: number
  preRegistered: boolean
  lastUpdated: string
  preRegistrationUrl: string | null
}

export async function getPublicResearchStatus(): Promise<ResearchStatusPublic | null> {
  if (!db) return null
  try {
    const snap = await getDoc(doc(db as Firestore, 'research_status', 'public'))
    if (!snap.exists()) return null
    const d = snap.data()
    const url = d.pre_registration_url
    return {
      hypothesis: typeof d.hypothesis === 'string' ? d.hypothesis : '',
      status: typeof d.status === 'string' ? d.status : 'accumulating',
      statusLabel: typeof d.status_label === 'string' ? d.status_label : 'Accumulating data',
      consentingUsers: typeof d.consenting_users === 'number' ? d.consenting_users : 0,
      languageFamiliesRepresented:
        typeof d.language_families_represented === 'number' ? d.language_families_represented : 0,
      totalWheelAssignments: typeof d.total_wheel_assignments === 'number' ? d.total_wheel_assignments : 0,
      thresholdUsersRequired: typeof d.threshold_users_required === 'number' ? d.threshold_users_required : 500,
      thresholdFamiliesRequired:
        typeof d.threshold_families_required === 'number' ? d.threshold_families_required : 8,
      preRegistered: d.pre_registered === true,
      lastUpdated: typeof d.last_updated === 'string' ? d.last_updated : '',
      preRegistrationUrl: typeof url === 'string' && url.trim() ? url.trim() : null,
    }
  } catch {
    return null
  }
}
