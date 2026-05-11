const KEY_STORE_NAME = 'mm-passport-keys'
const KEY_ID = 'passport-encryption-key'
const DB_NAME = 'mm-passport'
const DB_VERSION = 1

function openKeyDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(KEY_STORE_NAME)) {
        req.result.createObjectStore(KEY_STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function storeKey(key: CryptoKey): Promise<void> {
  const db = await openKeyDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KEY_STORE_NAME, 'readwrite')
    tx.objectStore(KEY_STORE_NAME).put(key, KEY_ID)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadKey(): Promise<CryptoKey | null> {
  const db = await openKeyDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KEY_STORE_NAME, 'readonly')
    const req = tx.objectStore(KEY_STORE_NAME).get(KEY_ID)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function hasPassportKey(): Promise<boolean> {
  return (await loadKey()) !== null
}

export async function generatePassportKey(): Promise<CryptoKey> {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
  await storeKey(key)
  return key
}

export async function getOrCreatePassportKey(): Promise<CryptoKey> {
  const existing = await loadKey()
  if (existing) return existing
  return generatePassportKey()
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i)
  }
  return out
}

export async function exportKeyAsBase64(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key)
  return bytesToBase64(new Uint8Array(raw))
}

export async function importKeyFromBase64(b64: string): Promise<CryptoKey> {
  const raw = base64ToBytes(b64.trim())
  const keyMaterial = new Uint8Array(raw).buffer
  const key = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
  await storeKey(key)
  return key
}

export async function encryptField(plaintext: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)
  return bytesToBase64(combined)
}

export async function decryptField(encrypted: string, key: CryptoKey): Promise<string> {
  const combined = base64ToBytes(encrypted.trim())
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}

export function downloadKeyBackup(b64Key: string): void {
  const backup = JSON.stringify(
    {
      mm_passport_key: b64Key,
      exported_at: new Date().toISOString(),
      note: 'Keep this file safe. It is the only way to recover your encrypted personal vocabulary if you clear your browser data.',
      instructions: 'To restore: Settings → My Record → Restore encryption key → select this file.',
    },
    null,
    2
  )
  const blob = new Blob([backup], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mm-passport-key-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function getKeyFingerprint(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key)
  const hash = await crypto.subtle.digest('SHA-256', raw)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 8)
}
