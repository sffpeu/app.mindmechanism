import { useAuth } from '@/lib/FirebaseAuthContext'
import { Card } from '@/components/ui/card'
import { EditProfileModal } from '@/components/auth/EditProfileModal'
import { Button } from '@/components/ui/button'
import { User } from 'lucide-react'
import { useState } from 'react'

export function PersonalInfoSettings() {
  const { user } = useAuth()
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Personal Information</h2>
      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="font-medium">{user?.email || 'Not set'}</p>
        </div>
        <div className="flex flex-col space-y-2">
          <p className="text-sm text-muted-foreground">Display Name</p>
          <p className="font-medium">{user?.displayName || 'Not set'}</p>
        </div>
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
  )
} 