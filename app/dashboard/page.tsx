'use client'

import { useEffect, useState } from 'react'
import { Menu } from '@/components/Menu'
import { Card } from '@/components/ui/card'
import { Calendar, Clock, Cloud, Droplets, Gauge, Wind, Moon, ClipboardList, BookOpen, Sun, MapPin, Mountain, Waves, User, BarChart2, Pencil, Trash2 } from 'lucide-react'
import { useTheme } from '@/app/ThemeContext'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { useNotes } from '@/lib/NotesContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Note } from '@/lib/notes'
import { ChangeEvent } from 'react'

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
  }
}

interface MoonData {
  moon_phase: string
  moon_illumination: string
  moonrise: string
  moonset: string
  next_full_moon: string
  next_new_moon: string
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [showElements, setShowElements] = useState(true)
  const [showSatellites, setShowSatellites] = useState(false)
  const [showInfoCards, setShowInfoCards] = useState(true)
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null)
  const [moon, setMoon] = useState<MoonData | null>(null)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const { isDarkMode } = useTheme()
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const router = useRouter()
  const { user } = useAuth()
  const { notes, isLoading: notesLoading, addNote, editNote, removeNote } = useNotes()
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false)
  const [isEditNoteOpen, setIsEditNoteOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')

  // Handle mounting
  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())
  }, [])

  const formatTime = (date: Date | null) => {
    if (!date) return '--:--:--'
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }

  // Initialize dark mode from system preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        document.documentElement.classList.add('dark')
      }
    }
  }, [])

  // Handle dark mode changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  // Update current time every second
  useEffect(() => {
    if (!mounted) return

    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [mounted])

  // Request location permission and get coordinates
  useEffect(() => {
    if (!mounted) return

    const getLocation = () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            })
            setLocationError(null)
          },
          (error) => {
            console.error('Error getting location:', error)
            setLocationError('Unable to get your location. Using IP-based location instead.')
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        )
      } else {
        setLocationError('Geolocation is not supported by your browser. Using IP-based location instead.')
      }
    }

    getLocation()
  }, [mounted])

  // Fetch weather and moon data with precise location
  useEffect(() => {
    if (!mounted) return

    const fetchData = async () => {
      try {
        const weatherRes = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=6cb652a81cb64a19a84103447252001&q=${
            location ? `${location.lat},${location.lon}` : 'auto:ip'
          }&aqi=no`
        )
        const weatherData = await weatherRes.json()
        setWeatherData(weatherData)

        const astronomyRes = await fetch(
          `https://api.weatherapi.com/v1/astronomy.json?key=6cb652a81cb64a19a84103447252001&q=${
            location ? `${location.lat},${location.lon}` : 'auto:ip'
          }`
        )
        const astronomyData = await astronomyRes.json()
        setMoon(astronomyData.astronomy.astro)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [mounted, location])

  const handleAddNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) return

    try {
      await addNote(noteTitle.trim(), noteContent.trim())
      setNoteTitle('')
      setNoteContent('')
      setIsAddNoteOpen(false)
    } catch (error) {
      console.error('Error adding note:', error)
    }
  }

  const handleEditNote = async () => {
    if (!selectedNote || !noteTitle.trim() || !noteContent.trim()) return

    try {
      await editNote(selectedNote.id, noteTitle.trim(), noteContent.trim())
      setSelectedNote(null)
      setNoteTitle('')
      setNoteContent('')
      setIsEditNoteOpen(false)
    } catch (error) {
      console.error('Error editing note:', error)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      await removeNote(noteId)
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  const openEditNote = (note: Note) => {
    setSelectedNote(note)
    setNoteTitle(note.title)
    setNoteContent(note.content)
    setIsEditNoteOpen(true)
  }

  // Update the event handlers with proper types
  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => setNoteTitle(e.target.value)
  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => setNoteContent(e.target.value)

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95">
      <Menu
        showElements={showElements}
        onToggleShow={() => setShowElements(!showElements)}
        showSatellites={showSatellites}
        onSatellitesChange={setShowSatellites}
      />
      <div className="max-w-6xl mx-auto space-y-4 p-4">
        {/* Time Card */}
        {showInfoCards && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold dark:text-white">Time</h2>
                <Clock className="h-4 w-4 text-gray-500" />
              </div>
              <p className="text-5xl font-bold dark:text-white tracking-tight">
                {formatTime(currentTime)}
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {currentTime?.toLocaleDateString('en-US', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })} ({new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(new Date()).find(part => part.type === 'timeZoneName')?.value})
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </p>
            </Card>

            <Card className="p-4 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/20 flex items-center justify-center">
                  <span className="text-xl font-semibold dark:text-white">
                    U
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h1 className="text-xl font-semibold dark:text-white truncate">
                      User
                    </h1>
                    <button className="px-3 py-1.5 text-sm bg-white dark:bg-white/20 rounded-md dark:text-white shadow-sm hover:shadow-md transition-shadow">
                      Edit
                    </button>
                  </div>
                  <p className="text-gray-600 dark:text-gray-200 text-sm truncate">
                    user@example.com
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Member since March 2024
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Weather and Moon Section */}
        {showInfoCards && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weatherData && (
              <Card className="p-4 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold dark:text-white mb-1">Current Weather</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{weatherData.current.condition.text}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold dark:text-white">{weatherData.current.temp_c}°C</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Droplets className="h-3.5 w-3.5" />
                        <span>{weatherData.current.humidity}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg border border-black/10 dark:border-white/20 hover:border-black/20 dark:hover:border-white/30 transition-all">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4 text-gray-600 dark:text-gray-200" />
                        <span className="text-sm text-gray-600 dark:text-gray-200">UV Index</span>
                      </div>
                      <p className="text-lg font-semibold mt-1 dark:text-white">{weatherData.current.uv}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-black/10 dark:border-white/20 hover:border-black/20 dark:hover:border-white/30 transition-all">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-gray-600 dark:text-gray-200" />
                        <span className="text-sm text-gray-600 dark:text-gray-200">Pressure</span>
                      </div>
                      <p className="text-lg font-semibold mt-1 dark:text-white">{weatherData.current.pressure_mb} mb</p>
                    </div>
                    <div className="p-3 rounded-lg border border-black/10 dark:border-white/20 hover:border-black/20 dark:hover:border-white/30 transition-all">
                      <div className="flex items-center gap-2">
                        <Wind className="h-4 w-4 text-gray-600 dark:text-gray-200" />
                        <span className="text-sm text-gray-600 dark:text-gray-200">Wind</span>
                      </div>
                      <p className="text-lg font-semibold mt-1 dark:text-white">{weatherData.current.wind_kph} km/h</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-4 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold dark:text-white">Moon Phase</h2>
                <Moon className="h-4 w-4 text-gray-500" />
              </div>
              {moon && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border border-black/10 dark:border-white/20 hover:border-black/20 dark:hover:border-white/30 transition-all flex items-center justify-center">
                      <Moon className="w-10 h-10 text-gray-600 dark:text-gray-200" />
                    </div>
                    <div>
                      <p className="text-base font-semibold dark:text-white">{moon.moon_phase}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{moon.moon_illumination}% illuminated</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg border border-black/10 dark:border-white/20 hover:border-black/20 dark:hover:border-white/30 transition-all">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Moonrise</p>
                      <p className="text-sm font-semibold dark:text-white">{moon.moonrise}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-black/10 dark:border-white/20 hover:border-black/20 dark:hover:border-white/30 transition-all">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Moonset</p>
                      <p className="text-sm font-semibold dark:text-white">{moon.moonset}</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Location Section */}
        {showInfoCards && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {weatherData && (
              <Card className="p-4 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold dark:text-white">Location</h2>
                  <MapPin className="h-4 w-4 text-gray-500" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-gray-100 dark:bg-white/20">
                      <MapPin className="h-4 w-4 text-gray-600 dark:text-gray-200" />
                    </div>
                    <div>
                      <p className="text-sm font-medium dark:text-white">{weatherData.location.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{weatherData.location.country}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-200">
                        <Mountain className="h-3.5 w-3.5" />
                        <span className="text-xs">Elevation</span>
                      </div>
                      <p className="text-sm font-medium dark:text-white">1,234 m</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-200">
                        <Waves className="h-3.5 w-3.5" />
                        <span className="text-xs">Sea Level</span>
                      </div>
                      <p className="text-sm font-medium dark:text-white">+45 m</p>
                    </div>
                  </div>
                  <div className="pt-2 text-xs text-gray-500 dark:text-gray-400">
                    {weatherData.location.lat.toFixed(4)}°N, {weatherData.location.lon.toFixed(4)}°E
                  </div>
                </div>
              </Card>
            )}

            {/* Notes Section */}
            <Card className="p-4 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all md:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold dark:text-white">Notes</h2>
                <div className="flex items-center gap-2">
                  <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="text-blue-500 hover:text-blue-600">
                        Add Note
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Note</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <Input
                          placeholder="Title"
                          value={noteTitle}
                          onChange={handleTitleChange}
                        />
                        <Textarea
                          placeholder="Content"
                          value={noteContent}
                          onChange={handleContentChange}
                          rows={5}
                        />
                        <Button onClick={handleAddNote}>Save Note</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {!user ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">Sign in to view and create notes</p>
                </div>
              ) : notesLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">Loading notes...</p>
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No notes yet. Create your first note!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 rounded-lg border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium dark:text-white">{note.title}</h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditNote(note)}
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                          >
                            <Pencil className="h-4 w-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {note.updatedAt.toDate().toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <Dialog open={isEditNoteOpen} onOpenChange={setIsEditNoteOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Note</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <Input
                      placeholder="Title"
                      value={noteTitle}
                      onChange={handleTitleChange}
                    />
                    <Textarea
                      placeholder="Content"
                      value={noteContent}
                      onChange={handleContentChange}
                      rows={5}
                    />
                    <Button onClick={handleEditNote}>Update Note</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </Card>
          </div>
        )}

        {/* Total Time Card */}
        <Card className="p-4 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all relative">
          <div className="absolute inset-0 bg-white/90 dark:bg-black/90 backdrop-blur-[2px] rounded-xl z-10 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Available Soon</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Currently in Development</p>
            </div>
          </div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold dark:text-white">Total Time</h2>
            <Clock className="h-4 w-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold dark:text-white">
            0h 0m
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            0 sessions completed
          </p>
        </Card>

        {/* Monthly Progress Card */}
        <Card className="p-4 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all relative">
          <div className="absolute inset-0 bg-white/90 dark:bg-black/90 backdrop-blur-[2px] rounded-xl z-10 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Available Soon</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Currently in Development</p>
            </div>
          </div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold dark:text-white">Monthly Progress</h2>
            <BarChart2 className="h-4 w-4 text-gray-500" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Sessions</span>
                <span className="font-medium dark:text-white">0</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: "50%" }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Time</span>
                <span className="font-medium dark:text-white">0h 0m</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: "50%" }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Completion Rate</span>
                <span className="font-medium dark:text-white">0%</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: "50%" }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 