'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { Note, getUserNotes, createNote, updateNote, deleteNote } from '@/lib/notes'

interface NotesContextType {
  notes: Note[]
  isLoading: boolean
  error: string | null
  addNote: (title: string, content: string) => Promise<void>
  editNote: (noteId: string, title: string, content: string) => Promise<void>
  removeNote: (noteId: string) => Promise<void>
  refreshNotes: () => Promise<void>
}

const NotesContext = createContext<NotesContextType | undefined>(undefined)

export function NotesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadNotes = async () => {
    if (!user) {
      setNotes([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const userNotes = await getUserNotes(user.uid)
      setNotes(userNotes)
      setError(null)
    } catch (err) {
      console.error('Error loading notes:', err)
      setError('Failed to load notes')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNotes()
  }, [user])

  const addNote = async (title: string, content: string) => {
    if (!user) return

    try {
      const newNote = await createNote(user.uid, title, content)
      setNotes(prev => [newNote, ...prev])
      setError(null)
    } catch (err) {
      console.error('Error adding note:', err)
      setError('Failed to add note')
      throw err
    }
  }

  const editNote = async (noteId: string, title: string, content: string) => {
    try {
      await updateNote(noteId, title, content)
      setNotes(prev => prev.map(note => 
        note.id === noteId 
          ? { ...note, title, content, updatedAt: new Date() }
          : note
      ))
      setError(null)
    } catch (err) {
      console.error('Error updating note:', err)
      setError('Failed to update note')
      throw err
    }
  }

  const removeNote = async (noteId: string) => {
    try {
      await deleteNote(noteId)
      setNotes(prev => prev.filter(note => note.id !== noteId))
      setError(null)
    } catch (err) {
      console.error('Error deleting note:', err)
      setError('Failed to delete note')
      throw err
    }
  }

  const refreshNotes = async () => {
    await loadNotes()
  }

  return (
    <NotesContext.Provider 
      value={{ 
        notes, 
        isLoading, 
        error, 
        addNote, 
        editNote, 
        removeNote,
        refreshNotes
      }}
    >
      {children}
    </NotesContext.Provider>
  )
}

export function useNotes() {
  const context = useContext(NotesContext)
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider')
  }
  return context
} 