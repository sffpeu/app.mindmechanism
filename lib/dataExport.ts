import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
  type Firestore,
} from 'firebase/firestore'
import { db } from './firebase'
import { getUserPhraseSummaries, getPhraseSessionHistory } from './phraseProgress'
import { RESEARCH_PROTOCOL_VERSION } from './researchProtocol'
import type { ResearchConsent, UserProfile } from './FirebaseAuthContext'

export interface PersonalLexiconEntry {
  word: string
  own_definition: string | null
  context: string | null
  phonetic: string | null
  wheel: number | null
  language: string | null
  relationship: '+' | '-' | '~' | null
  created_at: string
}

export interface PhraseProgressExport {
  phrase: string
  ipa_text: string
  session_count: number
  best_score: number
  latest_score: number
  first_session_at: string
  latest_session_at: string
  sessions: {
    session_id: string
    consistency_score: number
    rhythm_match_pct: number
    stress_hit_count: number
    stress_miss_count: number
    recorded_at: string
  }[]
}

export interface NodeAffinityLogEntry {
  recorded_at: string
  node_fires: Record<string, number>
  total_fires: number
}

export interface ResearchConsentExport {
  category_b: {
    granted: boolean
    timestamp: string
    protocol_version: string
  } | null
  category_c: {
    granted: boolean
    timestamp: string
    protocol_version: string
  } | null
  note: string
}

export interface UserDataExport {
  exported_at: string
  protocol_version: string
  account: {
    username: string
    tier: string
    member_since: string | null
  }
  personal_lexicon: PersonalLexiconEntry[]
  phrase_progress: PhraseProgressExport[]
  node_affinity_log: NodeAffinityLogEntry[]
  research_consent: ResearchConsentExport
  export_notes: string[]
}

function mapConsentSlice(raw: ResearchConsent | undefined): ResearchConsentExport['category_b'] {
  if (!raw) return null
  return {
    granted: raw.granted,
    timestamp: raw.timestamp,
    protocol_version: raw.protocolVersion,
  }
}

export async function exportUserData(
  uid: string,
  profile: Pick<UserProfile, 'username' | 'tier'> | null,
  authCreationTime: string | undefined
): Promise<void> {
  if (!db) {
    throw new Error('Database is not available.')
  }
  if (typeof document === 'undefined') {
    throw new Error('Export must run in the browser.')
  }

  const glossaryRef = collection(db as Firestore, 'glossary')
  const lexiconQuery = query(
    glossaryRef,
    where('source', '==', 'user'),
    where('user_id', '==', uid),
    where('personal', '==', true)
  )
  const lexiconSnap = await getDocs(lexiconQuery)

  const personalLexicon: PersonalLexiconEntry[] = lexiconSnap.docs
    .map((d) => d.data())
    .map((d) => {
      const rating = d.rating
      const rel: '+' | '-' | '~' | null =
        rating === '+' || rating === '-' || rating === '~' ? rating : null
      const cid = typeof d.clock_id === 'number' ? d.clock_id : null
      return {
        word: typeof d.word === 'string' ? d.word : '',
        own_definition: typeof d.own_definition === 'string' ? d.own_definition : null,
        context: typeof d.context === 'string' ? d.context : null,
        phonetic:
          typeof d.phonetic_spelling === 'string'
            ? d.phonetic_spelling
            : typeof (d as { phonetic?: string }).phonetic === 'string'
              ? (d as { phonetic: string }).phonetic
              : null,
        wheel: cid !== null && cid >= 0 && cid <= 8 ? cid : null,
        language: typeof d.language === 'string' ? d.language : null,
        relationship: rel,
        created_at: typeof d.created_at === 'string' ? d.created_at : '',
      }
    })
    .sort((a, b) => a.created_at.localeCompare(b.created_at))

  const summaries = await getUserPhraseSummaries(uid)
  const phraseProgressExport: PhraseProgressExport[] = await Promise.all(
    summaries.map(async (s) => {
      const sessions = await getPhraseSessionHistory(uid, s.phraseHash, 200)
      return {
        phrase: s.phrase,
        ipa_text: s.ipaText,
        session_count: s.sessionCount,
        best_score: s.bestScore,
        latest_score: s.latestScore,
        first_session_at: new Date(s.firstSessionAt).toISOString(),
        latest_session_at: new Date(s.latestSessionAt).toISOString(),
        sessions: sessions.map((sess) => ({
          session_id: sess.sessionId,
          consistency_score: sess.consistencyScore,
          rhythm_match_pct: sess.rhythmMatchPct,
          stress_hit_count: sess.stressHitCount,
          stress_miss_count: sess.stressMissCount,
          recorded_at: new Date(sess.createdAt).toISOString(),
        })),
      }
    })
  )

  const affinityRef = collection(db as Firestore, 'users', uid, 'nodeAffinityLog')
  const affinitySnap = await getDocs(query(affinityRef, orderBy('timestamp', 'asc')))
  const affinityLog: NodeAffinityLogEntry[] = affinitySnap.docs.map((d) => {
    const data = d.data()
    const ts = data.timestamp
    const t =
      typeof ts === 'number'
        ? ts
        : ts && typeof ts === 'object' && 'toMillis' in ts
          ? (ts as { toMillis: () => number }).toMillis()
          : Date.now()
    return {
      recorded_at: new Date(t).toISOString(),
      node_fires: (data.nodeFires as Record<string, number>) ?? {},
      total_fires: typeof data.totalFires === 'number' ? data.totalFires : 0,
    }
  })

  const userRef = doc(db as Firestore, 'users', uid)
  const userSnap = await getDoc(userRef)
  const consent = userSnap.exists() ? (userSnap.data().researchConsent as UserProfile['researchConsent']) : null

  const consentExport: ResearchConsentExport = {
    category_b: mapConsentSlice(consent?.categoryB),
    category_c: mapConsentSlice(consent?.categoryC),
    note:
      'Research data contributed under these consent records is held separately in anonymised, aggregated form and is not included in this export.',
  }

  const exportData: UserDataExport = {
    exported_at: new Date().toISOString(),
    protocol_version: RESEARCH_PROTOCOL_VERSION,
    account: {
      username: profile?.username ?? '',
      tier: profile?.tier ?? 'open',
      member_since: authCreationTime ?? null,
    },
    personal_lexicon: personalLexicon,
    phrase_progress: phraseProgressExport,
    node_affinity_log: affinityLog,
    research_consent: consentExport,
    export_notes: [
      'Voice recordings are stored on your device only and are not included in this export.',
      'Anonymised research contributions (wheel assignments, session patterns) are held separately and cannot be retrieved individually — they are not linked to your identity in the research dataset.',
      'This export satisfies your right to data portability under GDPR Art. 20.',
    ],
  }

  const json = JSON.stringify(exportData, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mindmechanism-record-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
