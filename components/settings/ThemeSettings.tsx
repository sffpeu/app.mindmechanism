'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/app/ThemeContext'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Monitor, Moon, Sun, Lock, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_FONTS, getStoredFont, setAppFont, type AppFontId } from '@/components/FontProvider'

interface ThemePack {
  id: string
  name: string
  description: string
  available: boolean
  free: boolean
  category: 'core' | 'education' | 'enterprise'
}

const THEME_PACKS: ThemePack[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'The original MM palette — deep indigo and violet on dark, soft whites on light.',
    available: true,
    free: true,
    category: 'core',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Clean, minimal tones calibrated for boardroom and executive contexts.',
    available: false,
    free: true,
    category: 'enterprise',
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'Structured and legible — optimised for extended reading and deep study sessions.',
    available: false,
    free: true,
    category: 'education',
  },
  {
    id: 'school-primary',
    name: 'School: Primary',
    description: 'Warm, high-contrast palette designed for ages 5–11. Requires institution licence.',
    available: false,
    free: false,
    category: 'education',
  },
  {
    id: 'school-secondary',
    name: 'School: Secondary',
    description: 'Balanced palette for ages 12–18. Requires institution licence.',
    available: false,
    free: false,
    category: 'education',
  },
]

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Core',
  education: 'Education',
  enterprise: 'Enterprise',
}

export function ThemeSettings() {
  const { setThemePreference, themePreference } = useTheme()
  const [activeFont, setActiveFont] = useState<AppFontId>('inter')

  useEffect(() => {
    setActiveFont(getStoredFont())
    const handler = (e: Event) => setActiveFont((e as CustomEvent<AppFontId>).detail)
    window.addEventListener('mm-font-change', handler)
    return () => window.removeEventListener('mm-font-change', handler)
  }, [])

  const grouped = THEME_PACKS.reduce<Record<string, ThemePack[]>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {/* ── Application Font ──────────────────────────────────────────── */}
      <Card className="p-4 bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Application font</p>
        <div className="space-y-2">
          {APP_FONTS.map((font) => {
            const isActive = activeFont === font.id
            return (
              <button
                key={font.id}
                type="button"
                onClick={() => setAppFont(font.id)}
                className={cn(
                  'w-full text-left rounded-lg border p-3 transition-colors',
                  isActive
                    ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn('text-sm font-semibold', isActive ? 'text-violet-700 dark:text-violet-300' : 'text-gray-900 dark:text-white')}
                        style={{ fontFamily: font.cssVar }}
                      >
                        {font.label}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">
                        {font.register}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{font.description}</p>
                    <p
                      className="text-sm mt-1.5 text-gray-700 dark:text-gray-300"
                      style={{ fontFamily: font.cssVar }}
                    >
                      {font.sampleText}
                    </p>
                  </div>
                  {isActive && (
                    <div className="shrink-0 mt-0.5 h-4 w-4 rounded-full bg-violet-500 flex items-center justify-center">
                      <svg viewBox="0 0 8 8" className="h-2.5 w-2.5 fill-white"><path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* ── Color Scheme ──────────────────────────────────────────────── */}
      <Card className="p-4 bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Color scheme</p>
        <RadioGroup
          value={themePreference}
          onValueChange={(value) => setThemePreference(value as 'light' | 'dark' | 'system')}
          className="grid grid-cols-3 gap-2"
        >
          {([
            { value: 'light', label: 'Light', Icon: Sun },
            { value: 'dark',  label: 'Dark',  Icon: Moon },
            { value: 'system', label: 'Auto', Icon: Monitor },
          ] as const).map(({ value, label, Icon }) => (
            <Label
              key={value}
              htmlFor={value}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors',
                themePreference === value
                  ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/40'
              )}
            >
              <RadioGroupItem value={value} id={value} className="sr-only" />
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium">{label}</span>
            </Label>
          ))}
        </RadioGroup>
      </Card>

      {/* ── Theme Packs ───────────────────────────────────────────────── */}
      {(Object.entries(grouped) as [string, ThemePack[]][]).map(([category, packs]) => (
        <div key={category} className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-0.5">
            {CATEGORY_LABELS[category] ?? category}
          </p>
          <div className="space-y-2">
            {packs.map((pack) => (
              <Card
                key={pack.id}
                className={cn(
                  'p-3 bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800',
                  !pack.available && 'opacity-70'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{pack.name}</span>
                      {pack.free && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wide">
                          Free
                        </span>
                      )}
                      {!pack.free && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 font-semibold uppercase tracking-wide">
                          Licence
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                      {pack.description}
                    </p>
                  </div>
                  {pack.available ? (
                    <button
                      type="button"
                      disabled
                      className="shrink-0 flex items-center gap-1.5 rounded-md border border-violet-200 dark:border-violet-800/50 px-2.5 py-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-950/20 cursor-not-allowed opacity-60"
                      aria-label={`${pack.name} is active`}
                    >
                      Active
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="shrink-0 flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-gray-900/30 cursor-not-allowed"
                      aria-label={`Download ${pack.name} theme pack`}
                    >
                      {pack.free
                        ? <><Download className="h-3 w-3" /> Download</>
                        : <><Lock className="h-3 w-3" /> Locked</>}
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 px-2">
        Theme packs are free to download for adoption and engagement.
        Corporate and institution packs include branding configuration.
      </p>
    </div>
  )
}
