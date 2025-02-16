'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { Note, WeatherSnapshot, createNote, updateNote, deleteNote, subscribeToUserNotes } from '@/lib/notes'
import { toast } from '@/components/ui/use-toast'

interface NotesContextType {
  notes: Note[]
  isLoading: boolean
  error: string | null
  addNote: (title: string, content: string, weatherSnapshot?: WeatherSnapshot) => Promise<string | undefined>
  editNote: (noteId: string, title: string, content: string, weatherSnapshot?: WeatherSnapshot) => Promise<void>
  removeNote: (noteId: string) => Promise<void>
}

const NotesContext = createContext<NotesContextType | undefined>(undefined)

export function NotesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setNotes([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = subscribeToUserNotes(user.uid, (updatedNotes) => {
        setNotes(updatedNotes)
        setIsLoading(false)
        setError(null)
      });
    } catch (error) {
      console.error('Error subscribing to notes:', error)
      setError(error instanceof Error ? error.message : 'Failed to load notes')
      setIsLoading(false)
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [user])

  const addNote = async (title: string, content: string, weatherSnapshot?: WeatherSnapshot): Promise<string | undefined> => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be signed in to create notes"
      })
      return
    }

    try {
      setError(null)
      const noteId = await createNote(user.uid, title, content, weatherSnapshot)
      toast({
        title: "Success",
        description: "Note created successfully"
      })
      return noteId
    } catch (error) {
      console.error('Error adding note:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create note'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage
      })
    }
  }

  const editNote = async (noteId: string, title: string, content: string, weatherSnapshot?: WeatherSnapshot) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be signed in to edit notes"
      })
      return
    }

    try {
      setError(null)
      await updateNote(user.uid, noteId, title, content, weatherSnapshot)
      toast({
        title: "Success",
        description: "Note updated successfully"
      })
    } catch (error) {
      console.error('Error updating note:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update note'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage
      })
    }
  }

  const removeNote = async (noteId: string) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be signed in to delete notes"
      })
      return
    }

    try {
      setError(null)
      await deleteNote(user.uid, noteId)
      toast({
        title: "Success",
        description: "Note deleted successfully"
      })
    } catch (error) {
      console.error('Error deleting note:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete note'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage
      })
    }
  }

  return (
    <NotesContext.Provider value={{ notes, isLoading, error, addNote, editNote, removeNote }}>
      {children}
    </NotesContext.Provider>
  )
}

export const useNotes = () => {
  const context = useContext(NotesContext)
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider')
  }
  return context
} 