'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { PersonalInfoSettings } from './PersonalInfoSettings'
import { SecuritySettings } from './SecuritySettings'
import { ThemeSettings } from './ThemeSettings'

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[90vw] max-h-[85vh] overflow-y-auto bg-white/90 dark:bg-black/90 backdrop-blur-lg">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Settings</h1>
        <div className="grid gap-4">
          <PersonalInfoSettings />
          <SecuritySettings />
          <ThemeSettings />
        </div>
      </DialogContent>
    </Dialog>
  )
} 