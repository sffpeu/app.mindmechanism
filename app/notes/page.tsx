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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getUserSessions } from '@/lib/sessions'
import { Session } from '@/lib/sessions'
import { useLocation } from '@/lib/hooks/useLocation'

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
    air_quality: {
      "co": number
      "no2": number
      "o3": number
      "so2": number
      "pm2_5": number
      "pm10": number
      "us-epa-index": 1 | 2 | 3 | 4 | 5 | 6
      "gb-defra-index": number
    }
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
  const { location, error: locationError, isLoading: isLocationLoading } = useLocation()
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
  const [recentSessions, setRecentSessions] = useState<Session[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('none')

  const clockTitles = [
    "Galileo's First Observation",
    "Neptune's Discovery",
    "Galileo's Spring Observation",
    "Jupiter's Moons",
    "Uranus Discovery",
    "Saturn's Rings",
    "Ancient Star Charts",
    "Winter Solstice Study",
    "Medieval Observations"
  ]

  // Load recent sessions
  useEffect(() => {
    const loadSessions = async () => {
      if (!user) return;
      try {
        const sessions = await getUserSessions(user.uid);
        setRecentSessions(sessions);
      } catch (error) {
        console.error('Error loading sessions:', error);
        toast({
          title: "Error",
          description: "Failed to load recent sessions"
        });
        setRecentSessions([]);
      }
    };
    loadSessions();
  }, [user]);

  // Fetch weather and moon data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const weatherRes = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=6cb652a81cb64a19a84103447252001&q=${
            location?.coords ? `${location.coords.lat},${location.coords.lon}` : 'auto:ip'
          }&aqi=yes`
        );
        if (!weatherRes.ok) {
          throw new Error('Weather API request failed');
        }
        const weatherData = await weatherRes.json();
        setWeatherData(weatherData);

        const astronomyRes = await fetch(
          `https://api.weatherapi.com/v1/astronomy.json?key=6cb652a81cb64a19a84103447252001&q=${
            location?.coords ? `${location.coords.lat},${location.coords.lon}` : 'auto:ip'
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
  }, [location?.coords]);

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
      const finalSessionId = selectedSessionId === "none" ? null : selectedSessionId;
      
      if (selectedNote && isEditing) {
        await editNote(selectedNote.id, noteTitle, noteContent, weatherSnapshot, finalSessionId)
      } else {
        const noteId = await addNote(noteTitle, noteContent, weatherSnapshot, finalSessionId)
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
    setSelectedSessionId('none')
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

  const getAQIDescription = (index: 1 | 2 | 3 | 4 | 5 | 6) => {
    const descriptions = {
      1: 'Good',
      2: 'Moderate',
      3: 'Unhealthy for sensitive groups',
      4: 'Unhealthy',
      5: 'Very Unhealthy',
      6: 'Hazardous'
    };
    return descriptions[index] || 'Unknown';
  };

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
          {/* Left Column: Saved Notes */}
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
                      className={`p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer border-2 ${
                        selectedNote?.id === note.id 
                          ? 'border-blue-500 dark:border-blue-400 bg-black/5 dark:bg-white/10' 
                          : 'border-transparent hover:border-blue-500/50 dark:hover:border-blue-400/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-black dark:text-white">{note.title}</h3>
                        <div className="flex items-center gap-1">
                          {note.weatherSnapshot && (
                            <WeatherSnapshotPopover weatherSnapshot={note.weatherSnapshot}>
                              <button 
                                className="p-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-500/20 group transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Cloud className="h-5 w-5 text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
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

              {/* Current Information Display */}
              {((weatherData && moon && !selectedNote) || selectedNote?.weatherSnapshot) && (
                <div className="mb-4 p-3 rounded-lg bg-black/5 dark:bg-white/5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Date & Time</p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <p className="text-sm font-medium dark:text-white">
                          {selectedNote 
                            ? formatDate(selectedNote.updatedAt)
                            : new Date().toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Weather</p>
                      <div className="flex items-center gap-2">
                        <Cloud className="h-4 w-4 text-gray-500" />
                        <p className="text-sm font-medium dark:text-white">
                          {selectedNote?.weatherSnapshot 
                            ? `${selectedNote.weatherSnapshot.temperature}°C, ${selectedNote.weatherSnapshot.humidity}%`
                            : weatherData ? `${weatherData.current.temp_c}°C, ${weatherData.current.humidity}%` : 'Loading...'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wind className="h-4 w-4 text-gray-500" />
                        <p className="text-sm font-medium dark:text-white">
                          {selectedNote?.weatherSnapshot 
                            ? `Wind: ${selectedNote.weatherSnapshot.wind.speed} km/h ${selectedNote.weatherSnapshot.wind.direction}`
                            : weatherData?.current?.air_quality ? `AQI: ${getAQIDescription(weatherData.current.air_quality['us-epa-index'])}` : 'Loading...'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Moon Phase</p>
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4 text-gray-500" />
                        <p className="text-sm font-medium dark:text-white">
                          {selectedNote?.weatherSnapshot 
                            ? selectedNote.weatherSnapshot.moon.phase
                            : moon?.moon_phase || 'Loading...'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500">
                          {selectedNote?.weatherSnapshot 
                            ? `${selectedNote.weatherSnapshot.moon.illumination}% illuminated`
                            : moon ? `${moon.moon_illumination}% illuminated` : 'Loading...'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <p className="text-sm font-medium dark:text-white">
                          {selectedNote?.weatherSnapshot 
                            ? selectedNote.weatherSnapshot.location.name
                            : weatherData?.location?.name || 'Loading...'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500">
                          {selectedNote?.weatherSnapshot 
                            ? `${selectedNote.weatherSnapshot.location.coordinates.lat.toFixed(2)}, ${selectedNote.weatherSnapshot.location.coordinates.lon.toFixed(2)}`
                            : weatherData?.location ? `${weatherData.location.lat.toFixed(2)}, ${weatherData.location.lon.toFixed(2)}` : 'Loading...'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Add Session Selector */}
                {(!selectedNote || isEditing) && (
                  <div className="flex flex-col space-y-2 bg-black/5 dark:bg-white/5 rounded-lg p-3">
                    <label className="text-sm text-black/70 dark:text-white/70">Select Session</label>
                    <Select
                      value={selectedSessionId}
                      onValueChange={(value) => setSelectedSessionId(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a session" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No session</SelectItem>
                        {recentSessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            <div className="flex flex-col">
                              <span>{session.words.join(", ")}</span>
                              <span className="text-xs text-gray-500">
                                {session.start_time.toDate().toLocaleString()}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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