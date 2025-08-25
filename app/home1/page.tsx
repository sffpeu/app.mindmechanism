'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Menu } from '@/components/Menu'
import { useTheme } from '@/app/ThemeContext'
import { useRouter } from 'next/navigation'
import DotNavigation from '@/components/DotNavigation'
import { clockSettings } from '@/lib/clockSettings'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLocation } from '@/lib/hooks/useLocation'
import { 
  User, 
  Cpu, 
  Clock, 
  MapPin, 
  Globe, 
  Cloud, 
  Moon, 
  Droplets, 
  Gauge, 
  Wind, 
  Sun,
  Wifi,
  Battery,
  Users,
  Play,
  BookOpen,
  Library,
  Edit,
  Search,
  LogOut,
  Settings
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { ClockSettings } from '@/types/ClockSettings'

// Default satellite configurations for all clocks
const defaultSatelliteConfigs: Record<number, Array<{ rotationTime: number, rotationDirection: 'clockwise' | 'counterclockwise' }>> = {
  0: [ // Clock 1
    { rotationTime: 300 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 600 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 900 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 1800 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 2700 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 5400 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 5400 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 1800 * 1000, rotationDirection: 'counterclockwise' }
  ],
  1: [ // Clock 2
    { rotationTime: 1800 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 3600 * 1000, rotationDirection: 'counterclockwise' }
  ],
  2: [ // Clock 3
    { rotationTime: 600 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 1800 * 1000, rotationDirection: 'clockwise' }
  ],
  3: [ // Clock 4
    { rotationTime: 60 * 1000, rotationDirection: 'clockwise' }
  ],
  4: [ // Clock 5
    { rotationTime: 720 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 1140 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 1710 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 1710 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 900 * 1000, rotationDirection: 'clockwise' }
  ],
  5: [ // Clock 6
    { rotationTime: 60 * 1000, rotationDirection: 'clockwise' }
  ],
  6: [ // Clock 7
    { rotationTime: 900 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 900 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 1800 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 900 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 700 * 1000, rotationDirection: 'clockwise' }
  ],
  7: [ // Clock 8
    { rotationTime: 1800 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 1800 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 1800 * 1000, rotationDirection: 'clockwise' },
    { rotationTime: 1800 * 1000, rotationDirection: 'counterclockwise' },
    { rotationTime: 1800 * 1000, rotationDirection: 'clockwise' }
  ],
  8: [ // Clock 9
    { rotationTime: 3600 * 1000, rotationDirection: 'clockwise' }
  ]
};

// Satellite counts for each clock
const clockSatellites: Record<number, number> = {
  0: 8, // Clock 1
  1: 2, // Clock 2
  2: 2, // Clock 3
  3: 1, // Clock 4
  4: 5, // Clock 5
  5: 1, // Clock 6
  6: 5, // Clock 7
  7: 5, // Clock 8
  8: 1, // Clock 9
};

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

export default function Home1Page() {
  const [showElements, setShowElements] = useState(true)
  const { isDarkMode, setIsDarkMode } = useTheme()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [rotationValues, setRotationValues] = useState<Record<number, number[]>>({})
  const animationRef = useRef<number>()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { location } = useLocation()
  const [mounted, setMounted] = useState(false)
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null)
  const [moon, setMoon] = useState<MoonData | null>(null)
  const [isWeatherLoading, setIsWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [hoveredClockIndex, setHoveredClockIndex] = useState<number | null>(null)
  const [customLocation, setCustomLocation] = useState('')
  const [isEditingLocation, setIsEditingLocation] = useState(false)
  
  // Interactive highlighting states
  const [selectedSatellite, setSelectedSatellite] = useState<{ clockIndex: number, satelliteIndex: number } | null>(null)
  const [selectedFocusNode, setSelectedFocusNode] = useState<{ clockIndex: number, nodeIndex: number } | null>(null)

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/signin')
  }

  // Initialize and update current time with optimized animation frame
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date())
      animationRef.current = requestAnimationFrame(updateTime)
    }
    updateTime()
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Memoize satellite positions for better performance
  const getSatellitePosition = useCallback((index: number, satelliteIndex: number, totalSatellites: number) => {
    const baseAngle = (satelliteIndex * 360) / totalSatellites;
    const radius = 58.5;
    const rotation = rotationValues[index]?.[satelliteIndex] || 0;
    const rotatedRadians = ((baseAngle + rotation) % 360) * (Math.PI / 180);
    const x = 49 + radius * Math.cos(rotatedRadians - Math.PI / 2);
    const y = 48 + radius * Math.sin(rotatedRadians - Math.PI / 2);
    return { x, y };
  }, [rotationValues]);

  // Calculate satellite rotation speed in degrees per second
  const getSatelliteRotationSpeed = useCallback((clockIndex: number, satelliteIndex: number) => {
    const config = defaultSatelliteConfigs[clockIndex]?.[satelliteIndex];
    if (!config) return 0;
    return (360 / (config.rotationTime / 1000)); // degrees per second
  }, []);

  // Calculate focus node degree
  const getFocusNodeDegree = useCallback((clockIndex: number, nodeIndex: number) => {
    const clock = clockSettings[clockIndex];
    if (!clock || !currentTime) return 0;
    
    const baseAngle = (nodeIndex * 360) / clock.focusNodes;
    const elapsedMilliseconds = currentTime.getTime() - clock.startDateTime.getTime();
    const calculatedRotation = (elapsedMilliseconds / clock.rotationTime) * 360;
    const totalRotation = clock.rotationDirection === 'clockwise'
      ? (clock.startingDegree + calculatedRotation) % 360
      : (clock.startingDegree - calculatedRotation + 360) % 360;
    
    return (baseAngle + totalRotation) % 360;
  }, [currentTime, clockSettings]);

  // Optimize rotation values update with batch updates
  useEffect(() => {
    const updateRotations = () => {
      const now = Date.now();
      const newRotations: Record<number, number[]> = {};
      
      clockSettings.forEach((clock, index) => {
        if (!clockSatellites[index]) return;
        
        const elapsedMilliseconds = now - clock.startDateTime.getTime();
        const configs = defaultSatelliteConfigs[index] || [];
        
        newRotations[index] = configs.map(config => {
          const satelliteRotation = (elapsedMilliseconds / config.rotationTime) * 360;
          return config.rotationDirection === 'clockwise'
            ? satelliteRotation % 360
            : (-satelliteRotation + 360) % 360;
        });
      });

      setRotationValues(newRotations);
      animationRef.current = requestAnimationFrame(updateRotations);
    };

    updateRotations();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [clockSettings]);

  // Calculate rotation for each clock
  const getClockRotation = (clock: typeof clockSettings[0]) => {
    if (!currentTime) return 0
    const elapsedMilliseconds = currentTime.getTime() - clock.startDateTime.getTime()
    const calculatedRotation = (elapsedMilliseconds / clock.rotationTime) * 360
    return clock.rotationDirection === 'clockwise'
      ? (clock.startingDegree + calculatedRotation) % 360
      : (clock.startingDegree - calculatedRotation + 360) % 360
  }

  // Focus node colors from individual clocks
  const focusNodeColors = [
    'bg-[#fd290a]', // 1. Red
    'bg-[#fba63b]', // 2. Orange
    'bg-[#f7da5f]', // 3. Yellow
    'bg-[#6dc037]', // 4. Green
    'bg-[#156fde]', // 5. Blue
    'bg-[#941952]', // 6. Dark Pink
    'bg-[#541b96]', // 7. Purple
    'bg-[#ee5fa7]', // 8. Pink
    'bg-[#56c1ff]', // 9. Light Blue
  ]

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

  // Fetch weather and moon data
  useEffect(() => {
    if (!mounted) return;

    const fetchData = async () => {
      setIsWeatherLoading(true);
      try {
        const locationQuery = customLocation || (location?.coords ? `${location.coords.lat},${location.coords.lon}` : 'auto:ip');
        
        const weatherRes = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=6cb652a81cb64a19a84103447252001&q=${locationQuery}&aqi=yes`
        );
        if (!weatherRes.ok) {
          throw new Error('Weather API request failed');
        }
        const weatherData = await weatherRes.json();
        setWeatherData(weatherData);
        setWeatherError(null);

        const astronomyRes = await fetch(
          `https://api.weatherapi.com/v1/astronomy.json?key=6cb652a81cb64a19a84103447252001&q=${locationQuery}`
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
  }, [mounted, location?.coords, customLocation]);

  // Update current time every second
  useEffect(() => {
    if (!mounted) return

    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [mounted])

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

  const handleLocationSave = () => {
    setIsEditingLocation(false);
    // The weather data will be refetched automatically due to the useEffect dependency
  };

  // Handle satellite click
  const handleSatelliteClick = (clockIndex: number, satelliteIndex: number) => {
    if (selectedSatellite?.clockIndex === clockIndex && selectedSatellite?.satelliteIndex === satelliteIndex) {
      setSelectedSatellite(null);
    } else {
      setSelectedSatellite({ clockIndex, satelliteIndex });
      setSelectedFocusNode(null);
    }
  };

  // Handle focus node click
  const handleFocusNodeClick = (clockIndex: number, nodeIndex: number) => {
    if (selectedFocusNode?.clockIndex === clockIndex && selectedFocusNode?.nodeIndex === nodeIndex) {
      setSelectedFocusNode(null);
    } else {
      setSelectedFocusNode({ clockIndex, nodeIndex });
      setSelectedSatellite(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-black/90">
      {/* Navigation Layer */}
      <div className="fixed inset-0 pointer-events-none z-[999]">
        <div className="pointer-events-auto">
          {showElements && (
            <DotNavigation
              activeDot={9}
              isSmallMultiView={false}
              onDotHover={setHoveredClockIndex}
            />
          )}
          <Menu
            showElements={showElements}
            onToggleShow={() => setShowElements(!showElements)}
          />
        </div>
      </div>

      {/* Widget Grid - Left Side */}
      <div className="fixed left-6 top-6 z-20 space-y-4 max-h-screen overflow-y-auto scrollbar-hide">
        {/* Profile Widget */}
        <Card className="w-64 p-3 bg-white/90 dark:bg-black/90 backdrop-blur-lg border border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold dark:text-white">Profile</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-200"
                onClick={() => router.push('/settings')}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-200"
                onClick={handleSignOut}
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {user?.photoURL ? (
                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700">
                  <Image
                    src={user.photoURL}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium dark:text-white">
                  {user?.displayName || user?.email || 'Guest User'}
                </p>
                {user?.email && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user ? 'Signed in' : 'Not signed in'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* App Icons Widget - Smaller with Rounded Corners */}
        <Card className="w-64 p-3 bg-white/90 dark:bg-black/90 backdrop-blur-lg border border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold dark:text-white">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-10 w-10 p-0 bg-white dark:bg-black border border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-200"
              onClick={() => router.push('/sessions')}
            >
              <Play className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 w-10 p-0 bg-white dark:bg-black border border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-200"
              onClick={() => router.push('/notes')}
            >
              <BookOpen className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 w-10 p-0 bg-white dark:bg-black border border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-200"
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 w-10 p-0 bg-white dark:bg-black border border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-200"
              onClick={() => router.push('/settings')}
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </Card>

        {/* Recent Sessions Widget */}
        <Card className="w-64 p-3 bg-white/90 dark:bg-black/90 backdrop-blur-lg border border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold dark:text-white">Recent Sessions</h2>
            <Clock className="h-4 w-4 text-gray-500" />
          </div>
          <div className="space-y-2">
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium dark:text-white">Morning Session</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">25 minutes ago</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-900 dark:text-white">15m</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <Clock className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium dark:text-white">Evening Session</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-900 dark:text-white">30m</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Weather & Moon Widget with Location */}
        <Card className="w-64 p-3 bg-white/90 dark:bg-black/90 backdrop-blur-lg border border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold dark:text-white">Weather & Moon</h2>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-200"
                onClick={() => setIsEditingLocation(!isEditingLocation)}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Cloud className="h-4 w-4 text-gray-500" />
            </div>
          </div>
          <div className="space-y-3">
            {/* Location Section */}
            <div className="space-y-2">
              {isEditingLocation ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Enter city name..."
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="h-6 text-xs bg-black dark:bg-white text-white dark:text-black hover:bg-black/80 dark:hover:bg-white/80 transition-colors"
                      onClick={handleLocationSave}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs bg-white dark:bg-black border border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-200"
                      onClick={() => {
                        setCustomLocation('');
                        setIsEditingLocation(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {weatherData?.location.name || 'Loading location...'}
                  </span>
                </div>
              )}
            </div>

            {weatherData && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold dark:text-white">{weatherData.current.temp_c}°C</span>
                  <div className="flex items-center gap-1">
                    <Droplets className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{weatherData.current.humidity}%</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                    <div className="flex items-center gap-1">
                      <Sun className="h-3.5 w-3.5 text-gray-600 dark:text-gray-200" />
                      <span className="text-xs text-gray-600 dark:text-gray-200">UV</span>
                    </div>
                    <p className="text-sm font-semibold dark:text-white">{weatherData.current.uv}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                    <div className="flex items-center gap-1">
                      <Wind className="h-3.5 w-3.5 text-gray-600 dark:text-gray-200" />
                      <span className="text-xs text-gray-600 dark:text-gray-200">Wind</span>
                    </div>
                    <p className="text-sm font-semibold dark:text-white">{weatherData.current.wind_kph} km/h</p>
                  </div>
                </div>
              </div>
            )}
            
            {moon && (
              <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-black/10 dark:border-white/20 flex items-center justify-center">
                    <Moon className="w-6 h-6 text-gray-600 dark:text-gray-200" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold dark:text-white">{moon.moon_phase}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{moon.moon_illumination}% illuminated</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Moonrise</p>
                    <p className="text-sm font-semibold dark:text-white">{moon.moonrise}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Moonset</p>
                    <p className="text-sm font-semibold dark:text-white">{moon.moonset}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Content Layer - Multiview */}
      <div className="relative flex-grow flex items-center justify-center z-0">
        <div className="relative w-[600px] h-[600px]">
          {clockSettings.map((clock, index) => {
            const rotation = getClockRotation(clock)
            const isHovered = hoveredClockIndex === index
            
            return (
              <div
                key={index}
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  mixBlendMode: isDarkMode ? 'screen' : 'multiply',
                  opacity: hoveredClockIndex === null || isHovered ? 1 : 0.2,
                  transition: 'opacity 0.3s ease-in-out',
                }}
              >
                <div className="w-full h-full relative">
                  {/* Clock face with shorter initial animation */}
                  <div className="absolute inset-0">
                    <motion.div
                      className="absolute inset-0"
                      animate={{ rotate: rotation }}
                      transition={{
                        duration: 0.3,
                        ease: "easeOut",
                      }}
                      style={{
                        transformOrigin: 'center',
                      }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{
                          transform: `translate(${clock.imageX || 0}%, ${clock.imageY || 0}%) rotate(${clock.imageOrientation}deg) scale(${clock.imageScale})`,
                          transformOrigin: 'center',
                        }}
                      >
                        <Image
                          src={`/${index + 1}.svg`}
                          alt={`Clock ${index + 1}`}
                          fill
                          className="object-cover rounded-full dark:invert dark:brightness-100 [&_*]:fill-current [&_*]:stroke-none"
                          priority
                          loading="eager"
                        />
                      </div>
                    </motion.div>
                  </div>

                  {/* Focus nodes moved slightly inward */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-full rounded-full relative">
                        {Array.from({ length: clock.focusNodes }).map((_, nodeIndex) => {
                          const angle = (nodeIndex * 360) / clock.focusNodes
                          const radius = 53
                          const x = 50 + radius * Math.cos((angle - 90) * (Math.PI / 180))
                          const y = 50 + radius * Math.sin((angle - 90) * (Math.PI / 180))
                          const isSelected = selectedFocusNode?.clockIndex === index && selectedFocusNode?.nodeIndex === nodeIndex
                          const degree = getFocusNodeDegree(index, nodeIndex)
                          
                          return (
                            <motion.div
                              key={nodeIndex}
                              className={`absolute w-2 h-2 rounded-full ${focusNodeColors[index]} dark:brightness-150 cursor-pointer`}
                              style={{
                                left: `${x}%`,
                                top: `${y}%`,
                                transform: 'translate(-50%, -50%)',
                                mixBlendMode: isDarkMode ? 'screen' : 'multiply',
                                boxShadow: isDarkMode 
                                  ? isSelected 
                                    ? '0 0 8px rgba(255, 255, 255, 0.8), 0 0 16px rgba(255, 255, 255, 0.6)' 
                                    : '0 0 4px rgba(255, 255, 255, 0.3)' 
                                  : isSelected 
                                    ? '0 0 8px rgba(0, 0, 0, 0.8), 0 0 16px rgba(0, 0, 0, 0.6)' 
                                    : '0 0 4px rgba(0, 0, 0, 0.2)',
                                border: isSelected ? '2px solid white' : 'none',
                                zIndex: isSelected ? 10 : 1
                              }}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{
                                duration: 0.3,
                                delay: nodeIndex * 0.05,
                                ease: "easeOut"
                              }}
                              onClick={() => handleFocusNodeClick(index, nodeIndex)}
                              whileHover={{ scale: 1.5 }}
                            >
                              {/* Degree display for selected focus node */}
                              {isSelected && (
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 dark:bg-white/80 text-white dark:text-black text-xs px-2 py-1 rounded whitespace-nowrap z-20">
                                  {degree.toFixed(1)}°
                                </div>
                              )}
                            </motion.div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Satellites with reduced shadow and smoother animation */}
                  {clockSatellites[index] > 0 && (
                    <div className="absolute inset-0">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-full rounded-full relative">
                          {Array.from({ length: clockSatellites[index] }).map((_, satelliteIndex) => {
                            const { x, y } = getSatellitePosition(index, satelliteIndex, clockSatellites[index])
                            const isSelected = selectedSatellite?.clockIndex === index && selectedSatellite?.satelliteIndex === satelliteIndex
                            const rotationSpeed = getSatelliteRotationSpeed(index, satelliteIndex)
                            
                            return (
                              <motion.div
                                key={satelliteIndex}
                                className="absolute w-3 h-3 rounded-full cursor-pointer"
                                style={{
                                  left: `${x}%`,
                                  top: `${y}%`,
                                  transform: 'translate(-50%, -50%)',
                                  backgroundColor: isDarkMode ? '#fff' : '#000',
                                  boxShadow: isDarkMode 
                                    ? isSelected 
                                      ? '0 0 12px rgba(255, 255, 255, 0.8), 0 0 24px rgba(255, 255, 255, 0.6)' 
                                      : '0 0 6px rgba(255, 255, 255, 0.3)' 
                                    : isSelected 
                                      ? '0 0 12px rgba(0, 0, 0, 0.8), 0 0 24px rgba(0, 0, 0, 0.6)' 
                                      : '0 0 6px rgba(0, 0, 0, 0.3)',
                                  border: isSelected ? '2px solid white' : 'none',
                                  zIndex: isSelected ? 10 : 1,
                                  willChange: 'transform'
                                }}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ 
                                  opacity: 1, 
                                  scale: 1,
                                }}
                                transition={{
                                  duration: 0.3,
                                  delay: 0.3 + satelliteIndex * 0.05,
                                  ease: "easeOut"
                                }}
                                whileHover={{ scale: 1.8 }}
                                onClick={() => handleSatelliteClick(index, satelliteIndex)}
                              >
                                {/* Position and speed display for selected satellite */}
                                {isSelected && (
                                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 dark:bg-white/80 text-white dark:text-black text-xs px-2 py-1 rounded whitespace-nowrap z-20">
                                    <div>X: {x.toFixed(1)}% Y: {y.toFixed(1)}%</div>
                                    <div>{rotationSpeed.toFixed(2)}°/s</div>
                                  </div>
                                )}
                              </motion.div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
