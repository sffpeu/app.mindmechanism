'use client'

import { useState, useEffect } from 'react'
import { Menu } from '@/components/Menu'
import { Card } from '@/components/ui/card'
import { WeatherCard } from '@/components/WeatherCard'
import { MoonCard } from '@/components/MoonCard'
import { LocationCard } from '@/components/LocationCard'
import { RotateCcw, PenLine, Clock, ArrowUpDown, Save, Edit, X, Plus } from 'lucide-react'
import { useTheme } from '@/app/ThemeContext'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { useDiary } from '@/lib/DiaryContext'
import { DiaryEntry, WeatherData, MoonData, LocationData } from '@/lib/diary'
import { getCurrentLocation, getWeatherAndLocation, getMoonData } from '@/lib/weather'
import { toast } from '@/components/ui/use-toast'

export default function DiaryPage() {
  const { user } = useAuth()
  const { entries, isLoading, addEntry, editEntry, removeEntry } = useDiary()
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const [entryTitle, setEntryTitle] = useState('')
  const [entryContent, setEntryContent] = useState('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const { isDarkMode } = useTheme()
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [moon, setMoon] = useState<MoonData | null>(null)
  const [location, setLocation] = useState<LocationData | null>(null)
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get user's location and fetch weather/moon data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true)
        setError(null)

        // Get user's location
        try {
          const coords = await getCurrentLocation()
          setLocationCoords(coords)
        } catch (error) {
          console.warn('Using IP-based location:', error)
        }

        // Get weather and location data
        const { weather: weatherData, location: locationData } = await getWeatherAndLocation(
          locationCoords || undefined
        )
        setWeather(weatherData)
        setLocation(locationData)

        // Get moon data
        const moonData = await getMoonData(locationCoords || undefined)
        setMoon(moonData)

        setIsLoadingData(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load weather and location data')
        setIsLoadingData(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5 * 60 * 1000) // Update every 5 minutes
    return () => clearInterval(interval)
  }, [locationCoords])

  const handleSaveEntry = async () => {
    if (!entryTitle.trim() || !entryContent.trim()) {
      toast({
        title: "Error",
        description: "Title and content are required"
      })
      return
    }

    if (!weather || !moon || !location) {
      toast({
        title: "Error",
        description: "Weather, moon, and location data are required"
      })
      return
    }

    try {
      if (selectedEntry && isEditing) {
        await editEntry(selectedEntry.id, entryTitle, entryContent, weather, moon, location)
      } else {
        const entryId = await addEntry(entryTitle, entryContent, weather, moon, location)
        if (entryId) {
          console.log('Created diary entry with ID:', entryId)
        }
      }
      clearForm()
    } catch (error) {
      console.error('Error saving diary entry:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save diary entry'
      toast({
        title: "Error",
        description: errorMessage
      })
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this diary entry?')) return

    try {
      await removeEntry(entryId)
      if (selectedEntry?.id === entryId) {
        clearForm()
      }
    } catch (error) {
      console.error('Error deleting diary entry:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete diary entry'
      toast({
        title: "Error",
        description: errorMessage
      })
    }
  }

  const clearForm = () => {
    setEntryTitle('')
    setEntryContent('')
    setSelectedEntry(null)
    setIsEditing(false)
  }

  const handleEntryClick = (entry: DiaryEntry) => {
    setSelectedEntry(entry)
    setEntryTitle(entry.title)
    setEntryContent(entry.content)
    setIsEditing(false)
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return ''
    const date = timestamp.toDate()
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const sortedEntries = [...entries].sort((a, b) => {
    const dateA = a.updatedAt.toDate().getTime()
    const dateB = b.updatedAt.toDate().getTime()
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
  })

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black/95">
        <Menu
          showElements={showElements}
          onToggleShow={() => setShowElements(!showElements)}
          showSatellites={showSatellites}
          onSatellitesChange={setShowSatellites}
        />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center py-8">
            <h2 className="text-xl font-medium text-black dark:text-white mb-2">Sign In Required</h2>
            <p className="text-gray-500 dark:text-gray-400">Please sign in to view and manage your diary entries.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95">
      <Menu
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
        showSatellites={showSatellites}
        onSatellitesChange={setShowSatellites}
      />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Entries List */}
          <Card className="p-4 bg-white/90 dark:bg-black/90 backdrop-blur-lg border-black/10 dark:border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-black dark:text-white">Diary Entries</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <ArrowUpDown className="h-5 w-5 text-black/50 dark:text-white/50" />
                </button>
                <button
                  onClick={clearForm}
                  className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Plus className="h-5 w-5 text-black/50 dark:text-white/50" />
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {isLoading ? (
                <p className="text-center text-black/50 dark:text-white/50 py-8">Loading entries...</p>
              ) : sortedEntries.length === 0 ? (
                <p className="text-center text-black/50 dark:text-white/50 py-8">No diary entries yet</p>
              ) : (
                sortedEntries.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => handleEntryClick(entry)}
                    className={`p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer ${
                      selectedEntry?.id === entry.id ? 'bg-black/5 dark:bg-white/10' : ''
                    }`}
                  >
                    <h3 className="font-medium text-black dark:text-white">{entry.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                      <p className="text-sm text-black/50 dark:text-white/50">{formatDate(entry.updatedAt)}</p>
                    </div>
                    <p className="text-sm text-black/50 dark:text-white/50 mt-1 line-clamp-2">{entry.content}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Middle Column - Entry Form */}
          <div className="space-y-6">
            <Card className="p-4 bg-white/90 dark:bg-black/90 backdrop-blur-lg border-black/10 dark:border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-black dark:text-white">
                  {selectedEntry ? (isEditing ? 'Edit Entry' : 'View Entry') : 'New Entry'}
                </h2>
                <div className="flex items-center gap-2">
                  {selectedEntry && (
                    <>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        {isEditing ? (
                          <X className="h-5 w-5 text-black/50 dark:text-white/50" />
                        ) : (
                          <Edit className="h-5 w-5 text-black/50 dark:text-white/50" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(selectedEntry.id)}
                        className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <X className="h-5 w-5 text-red-500" />
                      </button>
                    </>
                  )}
                  <PenLine className="h-5 w-5 text-black/50 dark:text-white/50" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 rounded-lg p-3">
                  <input
                    type="text"
                    placeholder="Entry Title"
                    value={entryTitle}
                    onChange={(e) => setEntryTitle(e.target.value)}
                    className="bg-transparent w-full text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 outline-none"
                    readOnly={Boolean(selectedEntry && !isEditing)}
                  />
                  {selectedEntry && (
                    <span className="text-sm text-black/50 dark:text-white/50">
                      {formatDate(selectedEntry.updatedAt)}
                    </span>
                  )}
                </div>
                <textarea
                  placeholder="Write your diary entry here..."
                  value={entryContent}
                  onChange={(e) => setEntryContent(e.target.value)}
                  className={`w-full h-[300px] bg-black/5 dark:bg-white/5 rounded-lg p-3 text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 outline-none resize-none ${
                    selectedEntry && !isEditing ? 'cursor-default' : ''
                  }`}
                  readOnly={Boolean(selectedEntry && !isEditing)}
                />
                {(!selectedEntry || isEditing) && (
                  <button
                    onClick={handleSaveEntry}
                    className="w-full py-3 bg-gray-400/80 hover:bg-gray-400/90 dark:bg-gray-600/80 dark:hover:bg-gray-600/90 text-white rounded-lg transition-colors"
                    disabled={isLoadingData || !weather || !moon || !location}
                  >
                    {selectedEntry ? 'Save Changes' : 'Save Entry'}
                  </button>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Weather, Moon, and Location */}
          <div className="space-y-6">
            {isLoadingData ? (
              <p className="text-center text-black/50 dark:text-white/50 py-8">Loading weather and location data...</p>
            ) : error ? (
              <p className="text-center text-red-500 py-8">{error}</p>
            ) : (
              <>
                {weather && <WeatherCard weather={weather} />}
                {moon && <MoonCard moon={moon} />}
                {location && <LocationCard location={location} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}