'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { Note, createNote, updateNote, deleteNote, subscribeToUserNotes } from '@/lib/notes'
import { toast } from '@/components/ui/use-toast'
import { ToastAction } from '@/components/ui/toast'

interface NotesContextType {
  notes: Note[]
  isLoading: boolean
  error: string | null
  addNote: (title: string, content: string) => Promise<void>
  editNote: (noteId: string, title: string, content: string) => Promise<void>
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
    const unsubscribe = subscribeToUserNotes(user.uid, (updatedNotes) => {
      setNotes(updatedNotes)
      setIsLoading(false)
      setError(null)
    });

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [user])

  const addNote = async (title: string, content: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be signed in to create notes"
      })
      return
    }

    try {
      setError(null)
      await createNote(user.uid, title, content)
      toast({
        title: "Success",
        description: "Note created successfully"
      })
    } catch (err) {
      console.error('Error adding note:', err)
      setError('Failed to add note')
      toast({
        title: "Error",
        description: "Failed to create note",
        action: <ToastAction altText="Try again">Try again</ToastAction>
      })
      throw err
    }
  }

  const editNote = async (noteId: string, title: string, content: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be signed in to edit notes"
      })
      return
    }

    try {
      setError(null)
      await updateNote(noteId, title, content)
      toast({
        title: "Success",
        description: "Note updated successfully"
      })
    } catch (err) {
      console.error('Error updating note:', err)
      setError('Failed to update note')
      toast({
        title: "Error",
        description: "Failed to update note",
        action: <ToastAction altText="Try again">Try again</ToastAction>
      })
      throw err
    }
  }

  const removeNote = async (noteId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be signed in to delete notes"
      })
      return
    }

    try {
      setError(null)
      await deleteNote(noteId)
      toast({
        title: "Success",
        description: "Note deleted successfully"
      })
    } catch (err) {
      console.error('Error deleting note:', err)
      setError('Failed to delete note')
      toast({
        title: "Error",
        description: "Failed to delete note",
        action: <ToastAction altText="Try again">Try again</ToastAction>
      })
      throw err
    }
  }

  return (
    <NotesContext.Provider 
      value={{ 
        notes, 
        isLoading, 
        error, 
        addNote, 
        editNote, 
        removeNote
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