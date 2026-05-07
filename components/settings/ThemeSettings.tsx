'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/app/ThemeContext'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Monitor, Moon, Sun, Lock, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_FONTS, getStoredFont, setAppFont, type AppFontId } from '@/components/FontProvider'
import { useSettings } from '@/lib/hooks/useSettings'
import { toast } from 'sonner'

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

const UNIVERSAL_PALETTE = [
  '#111827', '#1F2937', '#334155', '#1E3A8A',
  '#4C1D95', '#3F3F46', '#14532D', '#7F1D1D',
  '#F8FAFC', '#E5E7EB', '#D1D5DB', '#BAE6FD',
  '#C4B5FD', '#DCFCE7', '#FEF3C7', '#FDE68A',
]

const PATTERN_OPTIONS: { id: number; name: string }[] = [
  { id: -1, name: 'None (solid color)' },
  { id: 0, name: 'Crosshair' },
  { id: 1, name: 'Diagonal Cross' },
  { id: 2, name: 'Dot Matrix' },
  { id: 3, name: 'Horizontal Lines' },
  { id: 4, name: 'Vertical Lines' },
  { id: 5, name: 'Checker' },
  { id: 6, name: 'Wave' },
  { id: 7, name: 'Diamond' },
]

export function ThemeSettings({ section = 'all' }: { section?: 'all' | 'appearance' | 'accessibility' }) {
  const { setThemePreference, themePreference } = useTheme()
  const [activeFont, setActiveFont] = useState<AppFontId>('inter')
  const {
    accessibilityEnabled,
    setAccessibilityEnabled,
    accessibilityMode,
    setAccessibilityMode,
    universalBgColor,
    setUniversalBgColor,
    universalPatternId,
    setUniversalPatternId,
    universalPatternSize,
    setUniversalPatternSize,
    universalBackgroundIntensity,
    setUniversalBackgroundIntensity,
    universalPatternLineColor,
    setUniversalPatternLineColor,
    universalPatternFillColor,
    setUniversalPatternFillColor,
    customWatermarkEnabled,
    setCustomWatermarkEnabled,
    customWatermarkUrl,
    setCustomWatermarkUrl,
    customWatermarkSize,
    setCustomWatermarkSize,
    customWatermarkTiled,
    setCustomWatermarkTiled,
    customLogoEnabled,
    setCustomLogoEnabled,
    customLogoUrl,
    setCustomLogoUrl,
    customLogoSize,
    setCustomLogoSize,
    customLogoPosition,
    setCustomLogoPosition,
    universalTextScaleEnabled,
    setUniversalTextScaleEnabled,
    universalTextScale,
    setUniversalTextScale,
    accessibilityCustomProfiles,
    saveAccessibilityCustomProfile,
    applyAccessibilityCustomProfile,
  } = useSettings()

  const applyModePreset = (mode: 'visual' | 'hearing') => {
    setAccessibilityMode(mode)
    if (mode === 'visual') {
      setUniversalBgColor('#1F2937')
      setUniversalPatternId(3)
      setUniversalPatternSize(32)
      setUniversalBackgroundIntensity(70)
      setUniversalPatternLineColor('#F9FAFB')
      setUniversalPatternFillColor('#111827')
      setUniversalTextScaleEnabled(true)
      setUniversalTextScale(1.2)
      return
    }

    setUniversalBgColor('#111827')
    setUniversalPatternId(0)
    setUniversalPatternSize(24)
    setUniversalBackgroundIntensity(70)
    setUniversalPatternLineColor('#93C5FD')
    setUniversalPatternFillColor('#0F172A')
    setUniversalTextScaleEnabled(true)
    setUniversalTextScale(1.1)
  }

  const handleSaveCustomProfile = () => {
    saveAccessibilityCustomProfile(accessibilityMode)
    toast.success(`Saved custom ${accessibilityMode} profile`)
  }

  const handleApplyCustomProfile = () => {
    const ok = applyAccessibilityCustomProfile(accessibilityMode)
    if (ok) {
      toast.success(`Applied custom ${accessibilityMode} profile`)
    } else {
      toast.info(`No saved custom ${accessibilityMode} profile yet`)
    }
  }
  const handleFileAsDataUrl = (
    file: File | undefined,
    setter: (value: string | null) => void
  ) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setter(typeof reader.result === 'string' ? reader.result : null)
    reader.readAsDataURL(file)
  }

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

  const showAppearance = section !== 'accessibility'
  const showAccessibility = section !== 'appearance'

  return (
    <div className="space-y-4">
      {showAppearance && (
      <>
      {/* ── Universal Background ─────────────────────────────────────── */}
      <Card className="p-4 bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Universal background</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Applies across the app for all users.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Background color (16-shade palette)</p>
          <div className="grid grid-cols-8 gap-2">
            {UNIVERSAL_PALETTE.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setUniversalBgColor(color)}
                className={cn(
                  'h-7 w-full rounded border transition-all',
                  universalBgColor.toLowerCase() === color.toLowerCase()
                    ? 'border-violet-500 ring-2 ring-violet-400/40'
                    : 'border-black/15 dark:border-white/20'
                )}
                style={{ backgroundColor: color }}
                aria-label={`Set universal background color ${color}`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Pattern variation</Label>
          <select
            value={universalPatternId}
            onChange={(e) => setUniversalPatternId(Number(e.target.value))}
            className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-black/20 px-2.5 py-2 text-sm"
          >
            {PATTERN_OPTIONS.map((pattern) => (
              <option key={pattern.id} value={pattern.id}>
                {pattern.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Pattern tile size ({universalPatternSize}px)
          </Label>
          <input
            type="range"
            min={12}
            max={96}
            step={1}
            value={universalPatternSize}
            onChange={(e) => setUniversalPatternSize(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Background intensity ({universalBackgroundIntensity}%)
          </Label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={universalBackgroundIntensity}
            onChange={(e) => setUniversalBackgroundIntensity(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Line color</span>
            <input
              type="color"
              value={universalPatternLineColor}
              onChange={(e) => setUniversalPatternLineColor(e.target.value)}
              className="h-9 w-full rounded border border-gray-200 dark:border-gray-700 bg-transparent p-1"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Fill color</span>
            <input
              type="color"
              value={universalPatternFillColor === '#00000000' ? '#000000' : universalPatternFillColor}
              onChange={(e) => setUniversalPatternFillColor(e.target.value)}
              className="h-9 w-full rounded border border-gray-200 dark:border-gray-700 bg-transparent p-1"
            />
          </label>
        </div>
      </Card>

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

      <Card className="p-4 bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Background branding</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Add custom watermark and logo layers to the universal background.
          </p>
        </div>

        <div className="space-y-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Enable watermark</Label>
            <input type="checkbox" checked={customWatermarkEnabled} onChange={(e) => setCustomWatermarkEnabled(e.target.checked)} />
          </div>
          <input
            type="text"
            value={customWatermarkUrl ?? ''}
            onChange={(e) => setCustomWatermarkUrl(e.target.value)}
            placeholder="Watermark image URL or paste"
            className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-black/20 px-2.5 py-2 text-sm"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileAsDataUrl(e.target.files?.[0], setCustomWatermarkUrl)}
            className="text-xs"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">Watermark size ({customWatermarkSize}px)</span>
            <input type="range" min={64} max={640} step={4} value={customWatermarkSize} onChange={(e) => setCustomWatermarkSize(Number(e.target.value))} className="w-40" />
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            <input type="checkbox" checked={customWatermarkTiled} onChange={(e) => setCustomWatermarkTiled(e.target.checked)} />
            Tile watermark across background
          </label>
        </div>

        <div className="space-y-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Enable logo</Label>
            <input type="checkbox" checked={customLogoEnabled} onChange={(e) => setCustomLogoEnabled(e.target.checked)} />
          </div>
          <input
            type="text"
            value={customLogoUrl ?? ''}
            onChange={(e) => setCustomLogoUrl(e.target.value)}
            placeholder="Logo image URL or paste"
            className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-black/20 px-2.5 py-2 text-sm"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileAsDataUrl(e.target.files?.[0], setCustomLogoUrl)}
            className="text-xs"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">Logo size ({customLogoSize}px)</span>
            <input type="range" min={48} max={420} step={4} value={customLogoSize} onChange={(e) => setCustomLogoSize(Number(e.target.value))} className="w-40" />
          </div>
          <select
            value={customLogoPosition}
            onChange={(e) => setCustomLogoPosition(e.target.value as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center')}
            className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-black/20 px-2.5 py-2 text-sm"
          >
            <option value="top-right">Top right</option>
            <option value="top-left">Top left</option>
            <option value="bottom-right">Bottom right</option>
            <option value="bottom-left">Bottom left</option>
            <option value="center">Center</option>
          </select>
        </div>
      </Card>
      </>
      )}

      {showAccessibility && (
      <Card className="p-4 bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Accessibility interface</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Optional visual/hearing profile with universal background and text scaling.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAccessibilityEnabled(!accessibilityEnabled)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              accessibilityEnabled ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-700'
            )}
            aria-pressed={accessibilityEnabled}
            aria-label="Toggle accessibility interface"
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                accessibilityEnabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {accessibilityEnabled && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Accessibility mode</p>
              <div className="grid grid-cols-2 gap-2">
                {(['visual', 'hearing'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => applyModePreset(mode)}
                    className={cn(
                      'rounded-lg border p-2 text-xs font-medium capitalize transition-colors',
                      accessibilityMode === mode
                        ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Selecting a mode applies a preset profile. You can still fine-tune every control below.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => applyModePreset(accessibilityMode)}
                  className="rounded-md border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-black/20 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-black/30"
                >
                  Reset to mode defaults
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomProfile}
                  className="rounded-md border border-violet-300 dark:border-violet-700 bg-violet-50/70 dark:bg-violet-950/30 px-2.5 py-1.5 text-xs font-medium text-violet-700 dark:text-violet-300 hover:bg-violet-100/80 dark:hover:bg-violet-900/35"
                >
                  Save as custom profile
                </button>
                <button
                  type="button"
                  onClick={handleApplyCustomProfile}
                  className="rounded-md border border-sky-300 dark:border-sky-700 bg-sky-50/70 dark:bg-sky-950/20 px-2.5 py-1.5 text-xs font-medium text-sky-700 dark:text-sky-300 hover:bg-sky-100/80 dark:hover:bg-sky-900/35"
                >
                  Apply saved custom profile
                </button>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Saved now:{' '}
                {accessibilityCustomProfiles[accessibilityMode] ? 'Yes' : 'No'}
              </p>
            </div>

            <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-800 dark:text-gray-200">Enable global text size override</Label>
                <input
                  type="checkbox"
                  checked={universalTextScaleEnabled}
                  onChange={(e) => setUniversalTextScaleEnabled(e.target.checked)}
                />
              </div>
              <input
                type="range"
                min={0.85}
                max={1.5}
                step={0.05}
                value={universalTextScale}
                onChange={(e) => setUniversalTextScale(Number(e.target.value))}
                disabled={!universalTextScaleEnabled}
                className="w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">Current text scale: {(universalTextScale * 100).toFixed(0)}%</p>
            </div>
          </div>
        )}
      </Card>
      )}

      {/* ── Theme Packs ───────────────────────────────────────────────── */}
      {showAppearance && (
      <>
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
      </>
      )}
    </div>
  )
}
