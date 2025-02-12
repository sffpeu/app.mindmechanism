'use client'

import { useEffect, useState } from 'react'
import { Menu } from '@/components/Menu'
import { Card } from '@/components/ui/card'
import { Calendar, Clock, Cloud, Droplets, Gauge, Wind, Moon, ClipboardList, BookOpen, Sun, MapPin, Mountain, Waves, User, BarChart2, Pencil, Trash2, Globe, RefreshCw, CheckCircle2, Pause, XCircle, Users, Share2, Cpu, Wifi, Battery } from 'lucide-react'
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
import Link from 'next/link'
import { getUserStats, getUserSessions } from '@/lib/sessions'
import { Timestamp } from 'firebase/firestore'
import { startTimeTracking, endTimeTracking, calculateUserTimeStats } from '@/lib/timeTracking'
import { DashboardRecentSessions } from '@/components/DashboardRecentSessions'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { EditProfileModal } from '@/components/auth/EditProfileModal'
import { Clock as ClockIcon } from 'lucide-react'
import { Session } from '@/lib/sessions'

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

interface UserStats {
  totalTime: number
  totalSessions: number
  completionRate: number
  monthlyProgress: {
    totalSessions: number
    totalTime: number
    completionRate: number
  }
}

interface FirebaseUser {
  uid: string
  photoURL: string | null
  displayName: string | null
  email: string | null
  metadata: {
    creationTime?: string
    lastSignInTime?: string
  }
}

interface TimeStats {
  totalTime: number;
  monthlyTime: number;
  lastSignInTime: Date | null;
}

const clockColors = [
  'bg-[#fd290a]', // 1. Red
  'bg-[#fba63b]', // 2. Orange
  'bg-[#f7da5f]', // 3. Yellow
  'bg-[#6dc037]', // 4. Green
  'bg-[#156fde]', // 5. Blue
  'bg-[#941952]', // 6. Dark Pink
  'bg-[#541b96]', // 7. Purple
  'bg-[#ee5fa7]', // 8. Pink
  'bg-[#56c1ff]', // 9. Light Blue
];

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
];

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
  const { user } = useAuth() as { user: FirebaseUser | null }
  const { notes, isLoading: notesLoading, addNote, editNote, removeNote } = useNotes()
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false)
  const [isEditNoteOpen, setIsEditNoteOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [userStats, setUserStats] = useState<UserStats>({
    totalTime: 0,
    totalSessions: 0,
    completionRate: 0,
    monthlyProgress: {
      totalSessions: 0,
      totalTime: 0,
      completionRate: 0
    }
  })
  const [recentSessions, setRecentSessions] = useState<Session[]>([])
  const [timeStats, setTimeStats] = useState<TimeStats>({ 
    totalTime: 0, 
    monthlyTime: 0, 
    lastSignInTime: null 
  })
  const [timeEntryId, setTimeEntryId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)

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

  // Load user stats and sessions
  useEffect(() => {
    if (user?.uid) {
      loadUserStats()
      loadRecentSessions()
    }
  }, [user?.uid])

  const loadUserStats = async () => {
    if (!user?.uid) return
    
    try {
      const stats = await getUserStats(user.uid)
      setUserStats(stats)
    } catch (error) {
      console.error('Error loading user stats:', error)
    }
  }

  const loadRecentSessions = async () => {
    if (!user?.uid) return
    
    try {
      const sessions = await getUserSessions(user.uid)
      setRecentSessions(sessions)
    } catch (error) {
      console.error('Error loading recent sessions:', error)
    }
  }

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

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

  // Get recent notes
  const recentNotes = notes?.slice(0, 3) || []

  // Load time stats
  const loadTimeStats = async () => {
    if (!user?.uid) return;
    
    try {
      const stats = await calculateUserTimeStats(user.uid);
      setTimeStats(stats);
    } catch (error) {
      console.error('Error loading time stats:', error);
    }
  };

  // Load all stats
  const loadAllStats = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadUserStats(),
        loadTimeStats(),
        loadRecentSessions()
      ]);
    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load stats on mount and when user changes
  useEffect(() => {
    if (user?.uid) {
      loadAllStats();
    }
  }, [user?.uid]);

  // Start time tracking when the page loads
  useEffect(() => {
    let entryId: string | null = null;
    
    const startTracking = async () => {
      if (user?.uid) {
        entryId = await startTimeTracking(user.uid, 'dashboard');
        setTimeEntryId(entryId);
      }
    };

    startTracking();

    // End time tracking when the user leaves the page
    return () => {
      if (entryId) {
        endTimeTracking(entryId);
      }
    };
  }, [user?.uid]);

  if (!mounted) {
    return null
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-black/95">
        <Menu
          showElements={showElements}
          onToggleShow={() => setShowElements(!showElements)}
          showSatellites={showSatellites}
          onSatellitesChange={setShowSatellites}
        />
        <div className="max-w-6xl mx-auto space-y-4 p-4">
          {/* Profile and Progress Section */}
          {showInfoCards && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Time Card */}
              <Card className="p-4 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold dark:text-white">Time</h2>
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

              {/* Profile Card */}
              <Card className="p-4 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/20 flex items-center justify-center">
                    <span className="text-xl font-semibold dark:text-white">
                      {user?.displayName?.[0] || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-lg font-semibold dark:text-white truncate">
                        {user?.displayName || 'User'}
                      </h2>
                      <button 
                        onClick={() => setIsEditProfileOpen(true)}
                        className="px-3 py-1.5 text-sm bg-white dark:bg-white/20 rounded-md dark:text-white shadow-sm hover:shadow-md transition-shadow">
                        Edit
                      </button>
                    </div>
                    <p className="text-base text-gray-600 dark:text-gray-200 truncate">
                      {user?.email || 'user@example.com'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Member since March 2024
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Weather, Moon, and Sessions Section */}
          {showInfoCards && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Weather and Moon */}
              <div className="space-y-4">
                {/* Weather Card */}
                {weatherData && (
                  <Card className="p-4 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-semibold dark:text-white mb-1">Current Weather</h2>
                          <p className="text-base text-gray-500 dark:text-gray-400">{weatherData.current.condition.text}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold dark:text-white">{weatherData.current.temp_c}°C</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
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

                {/* Moon Card */}
                <Card className="p-4 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold dark:text-white">Moon Phase</h2>
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
                          <p className="text-base font-semibold dark:text-white">{moon.moonrise}</p>
                        </div>
                        <div className="p-3 rounded-lg border border-black/10 dark:border-white/20 hover:border-black/20 dark:hover:border-white/30 transition-all">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Moonset</p>
                          <p className="text-base font-semibold dark:text-white">{moon.moonset}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* Right Column: Sessions Card (spans full height) */}
              <Card className="p-4 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all h-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold dark:text-white">Sessions</h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={loadAllStats}
                      disabled={isRefreshing}
                      className={`h-6 w-6 ${isRefreshing ? 'animate-spin' : ''}`}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    <ClockIcon className="h-3.5 w-3.5 text-gray-500" />
                  </div>
                </div>
                <div className="space-y-6">
                  {/* Session Type Breakdown */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Completed</span>
                      </div>
                      <span className="text-lg font-medium text-gray-900 dark:text-white">
                        {recentSessions.filter(s => s.status === 'completed').length}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <Pause className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">In Progress</span>
                      </div>
                      <span className="text-lg font-medium text-gray-900 dark:text-white">
                        {recentSessions.filter(s => s.status === 'in_progress').length}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Aborted</span>
                      </div>
                      <span className="text-lg font-medium text-gray-900 dark:text-white">
                        {recentSessions.filter(s => s.status === 'aborted').length}
                      </span>
                    </div>
                  </div>

                  {/* Recent Sessions */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium text-gray-900 dark:text-white">Recent Sessions</h3>
                      <Link 
                        href="/sessions" 
                        className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      >
                        View All
                      </Link>
                    </div>
                    <div className="space-y-2">
                      <DashboardRecentSessions sessions={recentSessions} />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Location, Connect, and Device Section */}
          {showInfoCards && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {weatherData && (
                <Card className="p-4 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold dark:text-white">Location</h2>
                    <MapPin className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-full bg-gray-100 dark:bg-white/20">
                        <MapPin className="h-4 w-4 text-gray-600 dark:text-gray-200" />
                      </div>
                      <div>
                        <p className="text-base font-medium dark:text-white">{weatherData.location.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{weatherData.location.country}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-200">
                          <Mountain className="h-3.5 w-3.5" />
                          <span className="text-sm">Elevation</span>
                        </div>
                        <p className="text-base font-medium dark:text-white">1,234 m</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-200">
                          <Waves className="h-3.5 w-3.5" />
                          <span className="text-sm">Sea Level</span>
                        </div>
                        <p className="text-base font-medium dark:text-white">+45 m</p>
                      </div>
                    </div>
                    <div className="pt-2 text-sm text-gray-500 dark:text-gray-400">
                      {weatherData.location.lat.toFixed(4)}°N, {weatherData.location.lon.toFixed(4)}°E
                    </div>
                  </div>
                </Card>
              )}

              {/* Connect Card */}
              <Card className="p-3 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-semibold dark:text-white">Connect</h2>
                  <Users className="h-4 w-4 text-gray-500" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                        <Share2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium dark:text-white">Share Session</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Create & share with others</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs">
                      Create
                    </Button>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ring-2 ring-white dark:ring-black">
                          <span className="text-[10px] text-gray-600 dark:text-gray-300 font-medium">JD</span>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ring-2 ring-white dark:ring-black">
                          <span className="text-[10px] text-gray-600 dark:text-gray-300 font-medium">AS</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">2 users connected</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Device Card */}
              <Card className="p-3 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-semibold dark:text-white">Device</h2>
                  <Cpu className="h-4 w-4 text-gray-500" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                        <Wifi className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium dark:text-white">Mindmechanism</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">No device connected</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs">
                      Connect
                    </Button>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Battery className="h-3.5 w-3.5 text-gray-500" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Battery</span>
                      </div>
                      <span className="text-xs font-medium text-gray-900 dark:text-white">N/A</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Notes and Sessions Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recent Notes Card */}
            <Card className="p-3 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold dark:text-white">Recent Notes</h2>
                <div className="flex items-center gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5 text-gray-500" />
                  <Link href="/notes" className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
                    View All
                  </Link>
                </div>
              </div>
              <div className="space-y-1.5">
                {recentNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-2 rounded-lg bg-gray-50 dark:bg-black/20 border border-black/5 dark:border-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium dark:text-white truncate max-w-[80%]">{note.title}</h3>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditNote(note)}
                          className="p-0.5 rounded-md hover:bg-gray-200 dark:hover:bg-white/10"
                        >
                          <Pencil className="h-3.5 w-3.5 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-0.5 rounded-md hover:bg-gray-200 dark:hover:bg-white/10"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-gray-500" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mt-0.5">{note.content}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {note.updatedAt.toDate().toLocaleString()}
                    </p>
                  </div>
                ))}
                {recentNotes.length === 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">No notes yet</p>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Add EditProfileModal */}
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
        />
      </div>
    </ProtectedRoute>
  )