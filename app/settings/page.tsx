'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { PersonalInfoSettings } from '@/components/settings/PersonalInfoSettings'
import { SecuritySettings } from '@/components/settings/SecuritySettings'
import { ThemeSettings } from '@/components/settings/ThemeSettings'

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Settings</h1>
        
        <div className="grid gap-6 max-w-3xl">
          <PersonalInfoSettings />
          <SecuritySettings />
          <ThemeSettings />
        </div>
      </div>
    </ProtectedRoute>
  )
} 