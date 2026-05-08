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
