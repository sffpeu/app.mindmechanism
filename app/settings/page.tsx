'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/FirebaseAuthContext'
import { Card } from '@/components/ui/card'
import { EditProfileModal } from '@/components/auth/EditProfileModal'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { User } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Settings</h1>
        
        <div className="grid gap-6">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Profile Settings</h2>
            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2"
                onClick={() => setIsProfileModalOpen(true)}
              >
                <User className="h-4 w-4" />
                Edit Profile
              </Button>
              <EditProfileModal 
                isOpen={isProfileModalOpen} 
                onClose={() => setIsProfileModalOpen(false)} 
              />
            </div>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
} 