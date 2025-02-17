'use client'

import { useEffect, useState } from 'react'
import { Menu } from '@/components/Menu'
import { Card } from '@/components/ui/card'
import { Calendar, Clock, Cloud, Droplets, Gauge, Wind, Moon, ClipboardList, BookOpen, Sun, MapPin, Mountain, Waves, User, BarChart2, Pencil, Trash2, Globe, RefreshCw, CheckCircle2, Pause, XCircle, Users, Share2, Cpu, Wifi, Battery, Eye } from 'lucide-react'
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
import { Clock as ClockIcon } from 'lucide-react'
import { Session } from '@/lib/sessions'
import { WeatherSnapshot } from '@/lib/notes'
import { WeatherSnapshotPopover } from '@/components/WeatherSnapshotPopover'
import { toast } from '@/components/ui/use-toast'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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
      'us-epa-index': number
    }
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

const WEATHER_API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;

const getWeatherInfo = (metric: string) => {
  const info = {
    temperature: "Temperature is a measure of how hot or cold the air is. It affects everything from human comfort to plant growth and is measured in degrees Celsius (°C).",
    humidity: "Humidity shows the amount of water vapor in the air. High humidity can make it feel warmer than it is and affect comfort and health.",
    uvIndex: "The UV Index indicates the intensity of ultraviolet radiation from the sun. Higher values (>3) mean greater risk of sun damage to skin and eyes.",
    pressure: "Air pressure, measured in hectopascals (hPa), indicates the weight of air above us. Changes in pressure often signal incoming weather changes.",
    wind: "Wind speed and direction affect weather patterns, temperature feel, and can indicate incoming weather changes. Direction shows where the wind is coming from.",
    airQuality: "Air Quality Index (AQI) measures the cleanliness of the air we breathe. It considers multiple pollutants and their impact on human health.",
    moonPhase: "The moon's phase shows how much of its surface appears illuminated from Earth. It affects tides, nocturnal animal behavior, and has cultural significance.",
    moonrise: "Moonrise time marks when the moon appears above the horizon. This timing varies daily and affects nighttime visibility.",
    moonset: "Moonset time indicates when the moon disappears below the horizon. Understanding moonset helps plan nighttime activities and observations.",
    illumination: "Moon illumination percentage shows how much of the moon's surface appears lit from Earth. This affects nighttime brightness and visibility."
  };
  return info[metric as keyof typeof info] || "No information available";
};

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
  const { user, loading: authLoading } = useAuth()
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
  const [showRecentSessions, setShowRecentSessions] = useState(true)
  const [isInitializing, setIsInitializing] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [isWeatherLoading, setIsWeatherLoading] = useState(false)

  const getAQIDescription = (index: number) => {
    const descriptions = {
      1: 'Good',
      2: 'Moderate',
      3: 'Unhealthy for sensitive groups',
      4: 'Unhealthy',
      5: 'Very Unhealthy',
      6: 'Hazardous'
    };
    return descriptions[index as keyof typeof descriptions] || 'Unknown';
  };

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
    if (!mounted) return;

    const getLocation = () => {
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
            // Don't show error to user, just fall back to IP-based location
            setLocation(null);
            setLocationError(null);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      } else {
        setLocation(null);
        setLocationError(null);
      }
    };

    getLocation();
  }, [mounted]);

  // Fetch weather and moon data
  useEffect(() => {
    if (!mounted) return;

    const fetchData = async () => {
      setIsWeatherLoading(true);
      try {
        const weatherRes = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=6cb652a81cb64a19a84103447252001&q=${
            location ? `${location.lat},${location.lon}` : 'auto:ip'
          }&aqi=yes`
        );
        if (!weatherRes.ok) {
          throw new Error('Weather API request failed');
        }
        const weatherData = await weatherRes.json();
        setWeatherData(weatherData);
        setWeatherError(null);

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
        setWeatherError(error instanceof Error ? error.message : 'Failed to load weather data');
      } finally {
        setIsWeatherLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, [mounted, location]);

  // Handle authentication and initialization
  useEffect(() => {
    let mounted = true;
    
    const initializeDashboard = async () => {
      try {
        if (!mounted) return;
        setIsInitializing(true);
        setAuthError(null);

        // Wait for auth to be ready
        if (authLoading) return;

        // Redirect if not authenticated
        if (!user) {
          console.log('User not authenticated, redirecting to login');
          router.push('/login');
          return;
        }

        console.log('Starting dashboard initialization...');
        
        // Load all necessary data in a single Promise.all
        const [stats, sessions, timeStatsData] = await Promise.all([
          getUserStats(user.uid),
          getUserSessions(user.uid),
          calculateUserTimeStats(user.uid)
        ]);

        if (!mounted) return;

        // Update all state at once to prevent multiple re-renders
        setUserStats(stats);
        setRecentSessions(sessions);
        setTimeStats(timeStatsData);
        
        console.log('Dashboard initialization complete');
        setIsInitializing(false);
      } catch (error) {
        console.error('Dashboard initialization failed:', error);
        if (!mounted) return;
        setAuthError(error instanceof Error ? error.message : 'Failed to load dashboard');
        setIsInitializing(false);
      }
    };

    initializeDashboard();

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, [user?.uid, authLoading]); // Only depend on user.uid and authLoading

  // Remove the separate useEffects for loadUserStats and loadRecentSessions
  // since they're now handled in the initialization effect

  // Keep the refresh function for manual updates
  const loadAllStats = async () => {
    if (!user?.uid) return;
    
    setIsRefreshing(true);
    try {
      console.log('Manually refreshing dashboard stats...');
      const [stats, sessions, timeStatsData] = await Promise.all([
        getUserStats(user.uid),
        getUserSessions(user.uid),
        calculateUserTimeStats(user.uid)
      ]);

      setUserStats(stats);
      setRecentSessions(sessions);
      setTimeStats(timeStatsData);
      console.log('Manual refresh complete');
    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Start time tracking when the page loads
  useEffect(() => {
    let entryId: string | null = null;
    let mounted = true;
    
    const startTracking = async () => {
      if (user?.uid && mounted) {
        console.log('Starting time tracking...');
        entryId = await startTimeTracking(user.uid, 'dashboard');
        if (mounted) {
          setTimeEntryId(entryId);
        }
      }
    };

    startTracking();

    // Cleanup function
    return () => {
      mounted = false;
      if (entryId) {
        console.log('Ending time tracking...');
        endTimeTracking(entryId);
      }
    };
  }, [user?.uid]); // Only depend on user.uid

  // Show loading state
  if (isInitializing || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <XCircle className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-600 dark:text-gray-300">{authError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!mounted) {
    return null
  }

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
      });
      return;
    }

    try {
      const weatherSnapshot = createWeatherSnapshot();
      if (selectedNote && isEditNoteOpen) {
        await editNote(selectedNote.id, noteTitle, noteContent);
      } else {
        await addNote(noteTitle, noteContent);
      }
      setNoteTitle('');
      setNoteContent('');
      setSelectedNote(null);
      setIsAddNoteOpen(false);
      setIsEditNoteOpen(false);
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save note'
      });
    }
  };

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
          {/* Time and User Profile Section */}
          {showInfoCards && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Time Card */}
              <Card className="p-3 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-semibold dark:text-white">Time</h2>
                  <ClockIcon className="h-4 w-4 text-gray-500" />
                </div>
                <p className="text-3xl font-bold dark:text-white tracking-tight">
                  {formatTime(currentTime)}
                </p>
              </Card>

              {/* User Profile Card */}
              {user && (
                <Card className="p-4 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-semibold dark:text-white">Profile</h2>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      {user.photoURL && (
                        <img src={user.photoURL} alt="Profile" className="w-12 h-12 rounded-full" />
                      )}
                      <div>
                        <p className="font-medium dark:text-white">{user.displayName || 'User'}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <p>Last sign in: {timeStats.lastSignInTime ? timeStats.lastSignInTime.toLocaleString() : 'N/A'}</p>
                      <p>Member since {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' }) : 'N/A'}</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Location, Connect, and Device Section */}
          {showInfoCards && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Location Card */}
              {weatherData && (
                <Card className="p-3 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-semibold dark:text-white">Location</h2>
                    <MapPin className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-base font-medium dark:text-white">{weatherData.location.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {weatherData.location.region && `${weatherData.location.region}, `}{weatherData.location.country}
                        </p>
                      </div>
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

          {/* Weather and Moon Section */}
          {showInfoCards && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weatherData && (
                <Card className="p-4 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-semibold dark:text-white mb-1">Current Weather</h2>
                        {isWeatherLoading ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
                        ) : weatherError ? (
                          <p className="text-sm text-red-500">{weatherError}</p>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{weatherData.current.condition.text}</p>
                        )}
                      </div>
                      {!weatherError && (
                        <div className="text-right">
                          <p className="text-3xl font-bold dark:text-white">{weatherData.current.temp_c}°C</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Droplets className="h-3.5 w-3.5" />
                            <span>{weatherData.current.humidity}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {!weatherError && (
                      <div className="grid grid-cols-4 gap-3">
                        <Popover>
                          <PopoverTrigger asChild>
                            <div className="p-2 rounded-lg border border-black/10 dark:border-white/20 hover:border-black/20 dark:hover:border-white/30 transition-all cursor-help">
                              <div className="flex items-center gap-1.5">
                                <Sun className="h-3.5 w-3.5 text-gray-600 dark:text-gray-200" />
                                <span className="text-xs text-gray-600 dark:text-gray-200">UV Index</span>
                              </div>
                              <p className="text-base font-semibold mt-1 dark:text-white">{weatherData.current.uv}</p>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-72">
                            <p className="text-sm">{getWeatherInfo('uvIndex')}</p>
                          </PopoverContent>
                        </Popover>

                        <Popover>
                          <PopoverTrigger asChild>
                            <div className="p-2 rounded-lg border border-black/10 dark:border-white/20 hover:border-black/20 dark:hover:border-white/30 transition-all cursor-help">
                              <div className="flex items-center gap-1.5">
                                <Wind className="h-3.5 w-3.5 text-gray-600 dark:text-gray-200" />
                                <span className="text-xs text-gray-600 dark:text-gray-200">Air Quality</span>
                              </div>
                              <p className="text-base font-semibold mt-1 dark:text-white">
                                {weatherData.current.air_quality && weatherData.current.air_quality['us-epa-index'] 
                                  ? getAQIDescription(weatherData.current.air_quality['us-epa-index'])
                                  : 'N/A'}
                              </p>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-72">
                            <p className="text-sm">{getWeatherInfo('airQuality')}</p>
                          </PopoverContent>
                        </Popover>

                        <Popover>
                          <PopoverTrigger asChild>
                            <div className="p-2 rounded-lg border border-black/10 dark:border-white/20 hover:border-black/20 dark:hover:border-white/30 transition-all cursor-help">
                              <div className="flex items-center gap-1.5">
                                <Gauge className="h-3.5 w-3.5 text-gray-600 dark:text-gray-200" />
                                <span className="text-xs text-gray-600 dark:text-gray-200">Pressure</span>
                              </div>
                              <p className="text-base font-semibold mt-1 dark:text-white">{weatherData.current.pressure_mb} hPa</p>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-72">
                            <p className="text-sm">{getWeatherInfo('pressure')}</p>
                          </PopoverContent>
                        </Popover>

                        <Popover>
                          <PopoverTrigger asChild>
                            <div className="p-2 rounded-lg border border-black/10 dark:border-white/20 hover:border-black/20 dark:hover:border-white/30 transition-all cursor-help">
                              <div className="flex items-center gap-1.5">
                                <Wind className="h-3.5 w-3.5 text-gray-600 dark:text-gray-200" />
                                <span className="text-xs text-gray-600 dark:text-gray-200">Wind</span>
                              </div>
                              <p className="text-base font-semibold mt-1 dark:text-white">{weatherData.current.wind_kph} km/h</p>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-72">
                            <p className="text-sm">{getWeatherInfo('wind')}</p>
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <div className="flex items-center gap-4 cursor-help">
                          <div className="w-16 h-16 rounded-full border border-black/10 dark:border-white/20 hover:border-black/20 dark:hover:border-white/30 transition-all flex items-center justify-center">
                            <Moon className="w-10 h-10 text-gray-600 dark:text-gray-200" />
                          </div>
                          <div>
                            <p className="text-base font-semibold dark:text-white">{moon.moon_phase}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{moon.moon_illumination}% illuminated</p>
                          </div>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-72">
                        <div className="space-y-2">
                          <p className="text-sm">{getWeatherInfo('moonPhase')}</p>
                          <p className="text-sm">{getWeatherInfo('illumination')}</p>
                        </div>
                      </PopoverContent>
                    </Popover>

                    <div className="grid grid-cols-2 gap-4">
                      <Popover>
                        <PopoverTrigger asChild>
                          <div className="p-3 rounded-lg border border-black/10 dark:border-white/20 hover:border-black/20 dark:hover:border-white/30 transition-all cursor-help">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Moonrise</p>
                            <p className="text-sm font-semibold dark:text-white">{moon.moonrise}</p>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-72">
                          <p className="text-sm">{getWeatherInfo('moonrise')}</p>
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <div className="p-3 rounded-lg border border-black/10 dark:border-white/20 hover:border-black/20 dark:hover:border-white/30 transition-all cursor-help">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Moonset</p>
                            <p className="text-sm font-semibold dark:text-white">{moon.moonset}</p>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-72">
                          <p className="text-sm">{getWeatherInfo('moonset')}</p>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
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
                {notes?.slice(0, 3).map((note) => (
                  <div
                    key={note.id}
                    className="p-2 rounded-lg bg-gray-50 dark:bg-black/20 border border-black/5 dark:border-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium dark:text-white truncate max-w-[80%]">{note.title}</h3>
                      <div className="flex items-center gap-1">
                        {note.weatherSnapshot && (
                          <WeatherSnapshotPopover weatherSnapshot={note.weatherSnapshot}>
                            <button className="p-0.5 rounded-md hover:bg-gray-200 dark:hover:bg-white/10">
                              <Cloud className="h-3.5 w-3.5 text-gray-500" />
                            </button>
                          </WeatherSnapshotPopover>
                        )}
                        <button
                          onClick={() => {
                            setSelectedNote(note);
                            setIsEditNoteOpen(true);
                          }}
                          className="p-0.5 rounded-md hover:bg-gray-200 dark:hover:bg-white/10"
                        >
                          <Pencil className="h-3.5 w-3.5 text-gray-500" />
                        </button>
                        <button
                          onClick={() => removeNote(note.id)}
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
                {notes?.length === 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">No notes yet</p>
                )}
              </div>
            </Card>

            {/* Sessions Card */}
            <Card className="p-3 bg-white hover:bg-gray-50 dark:bg-black/40 dark:hover:bg-black/20 backdrop-blur-lg border border-black/5 dark:border-white/10 hover:border-black/10 dark:hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold dark:text-white">Sessions</h2>
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
              <div className="space-y-3">
                {/* Session Type Breakdown */}
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5">
                    <div className="flex items-center gap-1 mb-0.5">
                      <CheckCircle2 className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Completed</span>
                    </div>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {recentSessions.filter(s => s.status === 'completed').length}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Pause className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">In Progress</span>
                    </div>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {recentSessions.filter(s => s.status === 'in_progress').length}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-white/5">
                    <div className="flex items-center gap-1 mb-0.5">
                      <XCircle className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Aborted</span>
                    </div>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {recentSessions.filter(s => s.status === 'aborted').length}
                    </span>
                  </div>
                </div>

                {/* Recent Sessions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-gray-900 dark:text-white">Recent</h3>
                    <Link 
                      href="/sessions" 
                      className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      View All
                    </Link>
                  </div>
                  <DashboardRecentSessions sessions={recentSessions} />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
} 