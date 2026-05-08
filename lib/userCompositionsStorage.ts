/**
 * User-created loop recordings from the 16-step sequencer.
 * Stored in localStorage (compact — keep clips short).
 */

export type UserComposition = {
  id: string
  name: string
  createdAt: number
  mime: string
  /** Raw base64 (no data: prefix) */
  dataBase64: string
}

const STORAGE_KEY = 'mm-user-compositions-v1'
export const MAX_COMPOSITIONS = 10
/** Rough cap on stored payload per item (base64 expands ~4/3) */
export const MAX_COMPOSITION_BYTES = 900_000

export function loadCompositions(): UserComposition[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidComposition)
  } catch {
    return []
  }
}

function isValidComposition(x: unknown): x is UserComposition {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.createdAt === 'number' &&
    typeof o.mime === 'string' &&
    typeof o.dataBase64 === 'string'
  )
}

function saveAll(list: UserComposition[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_COMPOSITIONS)))
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onloadend = () => {
      const s = r.result as string
      const i = s.indexOf(',')
      resolve(i >= 0 ? s.slice(i + 1) : s)
    }
    r.onerror = () => reject(new Error('Could not read recording'))
    r.readAsDataURL(blob)
  })
}

export function compositionDataUrl(c: UserComposition): string {
  return `data:${c.mime};base64,${c.dataBase64}`
}

export async function addCompositionFromBlob(
  name: string,
  blob: Blob
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (typeof window === 'undefined') return { ok: false, error: 'Not available.' }
  if (blob.size > MAX_COMPOSITION_BYTES) {
    return { ok: false, error: 'Recording too large — try a shorter loop.' }
  }
  const list = loadCompositions()
  if (list.length >= MAX_COMPOSITIONS) {
    return { ok: false, error: `Library full (${MAX_COMPOSITIONS}). Delete one in Sound settings.` }
  }
  let dataBase64: string
  try {
    dataBase64 = await blobToBase64(blob)
  } catch {
    return { ok: false, error: 'Could not encode recording.' }
  }
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const comp: UserComposition = {
    id,
    name: name.trim().slice(0, 80) || 'Untitled loop',
    createdAt: Date.now(),
    mime: blob.type || 'audio/webm',
    dataBase64,
  }
  list.unshift(comp)
  saveAll(list)
  window.dispatchEvent(new CustomEvent('mm-compositions-updated'))
  return { ok: true }
}

export function deleteComposition(id: string) {
  if (typeof window === 'undefined') return
  const list = loadCompositions().filter((c) => c.id !== id)
  saveAll(list)
  window.dispatchEvent(new CustomEvent('mm-compositions-updated'))
}
