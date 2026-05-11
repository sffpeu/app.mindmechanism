'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '@/lib/FirebaseAuthContext'
import {
  generatePassportKey,
  getOrCreatePassportKey,
  getKeyFingerprint,
  loadKey,
} from '@/lib/passportCrypto'

export interface PassportKeyContextValue {
  key: CryptoKey | null
  fingerprint: string | null
  ready: boolean
  regenerate: () => Promise<void>
  refreshFromIdb: () => Promise<void>
}

const PassportKeyContext = createContext<PassportKeyContextValue>({
  key: null,
  fingerprint: null,
  ready: false,
  regenerate: async () => {},
  refreshFromIdb: async () => {},
})

export function PassportKeyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [key, setKey] = useState<CryptoKey | null>(null)
  const [fingerprint, setFingerprint] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!user?.uid) {
      setKey(null)
      setFingerprint(null)
      setReady(false)
      return
    }

    getOrCreatePassportKey()
      .then(async (k) => {
        setKey(k)
        setFingerprint(await getKeyFingerprint(k))
        setReady(true)
      })
      .catch(() => {
        setKey(null)
        setReady(true)
      })
  }, [user?.uid])

  const regenerate = useCallback(async () => {
    const k = await generatePassportKey()
    setKey(k)
    setFingerprint(await getKeyFingerprint(k))
  }, [])

  const refreshFromIdb = useCallback(async () => {
    if (!user?.uid) {
      setKey(null)
      setFingerprint(null)
      setReady(false)
      return
    }
    const k = await loadKey()
    setKey(k)
    setFingerprint(k ? await getKeyFingerprint(k) : null)
    setReady(true)
  }, [user?.uid])

  return (
    <PassportKeyContext.Provider value={{ key, fingerprint, ready, regenerate, refreshFromIdb }}>
      {children}
    </PassportKeyContext.Provider>
  )
}

export function usePassportKey(): PassportKeyContextValue {
  return useContext(PassportKeyContext)
}
