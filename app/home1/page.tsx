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
  RotateCw,
  Calendar
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
  const { isDarkMode } = useTheme()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [rotationValues, setRotationValues] = useState<Record<number, number[]>>({})
  const animationRef = useRef<number>()
  const router = useRouter()
  const { user } = useAuth()
  const { location } = useLocation()
  const [mounted, setMounted] = useState(false)
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null)
  const [moon, setMoon] = useState<MoonData | null>(null)
  const [isWeatherLoading, setIsWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)

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
        setWeatherError(null);

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
        setWeatherError(error instanceof Error ? error.message : 'Failed to load weather data');
      } finally {
        setIsWeatherLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, [mounted, location?.coords]);

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

  // Format rotation speed for display
  const formatRotationSpeed = (clock: typeof clockSettings[0]) => {
    const speed = clock.rotationTime / 1000; // Convert to seconds
    if (speed < 60) {
      return `${speed}s`;
    } else if (speed < 3600) {
      return `${(speed / 60).toFixed(1)}m`;
    } else {
      return `${(speed / 3600).toFixed(1)}h`;
    }
  };

  // Mock last session data (in real app, this would come from database)
  const getLastSessionTime = (clockIndex: number) => {
    const now = new Date();
    const hoursAgo = Math.floor(Math.random() * 24) + 1;
    const lastSession = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    return lastSession;
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
            />
          )}
          <Menu
            showElements={showElements}
            onToggleShow={() => setShowElements(!showElements)}
          />
        </div>
      </div>

      {/* Widget Grid - Right Side */}
      <div className="fixed right-6 top-6 z-20 space-y-4 max-h-screen overflow-y-auto">
        {/* Profile Widget */}
        <Card className="w-64 p-3 bg-white/90 dark:bg-black/90 backdrop-blur-lg border border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold dark:text-white">Profile</h2>
            <User className="h-4 w-4 text-gray-500" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <p className="text-sm font-medium dark:text-white">
                  {user?.displayName || user?.email || 'Guest User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user ? 'Signed in' : 'Not signed in'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Device Widget */}
        <Card className="w-64 p-3 bg-white/90 dark:bg-black/90 backdrop-blur-lg border border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold dark:text-white">Device</h2>
            <Cpu className="h-4 w-4 text-gray-500" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                <Wifi className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <p className="text-sm font-medium dark:text-white">M13 Mechanism</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">No device connected</p>
              </div>
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

        {/* Session Widget */}
        <Card className="w-64 p-3 bg-white/90 dark:bg-black/90 backdrop-blur-lg border border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold dark:text-white">Session</h2>
            <Clock className="h-4 w-4 text-gray-500" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <p className="text-sm font-medium dark:text-white">Active Session</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">No active session</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Time/Location/Timezone Widget */}
        <Card className="w-64 p-3 bg-white/90 dark:bg-black/90 backdrop-blur-lg border border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold dark:text-white">Time & Location</h2>
            <Globe className="h-4 w-4 text-gray-500" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              <span className="text-sm font-medium dark:text-white">{formatTime(currentTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {weatherData?.location.name || 'Loading location...'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {weatherData?.location.tz_id || 'Loading timezone...'}
              </span>
            </div>
          </div>
        </Card>

        {/* Weather Widget */}
        {weatherData && (
          <Card className="w-64 p-3 bg-white/90 dark:bg-black/90 backdrop-blur-lg border border-black/10 dark:border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold dark:text-white">Weather</h2>
              <Cloud className="h-4 w-4 text-gray-500" />
            </div>
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
          </Card>
        )}

        {/* Moon Widget */}
        {moon && (
          <Card className="w-64 p-3 bg-white/90 dark:bg-black/90 backdrop-blur-lg border border-black/10 dark:border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold dark:text-white">Moon</h2>
              <Moon className="h-4 w-4 text-gray-500" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border border-black/10 dark:border-white/20 flex items-center justify-center">
                  <Moon className="w-8 h-8 text-gray-600 dark:text-gray-200" />
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
          </Card>
        )}

        {/* Clock List Widget */}
        <Card className="w-64 p-3 bg-white/90 dark:bg-black/90 backdrop-blur-lg border border-black/10 dark:border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold dark:text-white">Clock Status</h2>
            <RotateCw className="h-4 w-4 text-gray-500" />
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {clockSettings.map((clock, index) => {
              const rotation = getClockRotation(clock);
              const lastSession = getLastSessionTime(index);
              const hoursAgo = Math.floor((Date.now() - lastSession.getTime()) / (1000 * 60 * 60));
              
              return (
                <div 
                  key={index}
                  className="p-2 rounded-lg border border-black/10 dark:border-white/20 hover:border-black/20 dark:hover:border-white/30 transition-all"
                  style={{ borderLeftColor: focusNodeColors[index].replace('bg-', '#').replace('[', '').replace(']', '') }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: focusNodeColors[index].replace('bg-', '#').replace('[', '').replace(']', '') }}
                      ></div>
                      <span className="text-sm font-medium dark:text-white">Clock {index + 1}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {rotation.toFixed(1)}°
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Speed: {formatRotationSpeed(clock)}</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{hoursAgo}h ago</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Content Layer - Multiview */}
      <div className="relative flex-grow flex items-center justify-center z-0">
        <div className="relative w-[600px] h-[600px]">
          {clockSettings.map((clock, index) => {
            const rotation = getClockRotation(clock)
            return (
              <div
                key={index}
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  mixBlendMode: isDarkMode ? 'screen' : 'multiply',
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
                          return (
                            <motion.div
                              key={nodeIndex}
                              className={`absolute w-2 h-2 rounded-full ${focusNodeColors[index]} dark:brightness-150`}
                              style={{
                                left: `${x}%`,
                                top: `${y}%`,
                                transform: 'translate(-50%, -50%)',
                                mixBlendMode: isDarkMode ? 'screen' : 'multiply',
                                boxShadow: isDarkMode 
                                  ? '0 0 4px rgba(255, 255, 255, 0.3)' 
                                  : '0 0 4px rgba(0, 0, 0, 0.2)'
                              }}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{
                                duration: 0.3,
                                delay: nodeIndex * 0.05,
                                ease: "easeOut"
                              }}
                            />
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
                            return (
                              <motion.div
                                key={satelliteIndex}
                                className="absolute w-3 h-3 rounded-full"
                                style={{
                                  left: `${x}%`,
                                  top: `${y}%`,
                                  transform: 'translate(-50%, -50%)',
                                  backgroundColor: isDarkMode ? '#fff' : '#000',
                                  boxShadow: isDarkMode 
                                    ? '0 0 6px rgba(255, 255, 255, 0.3)' 
                                    : '0 0 6px rgba(0, 0, 0, 0.3)',
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
                              />
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
