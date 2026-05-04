'use client'

import { useState, useEffect, useRef, useCallback, type ComponentType, type MouseEvent } from 'react'
import { Card } from '@/components/ui/card'
import {
  Clock,
  ArrowUpDown,
  Save,
  Edit,
  X,
  Cloud,
  Wind,
  Moon,
  MapPin,
  Timer,
  Plus,
  Trash2,
  ClipboardList,
  FileText,
  Sun,
  Gauge,
  Sunrise,
  Sunset,
  Activity,
  Users,
  ChevronDown,
  Mic,
  MicOff,
  Image as ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { useNotes } from '@/lib/NotesContext'
import { Note, WeatherSnapshot } from '@/lib/notes'
import { toast } from '@/components/ui/use-toast'
import { WeatherSnapshotPopover } from '@/components/WeatherSnapshotPopover'
import { Timestamp, doc, setDoc, getDoc, type Firestore } from 'firebase/firestore'
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
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { getFirebaseStorage, db } from '@/lib/firebase'

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

async function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => {
      const MAX = 900
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width); width = MAX }
        else { width = Math.round((width * MAX) / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(dataUrl); return }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.72))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

async function uploadNotesBg(dataUrl: string, uid: string): Promise<string> {
  const compressed = await compressImage(dataUrl)
  const response = await fetch(compressed)
  const blob = await response.blob()
  const storage = getFirebaseStorage()
  const fileRef = storageRef(storage, `notes-bg/${uid}/background.jpg`)
  await uploadBytes(fileRef, blob, { contentType: 'image/jpeg' })
  return getDownloadURL(fileRef)
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

// Exact accent hex per wheel — matches clock pages
const CLOCK_HEX = ['#fd290a', '#fba63b', '#f7da5f', '#6dc037', '#156fde', '#941952', '#541b96', '#ee5fa7', '#56c1ff']

type EnvIcon = ComponentType<{ className?: string }>

function EnvMetricRow({
  icon: Icon,
  iconClassName,
  label,
  value,
  valueClassName = 'text-gray-900 dark:text-white',
}: {
  icon: EnvIcon
  iconClassName: string
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-black/10 dark:border-white/20 bg-white/60 dark:bg-black/20">
      <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', iconClassName)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className={cn('text-sm font-semibold leading-tight mt-0.5', valueClassName)}>{value}</p>
      </div>
    </div>
  )
}

function uvPalette(uv: number) {
  if (uv <= 2) return { icon: 'text-emerald-500', value: 'text-emerald-700 dark:text-emerald-400', band: 'Low' }
  if (uv <= 5) return { icon: 'text-yellow-500', value: 'text-yellow-700 dark:text-yellow-400', band: 'Moderate' }
  if (uv <= 7) return { icon: 'text-orange-500', value: 'text-orange-700 dark:text-orange-400', band: 'High' }
  if (uv <= 10) return { icon: 'text-red-500', value: 'text-red-700 dark:text-red-400', band: 'Very high' }
  return { icon: 'text-violet-500', value: 'text-violet-800 dark:text-violet-300', band: 'Extreme' }
}

function aqiPalette(index: number) {
  const table: Record<number, { icon: string; value: string }> = {
    1: { icon: 'text-emerald-500', value: 'text-emerald-700 dark:text-emerald-400' },
    2: { icon: 'text-yellow-500', value: 'text-yellow-800 dark:text-yellow-400' },
    3: { icon: 'text-orange-500', value: 'text-orange-700 dark:text-orange-400' },
    4: { icon: 'text-red-500', value: 'text-red-700 dark:text-red-400' },
    5: { icon: 'text-purple-500', value: 'text-purple-700 dark:text-purple-400' },
    6: { icon: 'text-rose-700', value: 'text-rose-800 dark:text-rose-300' },
  }
  return table[index] ?? { icon: 'text-gray-500', value: 'text-gray-900 dark:text-white' }
}

function sessionGroupDisplay(session: Session): { typeLabel: string; participantsLabel: string } | null {
  if (session.group_participant_count == null || session.is_group_session == null) return null
  const n = session.group_participant_count
  return {
    typeLabel: session.is_group_session ? 'Group session' : 'Solo session',
    participantsLabel: n === 1 ? '1 participant' : `${n} participants`,
  }
}

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
  const [envSnapshotExpanded, setEnvSnapshotExpanded] = useState(false)
  const [savedNotesPanelOpen, setSavedNotesPanelOpen] = useState(true)
  const [pageBackground, setPageBackground] = useState<string | null>(null)
  const bgInputRef = useRef<HTMLInputElement>(null)
  const { playSuccess } = useSoundEffects()

  // Voice input state
  const [isListening, setIsListening] = useState(false)
  const [voiceTarget, setVoiceTarget] = useState<'title' | 'body' | null>(null)
  const [interimTranscript, setInterimTranscript] = useState('')
  const recognitionRef = useRef<any>(null)
  const autoSelectedRef = useRef(false)

  useEffect(() => {
    setEnvSnapshotExpanded(false)
  }, [selectedNote?.id])

  // Load recent sessions
  useEffect(() => {
    const loadSessions = async () => {
      if (!user) return;
      try {
        const sessions = await getUserSessions(user.uid);
        setRecentSessions(sessions);
        // Auto-link to most recent completed session on first load
        if (!autoSelectedRef.current) {
          autoSelectedRef.current = true
          const latest = [...sessions]
            .filter((s) => s.status === 'completed')
            .sort((a, b) => b.start_time.toDate().getTime() - a.start_time.toDate().getTime())[0]
          if (latest) setSelectedSessionId(latest.id)
        }
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

  // Load persisted background from Firestore
  useEffect(() => {
    if (!user) return
    let mounted = true
    ;(async () => {
      let attempts = 0
      while (!db && attempts < 20) {
        await new Promise(r => setTimeout(r, 100))
        attempts++
      }
      if (!db || !mounted) return
      try {
        const snap = await getDoc(doc(db as Firestore, 'users', user.uid, 'preferences', 'notes'))
        if (snap.exists() && mounted) {
          const bg = snap.data()?.background
          if (bg) setPageBackground(bg)
        }
      } catch (err) {
        console.error('Failed to load notes background:', err)
      }
    })()
    return () => { mounted = false }
  }, [user])

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

  const handleBgUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setPageBackground(dataUrl)
      if (user) {
        ;(async () => {
          try {
            const downloadUrl = await uploadNotesBg(dataUrl, user.uid)
            setPageBackground(downloadUrl)
            if (db) {
              await setDoc(
                doc(db as Firestore, 'users', user.uid, 'preferences', 'notes'),
                { background: downloadUrl },
                { merge: true }
              )
            }
          } catch (err) {
            console.error('Notes background upload failed:', err)
          }
        })()
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [user])

  const handleBgClear = useCallback(async () => {
    setPageBackground(null)
    if (user && db) {
      try {
        await setDoc(
          doc(db as Firestore, 'users', user.uid, 'preferences', 'notes'),
          { background: null },
          { merge: true }
        )
      } catch (err) {
        console.error('Failed to clear notes background:', err)
      }
    }
  }, [user])

  // Accent colour for voice UI — matches the linked session's wheel, or a neutral violet
  const voiceAccentColor =
    selectedSessionId !== 'none'
      ? (CLOCK_HEX[recentSessions.find((s) => s.id === selectedSessionId)?.clock_id ?? -1] ?? '#8b5cf6')
      : '#8b5cf6'

  const toggleVoice = (target: 'title' | 'body') => {
    // Stop if already listening (regardless of target)
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      setVoiceTarget(null)
      setInterimTranscript('')
      return
    }

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    if (!SR) {
      toast({ title: 'Voice input not supported', description: 'Please use Chrome or Safari.' })
      return
    }

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      let finalChunk = ''
      let interimChunk = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalChunk += event.results[i][0].transcript
        } else {
          interimChunk += event.results[i][0].transcript
        }
      }
      if (finalChunk) {
        const chunk = finalChunk.trim()
        if (target === 'title') {
          setNoteTitle((prev) => (prev ? prev + ' ' : '') + chunk)
        } else {
          setNoteContent((prev) => (prev ? prev + ' ' : '') + chunk)
        }
        setInterimTranscript('')
      } else {
        setInterimTranscript(interimChunk)
      }
    }

    recognition.onerror = () => {
      setIsListening(false)
      setVoiceTarget(null)
      setInterimTranscript('')
    }

    recognition.onend = () => {
      setIsListening(false)
      setVoiceTarget(null)
      setInterimTranscript('')
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    setVoiceTarget(target)
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

  const openSessionDetailsForNote = (note: Note, e?: MouseEvent) => {
    e?.stopPropagation();
    if (!note.sessionId) return;
    const session = recentSessions.find((s) => s.id === note.sessionId);
    if (!session) return;
    const group = sessionGroupDisplay(session);
    toast({
      title: 'Session Information',
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
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
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
                    ? 'In Progress'
                    : 'Aborted'}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">Start Time</p>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <p className="text-sm font-medium dark:text-white">{session.start_time.toDate().toLocaleString()}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-gray-500" />
                <p className="text-sm font-medium dark:text-white">{Math.round(session.duration / 1000 / 60)} minutes</p>
              </div>
            </div>
          </div>
          {group && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-black/10 dark:border-white/10">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Session type</p>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-500 shrink-0" />
                  <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{group.typeLabel}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Participants</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{group.participantsLabel}</p>
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <p className="text-xs text-gray-500 dark:text-gray-400">Nodes</p>
            <div className="flex flex-wrap gap-1.5">
              {session.words.map((word, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
                  style={{
                    backgroundColor: `${CLOCK_HEX[session.clock_id]}18`,
                    color: CLOCK_HEX[session.clock_id],
                    border: `1px solid ${CLOCK_HEX[session.clock_id]}40`,
                  }}
                >
                  <span className="opacity-50 font-normal">{i + 1}</span>
                  {word.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
      ),
    });
  };

  const showEnvironmentSnapshotGrid =
    !(selectedNote && !isEditing) &&
    ((weatherData && moon && !selectedNote) || Boolean(selectedNote?.weatherSnapshot));

  if (!user) {
    return (
      <div className="h-full overflow-hidden flex flex-col bg-gray-50 dark:bg-black/95">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-7xl mx-auto pl-16 pr-4 py-6">
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
    <div className={cn('h-full overflow-hidden flex flex-col relative', pageBackground ? 'bg-black' : 'bg-gray-50 dark:bg-black/95')}>
      {/* Custom background image + dark overlay */}
      {pageBackground && (
        <>
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            backgroundImage: `url(${pageBackground})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }} />
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            background: 'rgba(0,0,0,0.55)', pointerEvents: 'none',
          }} />
        </>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto" style={{ position: 'relative', zIndex: 1 }}>
        <div className="max-w-7xl mx-auto pl-16 pr-4 py-6">
          <div className="mb-6 flex flex-col gap-4">
            <div className="min-w-0">
              <h1 className={cn('text-2xl font-bold tracking-tight', pageBackground ? 'text-white' : 'text-gray-900 dark:text-white')}>Notes</h1>
              <p className={cn('text-sm mt-1 max-w-xl', pageBackground ? 'text-white/60' : 'text-gray-500 dark:text-gray-400')}>
                Write with optional session and environment context—saved notes stay easy to scan in the list.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
              {/* Left controls: panel toggle + background image */}
              <div className="flex items-center gap-2 self-start">
                <button
                  type="button"
                  onClick={() => setSavedNotesPanelOpen((open) => !open)}
                  aria-expanded={savedNotesPanelOpen}
                  aria-controls={savedNotesPanelOpen ? 'notes-saved-list-panel' : undefined}
                  id="notes-saved-list-toggle"
                  title={savedNotesPanelOpen ? 'Hide the saved notes list' : 'Show the saved notes list'}
                  aria-label={savedNotesPanelOpen ? 'Hide saved notes panel' : 'Show saved notes panel'}
                  className={cn(
                    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    savedNotesPanelOpen
                      ? 'border-slate-300 bg-transparent text-slate-700 hover:bg-slate-100/90 focus-visible:ring-slate-400/50 dark:border-white/25 dark:text-white dark:hover:bg-white/10 dark:focus-visible:ring-white/30'
                      : 'border-blue-500 bg-transparent text-blue-600 hover:bg-blue-50 focus-visible:ring-blue-500/45 dark:border-blue-400/85 dark:text-blue-400 dark:hover:bg-blue-950/35 dark:focus-visible:ring-blue-400/40'
                  )}
                >
                  <ClipboardList className="h-6 w-6" aria-hidden />
                </button>

                {/* Background image controls */}
                <input
                  ref={bgInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBgUpload}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => bgInputRef.current?.click()}
                  title={pageBackground ? 'Change background image' : 'Set a background image'}
                  className={cn(
                    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                    pageBackground
                      ? 'border-blue-500 bg-transparent text-blue-500 hover:bg-blue-50/10 focus-visible:ring-blue-500/45 dark:border-blue-400/85 dark:text-blue-400 dark:hover:bg-blue-950/35 dark:focus-visible:ring-blue-400/40'
                      : 'border-slate-300 bg-transparent text-slate-500 hover:bg-slate-100/90 focus-visible:ring-slate-400/50 dark:border-white/25 dark:text-white/60 dark:hover:bg-white/10 dark:focus-visible:ring-white/30'
                  )}
                >
                  <ImageIcon className="h-5 w-5" aria-hidden />
                </button>
                {pageBackground && (
                  <button
                    type="button"
                    onClick={handleBgClear}
                    title="Remove background image"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 dark:border-white/20 bg-transparent text-slate-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:border-red-400 dark:hover:border-red-400/60 transition-colors"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </div>

              {(!selectedNote || isEditing) && (
                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={!canSave}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 rounded-xl border-2 border-transparent bg-transparent px-5 py-3 min-h-[3rem] w-full sm:w-auto sm:shrink-0 self-end sm:self-auto',
                    'text-base font-semibold text-green-600 dark:text-green-400',
                    'transition-colors',
                    'hover:bg-white hover:text-green-700 dark:hover:bg-white dark:hover:text-green-600 hover:shadow-sm',
                    'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:shadow-none disabled:dark:hover:bg-transparent',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/40 focus-visible:ring-offset-2'
                  )}
                >
                  <Save className="h-6 w-6" aria-hidden />
                  Save
                </button>
              )}
            </div>
          </div>
          <div
            className={cn(
              'grid grid-cols-1 gap-4 md:gap-6',
              savedNotesPanelOpen && 'md:grid-cols-3'
            )}
          >
          {/* Left Column: Saved Notes */}
          {savedNotesPanelOpen && (
          <div
            id="notes-saved-list-panel"
            role="region"
            aria-labelledby="notes-saved-list-toggle"
            className="space-y-4"
          >
            <Card className="card p-3 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <ClipboardList className="h-3.5 w-3.5 text-gray-500 shrink-0" />
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
                              type="button"
                              className="p-1 rounded-md group transition-colors"
                              onClick={(e) => openSessionDetailsForNote(note, e)}
                            >
                              {(() => {
                                const session = recentSessions.find((s) => s.id === note.sessionId);
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
                      {note.sessionId &&
                        (() => {
                          const s = recentSessions.find((x) => x.id === note.sessionId)
                          const g = s ? sessionGroupDisplay(s) : null
                          if (!g) return null
                          return (
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-indigo-600 dark:text-indigo-400">
                              <Users className="h-3 w-3 shrink-0" aria-hidden />
                              <span>
                                {g.typeLabel} · {g.participantsLabel}
                              </span>
                            </div>
                          )
                        })()}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
          )}

          {/* Right Column: Write/View Note */}
          <div className={cn(savedNotesPanelOpen && 'md:col-span-2')}>
            <Card className="card p-4 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all">
              <div
                className={cn(
                  'flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between',
                  selectedNote && !isEditing ? 'mb-2' : 'mb-3'
                )}
              >
                <div>
                  {selectedNote && !isEditing ? (
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                      <h2 className="text-sm font-semibold dark:text-white">View note</h2>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold dark:text-white">
                          {selectedNote ? 'Edit note' : 'Write a note'}
                        </h2>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Title and body are required to save.
                      </p>
                    </>
                  )}
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

              {selectedNote && !isEditing && (
                <div
                  className={cn(
                    'note-item p-3 rounded-lg border mb-4',
                    'bg-gray-50 dark:bg-black/20 border-black/5 dark:border-white/10'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium dark:text-white truncate min-w-0">{noteTitle}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      {selectedNote.weatherSnapshot && (
                        <WeatherSnapshotPopover weatherSnapshot={selectedNote.weatherSnapshot}>
                          <button
                            type="button"
                            className="p-1 rounded-md hover:bg-blue-100 dark:hover:bg-blue-500/20 group transition-colors"
                          >
                            <Cloud className="h-5 w-5 text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                          </button>
                        </WeatherSnapshotPopover>
                      )}
                      {selectedNote.sessionId && (
                        <button
                          type="button"
                          className="p-1 rounded-md group transition-colors"
                          onClick={() => openSessionDetailsForNote(selectedNote)}
                        >
                          {(() => {
                            const session = recentSessions.find((s) => s.id === selectedNote.sessionId);
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
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      {formatDate(selectedNote.updatedAt)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 whitespace-pre-wrap break-words">
                    {noteContent}
                  </p>
                  {selectedNote.sessionId &&
                    (() => {
                      const s = recentSessions.find((x) => x.id === selectedNote.sessionId)
                      const g = s ? sessionGroupDisplay(s) : null
                      if (!g) return null
                      return (
                        <div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-black/5 dark:border-white/10">
                          <Users className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" aria-hidden />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {g.typeLabel} ·{' '}
                            <span className="font-medium text-gray-800 dark:text-gray-200">{g.participantsLabel}</span>
                          </span>
                        </div>
                      )
                    })()}
                </div>
              )}

              {showEnvironmentSnapshotGrid && (
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={() => setEnvSnapshotExpanded((open) => !open)}
                    aria-label={
                      envSnapshotExpanded ? 'Hide environment snapshot' : 'Show environment snapshot'
                    }
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-colors',
                      'border-black/10 dark:border-white/15',
                      'bg-gray-50/80 hover:bg-gray-100/90 dark:bg-black/25 dark:hover:bg-black/35',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-black/95'
                    )}
                    aria-expanded={envSnapshotExpanded}
                    aria-controls="notes-env-snapshot-panel"
                    id="notes-env-snapshot-toggle"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Cloud className="h-4 w-4 shrink-0 text-sky-500 dark:text-sky-400" aria-hidden />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-200">Environment snapshot</span>
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400 transition-transform duration-200',
                        envSnapshotExpanded && 'rotate-180'
                      )}
                      aria-hidden
                    />
                  </button>
                  <div
                    id="notes-env-snapshot-panel"
                    role="region"
                    aria-labelledby="notes-env-snapshot-toggle"
                    hidden={!envSnapshotExpanded}
                    className="space-y-2 pt-2"
                  >
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

                  {selectedNote?.weatherSnapshot ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                      {(() => {
                        const snap = selectedNote.weatherSnapshot
                        const uv = uvPalette(snap.uvIndex)
                        return (
                          <>
                            <EnvMetricRow
                              icon={Wind}
                              iconClassName="text-teal-500 dark:text-teal-400"
                              label="Wind"
                              value={`${snap.wind.speed} km/h ${snap.wind.direction}`}
                            />
                            <EnvMetricRow
                              icon={Gauge}
                              iconClassName="text-purple-500 dark:text-purple-400"
                              label="Air pressure"
                              value={`${snap.airPressure} mb`}
                            />
                            <EnvMetricRow
                              icon={Sun}
                              iconClassName={uv.icon}
                              label="UV index"
                              value={`${snap.uvIndex} · ${uv.band}`}
                              valueClassName={uv.value}
                            />
                            <EnvMetricRow
                              icon={Sunrise}
                              iconClassName="text-amber-500 dark:text-amber-400"
                              label="Moonrise"
                              value={snap.moon.moonrise}
                            />
                            <EnvMetricRow
                              icon={Sunset}
                              iconClassName="text-sky-500 dark:text-sky-400"
                              label="Moonset"
                              value={snap.moon.moonset}
                            />
                          </>
                        )
                      })()}
                    </div>
                  ) : weatherData && moon ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                      {(() => {
                        const uv = uvPalette(weatherData.current.uv)
                        const aqiIndex = weatherData.current.air_quality?.['us-epa-index']
                        const aqiStyles =
                          typeof aqiIndex === 'number' ? aqiPalette(aqiIndex) : null
                        const aqiLabel =
                          typeof aqiIndex === 'number'
                            ? `${getAQIDescription(aqiIndex)} (US EPA ${aqiIndex})`
                            : 'No data from provider'
                        return (
                          <>
                            <EnvMetricRow
                              icon={Wind}
                              iconClassName="text-teal-500 dark:text-teal-400"
                              label="Wind"
                              value={`${weatherData.current.wind_kph} km/h ${weatherData.current.wind_dir}`}
                            />
                            <EnvMetricRow
                              icon={Gauge}
                              iconClassName="text-purple-500 dark:text-purple-400"
                              label="Air pressure"
                              value={`${weatherData.current.pressure_mb} hPa`}
                            />
                            <EnvMetricRow
                              icon={Sun}
                              iconClassName={uv.icon}
                              label="UV index"
                              value={`${weatherData.current.uv} · ${uv.band}`}
                              valueClassName={uv.value}
                            />
                            <EnvMetricRow
                              icon={Activity}
                              iconClassName={aqiStyles?.icon ?? 'text-gray-500 dark:text-gray-400'}
                              label="Air quality (AQI)"
                              value={aqiLabel}
                              valueClassName={
                                aqiStyles?.value ?? 'text-gray-600 dark:text-gray-400'
                              }
                            />
                            <EnvMetricRow
                              icon={Sunrise}
                              iconClassName="text-amber-500 dark:text-amber-400"
                              label="Moonrise"
                              value={moon.moonrise}
                            />
                            <EnvMetricRow
                              icon={Sunset}
                              iconClassName="text-sky-500 dark:text-sky-400"
                              label="Moonset"
                              value={moon.moonset}
                            />
                          </>
                        )
                      })()}
                    </div>
                  ) : null}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {(!selectedNote || isEditing) && (
                  <>
                    {/* Title */}
                    <div className="space-y-1.5">
                      <label htmlFor="note-title" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Title
                      </label>
                      <div className="flex gap-2">
                        <Input
                          id="note-title"
                          placeholder="Give your note a short title"
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                          className="bg-white dark:bg-black/40 flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => toggleVoice('title')}
                          title={isListening && voiceTarget === 'title' ? 'Stop recording' : 'Dictate title'}
                          className={cn(
                            'flex items-center justify-center w-10 h-10 rounded-lg border-2 shrink-0 transition-all',
                            isListening && voiceTarget === 'title'
                              ? 'border-transparent animate-pulse text-white'
                              : 'border-black/10 dark:border-white/15 bg-white dark:bg-black/40 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white'
                          )}
                          style={
                            isListening && voiceTarget === 'title'
                              ? { backgroundColor: voiceAccentColor }
                              : {}
                          }
                        >
                          {isListening && voiceTarget === 'title' ? (
                            <MicOff className="h-4 w-4" />
                          ) : (
                            <Mic className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Body + voice button */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="note-body" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Note
                        </label>
                        <button
                          type="button"
                          onClick={() => toggleVoice('body')}
                          title={isListening && voiceTarget === 'body' ? 'Stop recording' : 'Dictate note'}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all',
                            isListening && voiceTarget === 'body'
                              ? 'border-transparent animate-pulse text-white'
                              : 'border-black/10 dark:border-white/15 bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                          )}
                          style={
                            isListening && voiceTarget === 'body'
                              ? { backgroundColor: voiceAccentColor }
                              : {}
                          }
                        >
                          {isListening && voiceTarget === 'body' ? (
                            <><MicOff className="h-3.5 w-3.5" /><span>Stop</span></>
                          ) : (
                            <><Mic className="h-3.5 w-3.5" /><span>Voice</span></>
                          )}
                        </button>
                      </div>
                      <Textarea
                        id="note-body"
                        placeholder="Write freely—everything saves to your account."
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        className="min-h-[280px] sm:min-h-[360px] md:min-h-[420px] resize-y text-sm bg-white dark:bg-black/40"
                      />
                      {isListening && voiceTarget === 'body' && (
                        <p
                          className="text-xs italic px-1 min-h-[1.25rem] transition-colors"
                          style={{ color: voiceAccentColor }}
                        >
                          {interimTranscript || 'Listening…'}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Session link — after title/body so the writing comes first */}
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
                              <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: CLOCK_HEX[session.clock_id] }}
                              />
                              <span
                                className="font-medium"
                                style={{ color: CLOCK_HEX[session.clock_id] }}
                              >
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
                        const groupMeta = sessionGroupDisplay(session)
                        const hex = CLOCK_HEX[session.clock_id]
                        return (
                          <div className="rounded-md border border-black/5 dark:border-white/10 bg-white/80 dark:bg-black/30 p-2.5 space-y-2">
                            {/* Wheel + status */}
                            <div className="flex flex-wrap items-center gap-2">
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: hex }}
                              />
                              <span className="text-sm font-semibold" style={{ color: hex }}>
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
                            {/* Node pills */}
                            <div className="flex flex-wrap gap-1.5">
                              {session.words.map((word, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
                                  style={{
                                    backgroundColor: `${hex}18`,
                                    color: hex,
                                    border: `1px solid ${hex}40`,
                                  }}
                                >
                                  <span className="opacity-50 font-normal">{i + 1}</span>
                                  {word.toUpperCase()}
                                </span>
                              ))}
                            </div>
                            {/* Meta */}
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
                            {groupMeta && (
                              <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 dark:text-indigo-400">
                                <Users className="h-3 w-3 shrink-0" aria-hidden />
                                <span>{groupMeta.typeLabel} · {groupMeta.participantsLabel}</span>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
