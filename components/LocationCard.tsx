'use client'

import { Card } from '@/components/ui/card'
import { LocationData } from '@/lib/diary'
import { MapPin, Globe } from 'lucide-react'

interface LocationCardProps {
  location: LocationData
  className?: string
}

export function LocationCard({ location, className = '' }: LocationCardProps) {
  return (
    <Card className={`p-4 bg-white/90 dark:bg-black/90 backdrop-blur-lg border-black/10 dark:border-white/20 ${className}`}>
      <h3 className="text-lg font-medium text-black dark:text-white mb-4">Location</h3>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-900/20">
            <MapPin className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <p className="text-sm text-black/50 dark:text-white/50">Coordinates</p>
            <p className="text-black dark:text-white">
              {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-900/20">
            <Globe className="h-5 w-5 text-cyan-500" />
          </div>
          <div>
            <p className="text-sm text-black/50 dark:text-white/50">Location</p>
            <p className="text-black dark:text-white">
              {location.city}, {location.country}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
} 