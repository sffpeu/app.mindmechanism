'use client'

import { Card } from '@/components/ui/card'
import { WeatherData } from '@/lib/diary'
import { Thermometer, Droplets, Sun, Gauge, Wind } from 'lucide-react'

interface WeatherCardProps {
  weather: WeatherData
  className?: string
}

export function WeatherCard({ weather, className = '' }: WeatherCardProps) {
  return (
    <Card className={`p-4 bg-white/90 dark:bg-black/90 backdrop-blur-lg border-black/10 dark:border-white/20 ${className}`}>
      <h3 className="text-lg font-medium text-black dark:text-white mb-4">Weather Conditions</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <Thermometer className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-black/50 dark:text-white/50">Temperature</p>
            <p className="text-black dark:text-white">{weather.temperature}°C</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/20">
            <Droplets className="h-5 w-5 text-teal-500" />
          </div>
          <div>
            <p className="text-sm text-black/50 dark:text-white/50">Humidity</p>
            <p className="text-black dark:text-white">{weather.humidity}%</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
            <Sun className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm text-black/50 dark:text-white/50">UV Index</p>
            <p className="text-black dark:text-white">{weather.uvIndex}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <Gauge className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <p className="text-sm text-black/50 dark:text-white/50">Air Pressure</p>
            <p className="text-black dark:text-white">{weather.airPressure} hPa</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 col-span-2">
          <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
            <Wind className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-black/50 dark:text-white/50">Wind</p>
            <p className="text-black dark:text-white">
              {weather.wind.speed} km/h {weather.wind.direction}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
} 