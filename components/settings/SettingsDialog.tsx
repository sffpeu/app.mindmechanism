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
  Music2,
  Home,
  Shield,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

type TabId = 'profile' | 'wheel' | 'appearance' | 'sound' | 'smart-home' | 'account'

const TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
  { id: 'profile',    label: 'Profile',     Icon: User        },
  { id: 'wheel',      label: 'Wheel',       Icon: LayoutGrid  },
  { id: 'appearance', label: 'Appearance',  Icon: Palette     },
  { id: 'sound',      label: 'Sound',       Icon: Music2      },
  { id: 'smart-home', label: 'Smart Home',  Icon: Home        },
  { id: 'account',    label: 'Account',     Icon: Shield      },
]

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('profile')

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
          'bg-white/92 dark:bg-black/92 backdrop-blur-lg'
        )}
      >
        <DialogTitle className="sr-only">Settings</DialogTitle>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* ── Mobile tab strip ────────────────────────────────────────── */}
        <div className="sm:hidden flex overflow-x-auto scrollbar-none border-b border-gray-200 dark:border-gray-800 shrink-0">
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
            className="hidden sm:flex flex-col w-44 shrink-0 border-r border-gray-200 dark:border-gray-800 p-2 gap-0.5"
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
          <div className="flex-1 min-w-0 min-h-0 overflow-y-auto overscroll-contain p-4">
            {activeTab === 'profile'    && <PersonalInfoSettings onChangesPending={setHasChanges} />}
            {activeTab === 'wheel'      && <WheelFacesSettings />}
            {activeTab === 'appearance' && <ThemeSettings />}
            {activeTab === 'sound'      && <SoundSettings />}
            {activeTab === 'smart-home' && <SmartHomeSettings />}
            {activeTab === 'account'    && <AccountSettings />}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-gray-200 dark:border-gray-800 px-4 py-3">
          <span className="text-xs text-gray-400 dark:text-gray-500">
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
