import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface HintPopupProps {
  title: string
  description: string
  storageKey: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HintPopup({
  title,
  description,
  storageKey,
  open,
  onOpenChange
}: HintPopupProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(storageKey, 'true')
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-black border-white/20 dark:border-white/10 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
          <div className="flex items-center space-x-2 mt-4">
            <Switch
              id="dont-show-again"
              checked={dontShowAgain}
              onCheckedChange={setDontShowAgain}
            />
            <Label htmlFor="dont-show-again" className="text-sm text-gray-600 dark:text-gray-400">
              Don't show this again
            </Label>
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleClose}
            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 