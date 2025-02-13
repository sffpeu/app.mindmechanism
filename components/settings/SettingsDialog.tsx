'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { PersonalInfoSettings } from './PersonalInfoSettings'
import { SecuritySettings } from './SecuritySettings'
import { ThemeSettings } from './ThemeSettings'
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
    // Trigger save in child components
    window.dispatchEvent(new Event('settings-save'))
    onClose()
  }

  const handleCancel = () => {
    // Trigger cancel in child components
    window.dispatchEvent(new Event('settings-cancel'))
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[90vw] bg-white/90 dark:bg-black/90 backdrop-blur-lg p-0">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <PersonalInfoSettings onChangesPending={setHasChanges} />
          <SecuritySettings />
          <ThemeSettings />
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-800">
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 