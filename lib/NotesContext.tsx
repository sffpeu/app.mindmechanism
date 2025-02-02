'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { Note, createNote, updateNote, deleteNote, subscribeToUserNotes } from '@/lib/notes'
import { toast } from '@/components/ui/use-toast'

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
    })

    return () => unsubscribe()
  }, [user])

  const addNote = async (title: string, content: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be signed in to create notes",
        variant: "destructive"
      })
      return
    }

    try {
      await createNote(user.uid, title, content)
      toast({
        title: "Success",
        description: "Note created successfully"
      })
    } catch (error) {
      console.error('Error adding note:', error)
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive"
      })
    }
  }

  const editNote = async (noteId: string, title: string, content: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be signed in to edit notes",
        variant: "destructive"
      })
      return
    }

    try {
      await updateNote(user.uid, noteId, title, content)
      toast({
        title: "Success",
        description: "Note updated successfully"
      })
    } catch (error) {
      console.error('Error updating note:', error)
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive"
      })
    }
  }

  const removeNote = async (noteId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be signed in to delete notes",
        variant: "destructive"
      })
      return
    }

    try {
      await deleteNote(user.uid, noteId)
      toast({
        title: "Success",
        description: "Note deleted successfully"
      })
    } catch (error) {
      console.error('Error deleting note:', error)
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive"
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