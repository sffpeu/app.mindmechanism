'use client'

import { useEffect, useState } from 'react'
import { Menu } from '@/components/Menu'
import { Card } from '@/components/ui/card'
import { Calendar, Clock, Cloud, Droplets, Gauge, Wind, Moon, ClipboardList, BookOpen, Sun, MapPin, Mountain, Waves, User, BarChart2, Pencil, Trash2, Globe, RefreshCw, CheckCircle2, Pause, XCircle, Users, Share2, Cpu, Wifi, Battery, Eye, Timer } from 'lucide-react'
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
import { WeatherSnapshot } from '@/lib/notes'
import { WeatherSnapshotPopover } from '@/components/WeatherSnapshotPopover'
import { toast } from '@/components/ui/use-toast'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Session as BaseSession } from '@/lib/sessions'
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

interface Session extends BaseSession {
  elapsed_time: number
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
    illumination: "Moon illumination percentage shows how much of the moon's surface appears lit from Earth. This affects nighttime brightness and visibility.",
    sessionProgress: "Track your progress through each session. This shows how much of your planned observation time has been completed.",
    sessionDuration: "The total time allocated for this astronomical observation session. Longer sessions allow for more detailed observations.",
    sessionType: "Different types of astronomical observations require varying approaches and equipment. Each session type is optimized for specific celestial objects.",
    completionRate: "Your overall completion rate for observation sessions. Higher rates indicate consistent dedication to astronomical studies."
  };
  return info[metric as keyof typeof info] || "No information available";
};

const formatDuration = (ms: number) => {
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}m`
}

interface WeatherInfoCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const WeatherInfoCard = ({ icon, label, value }: WeatherInfoCardProps) => (
  <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
    <div className="flex items-center gap-2 mb-1">
      {icon}
      <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
    </div>
    <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
  </div>
);

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const StatsCard = ({ icon, label, value }: StatsCardProps) => (
  <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
    <div className="flex items-center gap-2 mb-1">
      {icon}
      <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
    </div>
    <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const { notes, addNote, editNote } = useNotes();
  const { theme } = useTheme();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [showElements, setShowElements] = useState(true);
  const [showSatellites, setShowSatellites] = useState(true);
  const [showRecentSessions, setShowRecentSessions] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [showWeather, setShowWeather] = useState(true);
  const [showInfoCards, setShowInfoCards] = useState(true);
  const [moon, setMoon] = useState<MoonData | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const { location, error: locationError, isLoading: isLocationLoading } = useLocation();
  const router = useRouter();
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isEditNoteOpen, setIsEditNoteOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [timeStats, setTimeStats] = useState<TimeStats>({
    totalTime: 0,
    monthlyTime: 0,
    lastSignInTime: null
  });
  const [timeEntryId, setTimeEntryId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Define fetchData function before its usage
  const fetchData = async () => {
    if (!location?.coords) return;

    try {
      setIsWeatherLoading(true);
      setWeatherError(null);

      // Fetch weather data
      const weatherRes = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${location.coords.lat},${location.coords.lon}&aqi=yes`
      );

      if (!weatherRes.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const weatherData = await weatherRes.json();
      setWeatherData(weatherData);

      // Fetch moon data
      const moonRes = await fetch(
        `https://api.weatherapi.com/v1/astronomy.json?key=${WEATHER_API_KEY}&q=${location.coords.lat},${location.coords.lon}`
      );

      if (!moonRes.ok) {
        throw new Error('Failed to fetch moon data');
      }

      const moonData = await moonRes.json();
      setMoon(moonData.astronomy.astro);

    } catch (error) {
      console.error('Error fetching weather data:', error);
      setWeatherError('Failed to load weather data');
    } finally {
      setIsWeatherLoading(false);
    }
  };

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
    if (theme) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch weather and moon data
  useEffect(() => {
    const fetchData = async () => {
      if (!location?.coords) return;

      try {
        setIsWeatherLoading(true);
        setWeatherError(null);

        // Fetch weather data
        const weatherRes = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${location.coords.lat},${location.coords.lon}&aqi=yes`
        );

        if (!weatherRes.ok) {
          throw new Error('Failed to fetch weather data');
        }

        const weatherData = await weatherRes.json();
        setWeatherData(weatherData);

        // Fetch moon data
        const moonRes = await fetch(
          `https://api.weatherapi.com/v1/astronomy.json?key=${WEATHER_API_KEY}&q=${location.coords.lat},${location.coords.lon}`
        );

        if (!moonRes.ok) {
          throw new Error('Failed to fetch moon data');
        }

        const moonData = await moonRes.json();
        setMoon(moonData.astronomy.astro);

      } catch (error) {
        console.error('Error fetching weather data:', error);
        setWeatherError('Failed to load weather data');
      } finally {
        setIsWeatherLoading(false);
      }
    };

    fetchData();
  }, [location?.coords]);

  // Handle authentication and initialization
  useEffect(() => {
    let mounted = true;
    
    const initializeDashboard = async () => {
      try {
        if (!mounted) return;
        setIsInitializing(true);
        setAuthError(null);

        if (!user) {
          console.log('User not authenticated, redirecting to login');
          router.push('/login');
          return;
        }

        console.log('Starting dashboard initialization...');
        
        const [stats, baseSessions, timeStatsData] = await Promise.all([
          getUserStats(user.uid),
          getUserSessions(user.uid),
          calculateUserTimeStats(user.uid)
        ]);

        if (!mounted) return;

        // Add elapsed_time to sessions
        const sessionsWithElapsedTime = baseSessions.map(session => ({
          ...session,
          elapsed_time: session.end_time 
            ? session.end_time.toDate().getTime() - session.start_time.toDate().getTime()
            : Date.now() - session.start_time.toDate().getTime()
        }));

        setUserStats(stats);
        setRecentSessions(sessionsWithElapsedTime);
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

    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  // Remove the separate useEffects for loadUserStats and loadRecentSessions
  // since they're now handled in the initialization effect

  // Keep the refresh function for manual updates
  const loadAllStats = async () => {
    if (!user) return;

    try {
      setIsRefreshing(true);
      
      // Load user stats
      const stats = await getUserStats(user.uid);
      setUserStats(stats);

      // Load recent sessions and add elapsed_time
      const baseSessions = await getUserSessions(user.uid);
      const sessionsWithElapsedTime = baseSessions.map(session => ({
        ...session,
        elapsed_time: session.end_time 
          ? session.end_time.toDate().getTime() - session.start_time.toDate().getTime()
          : Date.now() - session.start_time.toDate().getTime()
      }));
      setRecentSessions(sessionsWithElapsedTime);

      // Load time tracking stats
      const timeTrackingStats = await calculateUserTimeStats(user.uid);
      setTimeStats(timeTrackingStats);

    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: 'Error loading data',
        description: 'Please try refreshing the page.'
      });
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

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      if (!user) {
        setAuthError('Please sign in to view your dashboard');
        setIsInitializing(false);
        return;
      }

      try {
        setIsInitializing(true);
        await Promise.all([
          loadAllStats(),
          fetchData()
        ]);
      } catch (error) {
        console.error('Error initializing dashboard:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeData();
  }, [user]);

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show auth error if not signed in
  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{authError}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
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

  // Add refresh functionality
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([
        loadAllStats(),
        fetchData()
      ]);
      toast({
        title: 'Dashboard refreshed',
        description: 'Your data has been updated.'
      });
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      toast({
        title: 'Error refreshing data',
        description: 'Please try again.'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/95">
      <Menu />
      <main className="container mx-auto px-4 py-8">
        {/* Header with refresh button */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Weather section */}
          {showWeather && (
            <Card className="col-span-1 p-6">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Weather
              </h2>
              {isWeatherLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
                </div>
              ) : weatherError ? (
                <div className="text-center text-red-600 dark:text-red-400">{weatherError}</div>
              ) : weatherData && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-semibold">{weatherData.current.temp_c}°C</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{weatherData.location.name}</p>
                    </div>
                    <img
                      src={weatherData.current.condition.icon}
                      alt={weatherData.current.condition.text}
                      className="h-12 w-12"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <WeatherInfoCard
                      icon={<Droplets className="h-4 w-4" />}
                      label="Humidity"
                      value={`${weatherData.current.humidity}%`}
                    />
                    <WeatherInfoCard
                      icon={<Gauge className="h-4 w-4" />}
                      label="Pressure"
                      value={`${weatherData.current.pressure_mb} mb`}
                    />
                    <WeatherInfoCard
                      icon={<Wind className="h-4 w-4" />}
                      label="Wind"
                      value={`${weatherData.current.wind_kph} km/h`}
                    />
                    <WeatherInfoCard
                      icon={<Sun className="h-4 w-4" />}
                      label="UV Index"
                      value={weatherData.current.uv.toString()}
                    />
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Recent Sessions section */}
          {showRecentSessions && (
            <Card className="col-span-1 md:col-span-2 p-6">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                Recent Sessions
              </h2>
              <DashboardRecentSessions sessions={recentSessions} />
            </Card>
          )}

          {/* User Stats section */}
          {showInfoCards && userStats && (
            <Card className="col-span-1 p-6">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <BarChart2 className="h-5 w-5" />
                Statistics
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <StatsCard
                    icon={<Clock className="h-4 w-4" />}
                    label="Total Time"
                    value={formatDuration(timeStats.totalTime)}
                  />
                  <StatsCard
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    label="Completion Rate"
                    value={`${Math.round(userStats.completionRate)}%`}
                  />
                  <StatsCard
                    icon={<Calendar className="h-4 w-4" />}
                    label="Monthly Sessions"
                    value={userStats.monthlyProgress.totalSessions.toString()}
                  />
                  <StatsCard
                    icon={<Timer className="h-4 w-4" />}
                    label="Monthly Time"
                    value={formatDuration(timeStats.monthlyTime)}
                  />
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
} 