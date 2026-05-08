'use client'

import { useCallback, useEffect, useState } from 'react'
import { collection, deleteDoc, doc, getDocs, orderBy, query, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/FirebaseAuthContext'
import type { Sequence } from '@/lib/sequencer'

function collectionRef(userId: string) {
  return collection(db!, 'sequences', userId, 'userSequences')
}

export function useSequencerStorage() {
  const { user } = useAuth()
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [loading, setLoading] = useState(false)

  const loadSequences = useCallback(async () => {
    if (!user || !db) {
      setSequences([])
      return
    }
    setLoading(true)
    try {
      const q = query(collectionRef(user.uid), orderBy('updatedAt', 'desc'))
      const snap = await getDocs(q)
      const rows = snap.docs.map((d) => d.data() as Sequence)
      setSequences(rows)
    } finally {
      setLoading(false)
    }
  }, [user])

  const saveSequence = useCallback(
    async (seq: Sequence) => {
      if (!user || !db) return
      const next: Sequence = { ...seq, updatedAt: Date.now(), userId: user.uid }
      const ref = doc(db, 'sequences', user.uid, 'userSequences', seq.id)
      await setDoc(ref, next, { merge: true })
      await loadSequences()
    },
    [loadSequences, user]
  )

  const deleteSequence = useCallback(
    async (id: string) => {
      if (!user || !db) return
      const ref = doc(db, 'sequences', user.uid, 'userSequences', id)
      await deleteDoc(ref)
      await loadSequences()
    },
    [loadSequences, user]
  )

  useEffect(() => {
    void loadSequences()
  }, [loadSequences])

  return {
    sequences,
    loading,
    saveSequence,
    deleteSequence,
    loadSequences,
  }
}
