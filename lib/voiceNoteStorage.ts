export type VoiceNoteTarget =
  | { kind: 'glossary'; wordId: string }
  | { kind: 'deck-card'; nodeId: string }

export type VoiceNote = {
  id: string
  target: VoiceNoteTarget
  blob: Blob
  mime: string
  durationSec: number
  label: string
  createdAt: number
  sessionContext?: string
  acousticSignature?: {
    prominenceCurve: number[]
    peakPositions: number[]
    consistencyScore: number
  }
}

const DB_NAME = 'mm-voice-notes-v1'
const STORE = 'notes'
const VERSION = 1
const MAX_NOTES_PER_TARGET = 20

let dbPromise: Promise<IDBDatabase> | null = null

function targetKey(target: VoiceNoteTarget): string {
  return target.kind === 'glossary'
    ? `glossary:${target.wordId}`
    : `deck-card:${target.nodeId}`
}

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      const store = db.createObjectStore(STORE, { keyPath: 'id' })
      store.createIndex('byTargetKey', 'targetKey', { unique: false })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
  })
  return dbPromise
}

async function withStore<T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => Promise<T> | T
): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const store = tx.objectStore(STORE)
    Promise.resolve(handler(store))
      .then((value) => {
        tx.oncomplete = () => resolve(value)
        tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'))
        tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'))
      })
      .catch(reject)
  })
}

function requestToPromise<T = unknown>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'))
  })
}

export async function saveVoiceNote(note: Omit<VoiceNote, 'id'>): Promise<string> {
  const id = crypto.randomUUID()
  const full: VoiceNote & { targetKey: string } = {
    ...note,
    id,
    targetKey: targetKey(note.target),
  }
  await withStore('readwrite', async (store) => {
    await requestToPromise(store.put(full))
  })

  const current = await getVoiceNotesForTarget(note.target)
  if (current.length > MAX_NOTES_PER_TARGET) {
    const toDelete = current
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(0, current.length - MAX_NOTES_PER_TARGET)
    await Promise.all(toDelete.map((n) => deleteVoiceNote(n.id)))
  }
  return id
}

export async function getVoiceNotesForTarget(target: VoiceNoteTarget): Promise<VoiceNote[]> {
  const key = targetKey(target)
  return withStore('readonly', async (store) => {
    const index = store.index('byTargetKey')
    const rows = (await requestToPromise(index.getAll(key))) as Array<VoiceNote & { targetKey?: string }>
    return rows
      .map(({ targetKey: _targetKey, ...rest }) => rest)
      .sort((a, b) => b.createdAt - a.createdAt)
  })
}

export async function deleteVoiceNote(id: string): Promise<void> {
  await withStore('readwrite', async (store) => {
    await requestToPromise(store.delete(id))
  })
}

export async function getVoiceNoteAudioUrl(id: string): Promise<string> {
  const note = await withStore('readonly', async (store) => {
    return (await requestToPromise(store.get(id))) as (VoiceNote & { targetKey?: string }) | undefined
  })
  if (!note?.blob) {
    throw new Error(`Voice note not found: ${id}`)
  }
  return URL.createObjectURL(note.blob)
}
