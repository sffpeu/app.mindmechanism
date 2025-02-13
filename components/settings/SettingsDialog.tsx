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
      <DialogContent className="max-w-3xl bg-white/90 dark:bg-black/90 backdrop-blur-lg">
        <h1 className="text-4xl font-bold mb-8">Settings</h1>
        <div className="grid gap-6">
          <PersonalInfoSettings />
          <SecuritySettings />
          <ThemeSettings />
        </div>
      </DialogContent>
    </Dialog>
  )
} 