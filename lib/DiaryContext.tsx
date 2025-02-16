'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { 
  DiaryEntry, 
  createDiaryEntry, 
  updateDiaryEntry, 
  deleteDiaryEntry, 
  subscribeToDiaryEntries,
  WeatherData,
  MoonData,
  LocationData
} from '@/lib/diary'
import { toast } from '@/components/ui/use-toast'

interface DiaryContextType {
  entries: DiaryEntry[]
  isLoading: boolean
  error: string | null
  addEntry: (
    title: string, 
    content: string, 
    weather: WeatherData,
    moon: MoonData,
    location: LocationData
  ) => Promise<string | undefined>
  editEntry: (
    entryId: string, 
    title: string, 
    content: string,
    weather: WeatherData,
    moon: MoonData,
    location: LocationData
  ) => Promise<void>
  removeEntry: (entryId: string) => Promise<void>
}

const DiaryContext = createContext<DiaryContextType | undefined>(undefined)

export function DiaryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setEntries([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = subscribeToDiaryEntries(user.uid, (updatedEntries) => {
        setEntries(updatedEntries)
        setIsLoading(false)
        setError(null)
      });
    } catch (error) {
      console.error('Error subscribing to diary entries:', error)
      setError(error instanceof Error ? error.message : 'Failed to load diary entries')
      setIsLoading(false)
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [user])

  const addEntry = async (
    title: string, 
    content: string,
    weather: WeatherData,
    moon: MoonData,
    location: LocationData
  ): Promise<string | undefined> => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be signed in to create diary entries"
      })
      return
    }

    try {
      setError(null)
      const entryId = await createDiaryEntry(user.uid, title, content, weather, moon, location)
      toast({
        title: "Success",
        description: "Diary entry created successfully"
      })
      return entryId
    } catch (error) {
      console.error('Error adding diary entry:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create diary entry'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage
      })
    }
  }

  const editEntry = async (
    entryId: string, 
    title: string, 
    content: string,
    weather: WeatherData,
    moon: MoonData,
    location: LocationData
  ) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be signed in to edit diary entries"
      })
      return
    }

    try {
      setError(null)
      await updateDiaryEntry(user.uid, entryId, title, content, weather, moon, location)
      toast({
        title: "Success",
        description: "Diary entry updated successfully"
      })
    } catch (error) {
      console.error('Error updating diary entry:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update diary entry'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage
      })
    }
  }

  const removeEntry = async (entryId: string) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be signed in to delete diary entries"
      })
      return
    }

    try {
      setError(null)
      await deleteDiaryEntry(user.uid, entryId)
      toast({
        title: "Success",
        description: "Diary entry deleted successfully"
      })
    } catch (error) {
      console.error('Error deleting diary entry:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete diary entry'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage
      })
    }
  }

  return (
    <DiaryContext.Provider value={{ entries, isLoading, error, addEntry, editEntry, removeEntry }}>
      {children}
    </DiaryContext.Provider>
  )
}

export const useDiary = () => {
  const context = useContext(DiaryContext)
  if (context === undefined) {
    throw new Error('useDiary must be used within a DiaryProvider')
  }
  return context
} 