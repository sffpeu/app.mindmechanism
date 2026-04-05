'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Clock, ArrowUpDown, Save, Edit, X, Cloud, Wind, Moon, MapPin, Timer, Plus, Trash2, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
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
import { clockTitles } from '@/lib/clockTitles'
import { useLocation } from '@/lib/hooks/useLocation'
import { useSoundEffects } from '@/lib/sounds'

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

const clockColors = [
  'text-red-500 bg-red-500',
  'text-orange-500 bg-orange-500',
  'text-yellow-500 bg-yellow-500',
  'text-green-500 bg-green-500',
  'text-blue-500 bg-blue-500',
  'text-pink-500 bg-pink-500',
  'text-purple-500 bg-purple-500',
  'text-indigo-500 bg-indigo-500',
  'text-cyan-500 bg-cyan-500'
]

export default function NotesPage() {
  const { user } = useAuth()
  const { notes, isLoading, addNote, editNote, removeNote } = useNotes()
  const { location } = useLocation()
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null)
  const [moon, setMoon] = useState<MoonData | null>(null)
  const [recentSessions, setRecentSessions] = useState<Session[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>('none')
  const { playSuccess } = useSoundEffects()

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
      playSuccess();
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

  const canSave = noteTitle.trim().length > 0 && noteContent.trim().length > 0

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
      <div className="h-full overflow-hidden flex flex-col bg-gray-50 dark:bg-black/95">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="text-center py-8">
              <h2 className="text-xl font-medium text-black dark:text-white mb-2">Sign In Required</h2>
              <p className="text-gray-500 dark:text-gray-400">Please sign in to view and manage your notes.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-hidden flex flex-col bg-gray-50 dark:bg-black/95">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Notes</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
                Write with optional session and environment context—saved notes stay easy to scan in the list.
              </p>
            </div>
            {(!selectedNote || isEditing) && (
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={!canSave}
                className={cn(
                  'inline-flex items-center gap-2 shrink-0 self-start sm:self-auto',
                  'text-sm font-semibold text-green-600 dark:text-green-400',
                  'hover:text-green-700 dark:hover:text-green-300',
                  'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-green-600 dark:disabled:hover:text-green-400',
                  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/40 focus-visible:ring-offset-2 rounded-md px-1 py-1 -mr-1'
                )}
              >
                <Save className="h-5 w-5" aria-hidden />
                Save
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column: Saved Notes */}
          <div className="space-y-4">
            <Card className="card p-3 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-3.5 w-3.5 text-gray-500" />
                  <h2 className="text-sm font-semibold dark:text-white">Saved notes</h2>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-gray-600 dark:text-gray-300"
                    onClick={() => setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
                  >
                    <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
                    {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={clearForm}
                    title="New note"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5 mt-2">
                {isLoading ? (
                  <p className="text-center text-xs text-gray-500 dark:text-gray-400 py-8">Loading notes…</p>
                ) : sortedNotes.length === 0 ? (
                  <p className="text-center text-xs text-gray-500 dark:text-gray-400 py-8">No saved notes yet. Start one on the right.</p>
                ) : (
                  sortedNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => {
                        if (!isEditing) {
                          setSelectedNote(note);
                          setNoteTitle(note.title);
                          setNoteContent(note.content);
                          setSelectedSessionId(note.sessionId || 'none');
                        }
                      }}
                      className={cn(
                        'note-item group p-2 rounded-lg border transition-all cursor-pointer',
                        'bg-gray-50 dark:bg-black/20 border-black/5 dark:border-white/10',
                        'hover:border-black/10 dark:hover:border-white/10',
                        selectedNote?.id === note.id &&
                          'ring-1 ring-blue-500/40 border-blue-500/30 bg-white dark:bg-black/30'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-medium dark:text-white truncate min-w-0">{note.title}</h3>
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
                          {note.sessionId && (
                            <button 
                              className="p-1 rounded-md group transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                const session = recentSessions.find(s => s.id === note.sessionId);
                                if (session) {
                                  toast({
                                    title: "Session Information",
                                    description: (
                                      <div className="space-y-2 mt-2">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                          <div className="space-y-1">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Clock</p>
                                            <div className="flex items-center gap-2">
                                              <div className={`w-2 h-2 rounded-full ${clockColors[session.clock_id].split(' ')[1]}`} />
                                              <span className={`text-sm font-medium ${clockColors[session.clock_id].split(' ')[0]}`}>
                                                {clockTitles[session.clock_id]}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="space-y-1">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                              session.status === 'completed' 
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : session.status === 'in_progress'
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                                            }`}>
                                              {session.status === 'completed' ? 'Completed' : session.status === 'in_progress' ? 'In Progress' : 'Aborted'}
                                            </span>
                                          </div>
                                          <div className="space-y-1">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Start Time</p>
                                            <div className="flex items-center gap-2">
                                              <Clock className="h-4 w-4 text-gray-500" />
                                              <p className="text-sm font-medium dark:text-white">
                                                {session.start_time.toDate().toLocaleString()}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="space-y-1">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                                            <div className="flex items-center gap-2">
                                              <Timer className="h-4 w-4 text-gray-500" />
                                              <p className="text-sm font-medium dark:text-white">
                                                {Math.round(session.duration / 1000 / 60)} minutes
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="space-y-1">
                                          <p className="text-xs text-gray-500 dark:text-gray-400">Words</p>
                                          <p className="text-sm">{session.words.join(", ")}</p>
                                        </div>
                                      </div>
                                    ),
                                  });
                                }
                              }}
                            >
                              {(() => {
                                const session = recentSessions.find(s => s.id === note.sessionId);
                                return (
                                  <Clock 
                                    className={`h-5 w-5 ${
                                      session 
                                        ? `${clockColors[session.clock_id].split(' ')[0]} group-hover:opacity-80` 
                                        : 'text-gray-500 group-hover:text-gray-700'
                                    } transition-colors`} 
                                  />
                                );
                              })()}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="h-3 w-3 text-gray-400 dark:text-gray-500 shrink-0" />
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{formatDate(note.updatedAt)}</p>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Write/View Note */}
          <div className="md:col-span-2">
            <Card className="card p-4 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold dark:text-white">
                      {selectedNote ? (isEditing ? 'Edit note' : 'View note') : 'Write a note'}
                    </h2>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {selectedNote && !isEditing
                      ? `Last updated ${formatDate(selectedNote.updatedAt)}`
                      : 'Title and body are required to save.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1 sm:justify-end shrink-0">
                  {selectedNote && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsEditing(!isEditing)}
                        title={isEditing ? 'Done' : 'Edit'}
                        aria-label={isEditing ? 'Cancel editing' : 'Edit note'}
                      >
                        {isEditing ? (
                          <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        ) : (
                          <Edit className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-500/10 dark:text-red-400"
                        onClick={() => handleDeleteNote(selectedNote.id)}
                        title="Delete note"
                        aria-label="Delete note"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {((weatherData && moon && !selectedNote) || selectedNote?.weatherSnapshot) && (
                <div className="mb-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Environment snapshot</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-blue-600 dark:text-blue-400">
                          Full details
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 space-y-3 text-sm" align="end">
                        {selectedNote?.weatherSnapshot ? (
                          <>
                            <p className="font-medium dark:text-white">Saved with this note</p>
                            <ul className="space-y-1.5 text-gray-600 dark:text-gray-300 text-xs">
                              <li>
                                Wind {selectedNote.weatherSnapshot.wind.speed} km/h {selectedNote.weatherSnapshot.wind.direction}
                              </li>
                              <li>Pressure {selectedNote.weatherSnapshot.airPressure} mb</li>
                              <li>UV index {selectedNote.weatherSnapshot.uvIndex}</li>
                              <li>
                                Moonrise {selectedNote.weatherSnapshot.moon.moonrise} · Moonset{' '}
                                {selectedNote.weatherSnapshot.moon.moonset}
                              </li>
                            </ul>
                          </>
                        ) : weatherData && moon ? (
                          <>
                            <p className="font-medium dark:text-white">Current conditions (saved with new notes)</p>
                            <ul className="space-y-1.5 text-gray-600 dark:text-gray-300 text-xs">
                              <li>
                                Wind {weatherData.current.wind_kph} km/h {weatherData.current.wind_dir}
                              </li>
                              <li>Pressure {weatherData.current.pressure_mb} hPa</li>
                              <li>UV index {weatherData.current.uv}</li>
                              <li>
                                AQI:{' '}
                                {weatherData.current.air_quality
                                  ? getAQIDescription(weatherData.current.air_quality['us-epa-index'])
                                  : 'N/A'}
                              </li>
                              <li>
                                Moonrise {moon.moonrise} · Moonset {moon.moonset}
                              </li>
                            </ul>
                          </>
                        ) : null}
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <div className="p-2 rounded-lg border border-black/10 dark:border-white/20">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-200">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-xs">Time</span>
                      </div>
                      <p className="text-sm font-semibold dark:text-white mt-1 leading-tight">
                        {selectedNote
                          ? formatDate(selectedNote.updatedAt)
                          : new Intl.DateTimeFormat('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }).format(new Date())}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg border border-black/10 dark:border-white/20">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-200">
                        <Cloud className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-xs">Weather</span>
                      </div>
                      <p className="text-sm font-semibold dark:text-white mt-1 leading-tight">
                        {selectedNote?.weatherSnapshot
                          ? `${selectedNote.weatherSnapshot.temperature}°C · ${selectedNote.weatherSnapshot.humidity}%`
                          : weatherData
                            ? `${weatherData.current.temp_c}°C · ${weatherData.current.humidity}%`
                            : '…'}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg border border-black/10 dark:border-white/20">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-200">
                        <Moon className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-xs">Moon</span>
                      </div>
                      <p className="text-sm font-semibold dark:text-white mt-1 leading-tight line-clamp-2">
                        {selectedNote?.weatherSnapshot
                          ? selectedNote.weatherSnapshot.moon.phase
                          : moon?.moon_phase || '…'}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {selectedNote?.weatherSnapshot
                          ? `${selectedNote.weatherSnapshot.moon.illumination}% lit`
                          : moon
                            ? `${moon.moon_illumination}% lit`
                            : ''}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg border border-black/10 dark:border-white/20 col-span-2 lg:col-span-1">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-200">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-xs">Location</span>
                      </div>
                      <p className="text-sm font-semibold dark:text-white mt-1 leading-tight truncate">
                        {selectedNote?.weatherSnapshot
                          ? selectedNote.weatherSnapshot.location.name
                          : weatherData?.location?.name || '…'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {(!selectedNote || isEditing) && (
                  <div className="rounded-lg border border-black/5 dark:border-white/10 bg-gray-50 dark:bg-black/20 p-3 space-y-2">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Link to session</label>
                    <Select value={selectedSessionId} onValueChange={(value) => setSelectedSessionId(value)}>
                      <SelectTrigger className="bg-white dark:bg-black/40">
                        <SelectValue placeholder="Choose a session" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No session</SelectItem>
                        {recentSessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${clockColors[session.clock_id].split(' ')[1]}`} />
                              <span className={`font-medium ${clockColors[session.clock_id].split(' ')[0]}`}>
                                {clockTitles[session.clock_id]}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedSessionId !== 'none' &&
                      (() => {
                        const session = recentSessions.find((s) => s.id === selectedSessionId)
                        if (!session) return null
                        return (
                          <div className="rounded-md border border-black/5 dark:border-white/10 bg-white/80 dark:bg-black/30 p-2 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${clockColors[session.clock_id].split(' ')[1]}`} />
                              <span className={`text-sm font-medium ${clockColors[session.clock_id].split(' ')[0]}`}>
                                {clockTitles[session.clock_id]}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full ${
                                  session.status === 'completed'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : session.status === 'in_progress'
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                      : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                                }`}
                              >
                                {session.status === 'completed'
                                  ? 'Completed'
                                  : session.status === 'in_progress'
                                    ? 'In progress'
                                    : 'Aborted'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{session.words.join(', ')}</p>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-500 dark:text-gray-400">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {session.start_time.toDate().toLocaleString()}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                {Math.round(session.duration / 1000 / 60)} min
                              </span>
                            </div>
                          </div>
                        )
                      })()}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="note-title" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Title
                  </label>
                  <Input
                    id="note-title"
                    placeholder="Give your note a short title"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    readOnly={Boolean(selectedNote && !isEditing)}
                    className={cn(
                      'bg-white dark:bg-black/40',
                      selectedNote && !isEditing && 'opacity-80 cursor-default'
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="note-body" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Note
                  </label>
                  <Textarea
                    id="note-body"
                    placeholder="Write freely—everything saves to your account."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    readOnly={Boolean(selectedNote && !isEditing)}
                    className={cn(
                      'min-h-[280px] sm:min-h-[360px] md:min-h-[420px] resize-y text-sm',
                      selectedNote && !isEditing && 'cursor-default opacity-90'
                    )}
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
} 