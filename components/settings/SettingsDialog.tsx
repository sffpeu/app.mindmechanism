'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { PersonalInfoSettings } from './PersonalInfoSettings'
import { WheelFacesSettings } from './WheelFacesSettings'
import { ThemeSettings } from './ThemeSettings'
import { SoundSettings } from './SoundSettings'
import { SmartHomeSettings } from './SmartHomeSettings'
import { AccountSettings } from './AccountSettings'
import { Button } from '@/components/ui/button'
import {
  X,
  User,
  LayoutGrid,
  Palette,
  Accessibility,
  Music2,
  Home,
  Shield,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: TabId
}

type TabId = 'profile' | 'wheel' | 'appearance' | 'accessibility' | 'sound' | 'smart-home' | 'account'

const TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
  { id: 'profile',    label: 'Profile',     Icon: User        },
  { id: 'wheel',      label: 'Wheel',       Icon: LayoutGrid  },
  { id: 'appearance', label: 'Appearance',  Icon: Palette     },
  { id: 'accessibility', label: 'Accessibility', Icon: Accessibility },
  { id: 'sound',      label: 'Sound',       Icon: Music2      },
  { id: 'smart-home', label: 'Smart Home',  Icon: Home        },
  { id: 'account',    label: 'Account',     Icon: Shield      },
]

export function SettingsDialog({ isOpen, onClose, initialTab }: SettingsDialogProps) {
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>(initialTab ?? 'accessibility')

  useEffect(() => {
    if (isOpen && initialTab) setActiveTab(initialTab)
  }, [isOpen, initialTab])

  const handleSave = () => {
    const onComplete = (e: Event) => {
      const success = (e as CustomEvent<{ success: boolean }>).detail?.success === true
      if (success) {
        setHasChanges(false)
        onClose()
      }
    }
    window.addEventListener('settings-save-complete', onComplete, { once: true })
    window.dispatchEvent(new Event('settings-save'))
  }

  const handleCancel = () => {
    window.dispatchEvent(new Event('settings-cancel'))
    onClose()
  }

  // Profile tab is the only one with dirty-state tracking that needs explicit save.
  // All other sections apply immediately.
  const showSaveFooter = activeTab === 'profile'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'max-w-[840px] w-[95vw] max-h-[min(90vh,820px)]',
          'gap-0 p-0 flex flex-col overflow-hidden',
          'border border-neutral-200 bg-white text-neutral-900 shadow-2xl',
          'dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100',
          'backdrop-blur-xl'
        )}
      >
        <DialogTitle className="sr-only">Settings</DialogTitle>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">Settings</h1>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* ── Mobile tab strip ────────────────────────────────────────── */}
        <div className="sm:hidden flex shrink-0 overflow-x-auto border-b border-neutral-200 bg-neutral-50 scrollbar-none dark:border-neutral-800 dark:bg-neutral-900">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2.5 text-[10px] font-medium shrink-0 whitespace-nowrap border-b-2 transition-colors',
                activeTab === id
                  ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Body: desktop sidebar + content ─────────────────────────── */}
        <div className="flex flex-1 min-h-0">
          {/* Desktop sidebar nav */}
          <nav
            className="hidden sm:flex w-44 shrink-0 flex-col gap-0.5 border-r border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-800 dark:bg-neutral-900"
            aria-label="Settings navigation"
          >
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-left w-full transition-colors',
                  activeTab === id
                    ? 'bg-black/8 dark:bg-white/8 font-medium text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200'
                )}
                aria-current={activeTab === id ? 'page' : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          {/* Content panel */}
          <div className="min-h-0 flex-1 min-w-0 overflow-y-auto overscroll-contain bg-white p-4 dark:bg-neutral-950">
            {activeTab === 'profile'    && <PersonalInfoSettings onChangesPending={setHasChanges} />}
            {activeTab === 'wheel'      && <WheelFacesSettings />}
            {activeTab === 'appearance' && <ThemeSettings section="appearance" />}
            {activeTab === 'accessibility' && <ThemeSettings section="accessibility" />}
            {activeTab === 'sound'      && <SoundSettings />}
            {activeTab === 'smart-home' && <SmartHomeSettings />}
            {activeTab === 'account'    && <AccountSettings />}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {showSaveFooter
              ? hasChanges ? 'You have unsaved changes' : ''
              : 'Changes apply immediately'}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              {showSaveFooter ? 'Cancel' : 'Close'}
            </Button>
            {showSaveFooter && (
              <Button size="sm" onClick={handleSave} disabled={!hasChanges}>
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
