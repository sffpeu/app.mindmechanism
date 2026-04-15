'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { PersonalInfoSettings } from './PersonalInfoSettings'
import { SecuritySettings } from './SecuritySettings'
import { ThemeSettings } from './ThemeSettings'
import { WheelFacesSettings } from './WheelFacesSettings'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useState } from 'react'

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [hasChanges, setHasChanges] = useState(false)

  const handleSave = () => {
    const onComplete = () => {
      setHasChanges(false)
      onClose()
    }
    window.addEventListener('settings-save-complete', onComplete, { once: true })
    window.dispatchEvent(new Event('settings-save'))
  }

  const handleCancel = () => {
    // Trigger cancel in child components
    window.dispatchEvent(new Event('settings-cancel'))
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[90vw] max-h-[min(90vh,880px)] gap-0 p-0 flex flex-col overflow-hidden bg-white/90 dark:bg-black/90 backdrop-blur-lg">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-3">
          <PersonalInfoSettings onChangesPending={setHasChanges} />
          <WheelFacesSettings />
          <SecuritySettings />
          <ThemeSettings />
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-gray-200 p-4 dark:border-gray-800">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 