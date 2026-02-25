'use client'

import { useAuth } from '@/lib/FirebaseAuthContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Mail } from 'lucide-react'

export function SecuritySettings() {
  const { user } = useAuth()

  const handleManageAccount = () => {
    window.open('https://myaccount.google.com/security', '_blank')
  }

  return (
    <Card className="p-4 bg-white/50 dark:bg-black/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          <p className="font-medium text-gray-900 dark:text-white">Google Account</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleManageAccount}
          className="flex items-center gap-1.5"
        >
          <Shield className="h-4 w-4" />
          Manage Security
        </Button>
      </div>
    </Card>
  )
} 