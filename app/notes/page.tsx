'use client'

import { useState, useEffect } from 'react'
import { Menu } from '@/components/Menu'
import { Card } from '@/components/ui/card'
import { RotateCcw, PenLine, Files, Clock, ArrowUpDown, Save, Edit, X, Cloud, Thermometer, Droplets, Sun, Gauge, Wind, Moon, MapPin } from 'lucide-react'
import { useTheme } from '@/app/ThemeContext'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { useNotes } from '@/lib/NotesContext'
import { Note, WeatherSnapshot } from '@/lib/notes'
import { toast } from '@/components/ui/use-toast'
import { WeatherSnapshotPopover } from '@/components/WeatherSnapshotPopover'
import { Timestamp } from 'firebase/firestore'

interface WeatherResponse {
  location: {
    name: string
    region: string
    country: string
    lat: number
    lon: number
    tz_id: string
    localtime: string
  }
  current: {
    temp_c: number
    condition: {
      text: string
      icon: string
    }
    humidity: number
    uv: number
    pressure_mb: number
    wind_kph: number
    wind_dir: string
  }
}

interface MoonData {
  moon_phase: string
  moon_illumination: string
  moonrise: string
  moonset: string
}

export default function NotesPage() {
  const { user } = useAuth()
  const { notes, isLoading, addNote, editNote, removeNote } = useNotes()
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const { isDarkMode } = useTheme()
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null)
  const [moon, setMoon] = useState<MoonData | null>(null)
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Example sessions - replace with actual data
  const sessions = [
    { title: "Galileo's First Observation", date: '20/01/2025' },
    { title: "Galileo's First Observation", date: '20/01/2025' },
  ]

  // Request location permission and get coordinates
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Unable to get your location. Using IP-based location instead.');
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser. Using IP-based location instead.');
    }
  }, []);

  // Fetch weather and moon data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const weatherRes = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=6cb652a81cb64a19a84103447252001&q=${
            location ? `${location.lat},${location.lon}` : 'auto:ip'
          }&aqi=no`
        );
        if (!weatherRes.ok) {
          throw new Error('Weather API request failed');
        }
        const weatherData = await weatherRes.json();
        setWeatherData(weatherData);

        const astronomyRes = await fetch(
          `https://api.weatherapi.com/v1/astronomy.json?key=6cb652a81cb64a19a84103447252001&q=${
            location ? `${location.lat},${location.lon}` : 'auto:ip'
          }`
        );
        if (!astronomyRes.ok) {
          throw new Error('Astronomy API request failed');
        }
        const astronomyData = await astronomyRes.json();
        setMoon(astronomyData.astronomy.astro);
      } catch (error) {
        console.error('Error fetching weather data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, [location]);

  const createWeatherSnapshot = (): WeatherSnapshot | undefined => {
    if (!weatherData || !moon) return undefined;

    return {
      temperature: weatherData.current.temp_c,
      humidity: weatherData.current.humidity,
      uvIndex: weatherData.current.uv,
      airPressure: weatherData.current.pressure_mb,
      wind: {
        speed: weatherData.current.wind_kph,
        direction: weatherData.current.wind_dir,
      },
      moon: {
        phase: moon.moon_phase,
        illumination: parseInt(moon.moon_illumination),
        moonrise: moon.moonrise,
        moonset: moon.moonset,
      },
      location: {
        name: weatherData.location.name,
        country: weatherData.location.country,
        coordinates: {
          lat: weatherData.location.lat,
          lon: weatherData.location.lon,
        },
      },
      timestamp: Timestamp.now(),
    };
  };

  const handleSaveNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      toast({
        title: "Error",
        description: "Title and content are required"
      })
      return
    }

    try {
      const weatherSnapshot = createWeatherSnapshot();
      if (selectedNote && isEditing) {
        await editNote(selectedNote.id, noteTitle, noteContent, weatherSnapshot)
      } else {
        const noteId = await addNote(noteTitle, noteContent, weatherSnapshot)
        if (noteId) {
          console.log('Created note with ID:', noteId)
        }
      }
      clearForm()
      toast({
        title: "Success",
        description: selectedNote ? "Note updated successfully" : "Note created successfully"
      })
    } catch (error) {
      console.error('Error saving note:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save note'
      toast({
        title: "Error",
        description: errorMessage
      })
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      await removeNote(noteId)
      if (selectedNote?.id === noteId) {
        clearForm()
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete note'
      toast({
        title: "Error",
        description: errorMessage
      })
    }
  }

  const clearForm = () => {
    setNoteTitle('')
    setNoteContent('')
    setSelectedNote(null)
    setIsEditing(false)
  }

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note)
    setNoteTitle(note.title)
    setNoteContent(note.content)
    setIsEditing(false)
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return ''
    const date = timestamp.toDate()
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const sortedNotes = [...notes].sort((a, b) => {
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
            <p className="text-gray-500 dark:text-gray-400">Please sign in to view and manage your notes.</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column: Saved Notes and Select Session */}
          <div className="space-y-4">
            {/* Saved Notes Card */}
            <Card className="p-4 bg-white/90 dark:bg-black/90 backdrop-blur-lg border-black/10 dark:border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-black dark:text-white">Saved Notes</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                  </button>
                  <button
                    onClick={clearForm}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {isLoading ? (
                  <p className="text-center text-black/50 dark:text-white/50 py-8">Loading notes...</p>
                ) : sortedNotes.length === 0 ? (
                  <p className="text-center text-black/50 dark:text-white/50 py-8">No saved notes yet</p>
                ) : (
                  sortedNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => handleNoteClick(note)}
                      className={`p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer ${
                        selectedNote?.id === note.id ? 'bg-black/5 dark:bg-white/10' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-black dark:text-white">{note.title}</h3>
                        <div className="flex items-center gap-1">
                          {note.weatherSnapshot && (
                            <WeatherSnapshotPopover weatherSnapshot={note.weatherSnapshot}>
                              <button 
                                className="p-0.5 rounded-md hover:bg-gray-200 dark:hover:bg-white/10"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Cloud className="h-3.5 w-3.5 text-gray-500" />
                              </button>
                            </WeatherSnapshotPopover>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                        <p className="text-sm text-black/50 dark:text-white/50">{formatDate(note.updatedAt)}</p>
                      </div>
                      <p className="text-sm text-black/50 dark:text-white/50 mt-1 line-clamp-2">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Select Session Card */}
            <Card className="p-4 bg-white/90 dark:bg-black/90 backdrop-blur-lg border-black/10 dark:border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-black dark:text-white">Select Session</h2>
                <RotateCcw className="h-5 w-5 text-black/50 dark:text-white/50" />
              </div>
              <div className="space-y-3">
                {sessions.map((session, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedSession(session.title)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedSession === session.title
                        ? 'bg-black/5 dark:bg-white/10'
                        : 'hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <h3 className="text-red-500 dark:text-red-400 font-medium">{session.title}</h3>
                    <p className="text-sm text-black/50 dark:text-white/50">{session.date}</p>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column: Write/View Note */}
          <div className="md:col-span-2">
            <Card className="p-4 bg-white/90 dark:bg-black/90 backdrop-blur-lg border-black/10 dark:border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-black dark:text-white">
                  {selectedNote ? (isEditing ? 'Edit Note' : 'View Note') : 'Write Note'}
                </h2>
                <div className="flex items-center gap-2">
                  {selectedNote && (
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
                        onClick={() => handleDeleteNote(selectedNote.id)}
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
                    placeholder="Note Title"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="bg-transparent w-full text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 outline-none"
                    readOnly={Boolean(selectedNote && !isEditing)}
                  />
                  {selectedNote && (
                    <span className="text-sm text-black/50 dark:text-white/50">
                      {formatDate(selectedNote.updatedAt)}
                    </span>
                  )}
                </div>
                <textarea
                  placeholder="Write your note here..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className={`w-full h-[500px] bg-black/5 dark:bg-white/5 rounded-lg p-3 text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 outline-none resize-none ${
                    selectedNote && !isEditing ? 'cursor-default' : ''
                  }`}
                  readOnly={Boolean(selectedNote && !isEditing)}
                />
                {(!selectedNote || isEditing) && (
                  <button
                    onClick={handleSaveNote}
                    className="w-full py-3 bg-gray-400/80 hover:bg-gray-400/90 dark:bg-gray-600/80 dark:hover:bg-gray-600/90 text-white rounded-lg transition-colors"
                  >
                    {selectedNote ? 'Save Changes' : 'Save Note'}
                  </button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 