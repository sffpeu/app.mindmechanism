'use client'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { WeatherSnapshot } from '@/lib/notes'
import { Cloud, Thermometer, Droplets, Sun, Gauge, Wind, Moon, MapPin } from 'lucide-react'

interface WeatherSnapshotPopoverProps {
  weatherSnapshot: WeatherSnapshot
  children: React.ReactNode
}

export function WeatherSnapshotPopover({ weatherSnapshot, children }: WeatherSnapshotPopoverProps) {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return ''
    const date = timestamp.toDate()
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="border-b pb-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Snapshot taken at {formatDate(weatherSnapshot.timestamp)}
            </p>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">{weatherSnapshot.location.name}</p>
              <p className="text-xs text-gray-500">
                {weatherSnapshot.location.coordinates.lat.toFixed(4)}°, {weatherSnapshot.location.coordinates.lon.toFixed(4)}°
              </p>
            </div>
          </div>

          {/* Weather Data */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs text-gray-500">Temperature</p>
                <p className="text-sm">{weatherSnapshot.temperature}°C</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-teal-500" />
              <div>
                <p className="text-xs text-gray-500">Humidity</p>
                <p className="text-sm">{weatherSnapshot.humidity}%</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-xs text-gray-500">UV Index</p>
                <p className="text-sm">{weatherSnapshot.uvIndex}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs text-gray-500">Air Pressure</p>
                <p className="text-sm">{weatherSnapshot.airPressure} hPa</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-gray-500">Wind</p>
                <p className="text-sm">{weatherSnapshot.wind.speed} km/h {weatherSnapshot.wind.direction}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-indigo-500" />
              <div>
                <p className="text-xs text-gray-500">Moon Phase</p>
                <p className="text-sm">{weatherSnapshot.moon.phase}</p>
              </div>
            </div>
          </div>

          {/* Moon Details */}
          <div className="grid grid-cols-2 gap-3 border-t pt-2">
            <div>
              <p className="text-xs text-gray-500">Moonrise</p>
              <p className="text-sm">{weatherSnapshot.moon.moonrise}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Moonset</p>
              <p className="text-sm">{weatherSnapshot.moon.moonset}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500">Illumination</p>
              <p className="text-sm">{weatherSnapshot.moon.illumination}%</p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 