'use client'

import { Card } from '@/components/ui/card'
import { MoonData } from '@/lib/diary'
import { Moon, Sunrise, Sunset, Percent } from 'lucide-react'

interface MoonCardProps {
  moon: MoonData
  className?: string
}

export function MoonCard({ moon, className = '' }: MoonCardProps) {
  return (
    <Card className={`p-4 bg-white/90 dark:bg-black/90 backdrop-blur-lg border-black/10 dark:border-white/20 ${className}`}>
      <h3 className="text-lg font-medium text-black dark:text-white mb-4">Moon Data</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
            <Moon className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <p className="text-sm text-black/50 dark:text-white/50">Phase</p>
            <p className="text-black dark:text-white">{moon.phase}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-900/20">
            <Percent className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <p className="text-sm text-black/50 dark:text-white/50">Illumination</p>
            <p className="text-black dark:text-white">{moon.illumination}%</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <Sunrise className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-black/50 dark:text-white/50">Moonrise</p>
            <p className="text-black dark:text-white">{moon.moonrise}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
            <Sunset className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <p className="text-sm text-black/50 dark:text-white/50">Moonset</p>
            <p className="text-black dark:text-white">{moon.moonset}</p>
          </div>
        </div>
      </div>
    </Card>
  )
} 