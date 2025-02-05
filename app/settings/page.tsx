'use client'

import { useAuth } from '@/lib/FirebaseAuthContext'
import { Card } from '@/components/ui/card'
import { EditProfileModal } from '@/components/auth/EditProfileModal'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function SettingsPage() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Settings</h1>
        
        <div className="grid gap-6">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Profile Settings</h2>
            <div className="space-y-4">
              <EditProfileModal />
            </div>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
} 