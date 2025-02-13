import { useAuth } from '@/lib/FirebaseAuthContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Google } from 'lucide-react'
import { getAuth } from 'firebase/auth'

export function SecuritySettings() {
  const { user } = useAuth()
  const auth = getAuth()

  const handleManageAccount = () => {
    // This will open Firebase's account management page
    if (auth.currentUser) {
      window.open(`https://console.firebase.google.com/project/_/authentication/users/${auth.currentUser.uid}`, '_blank')
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Login & Security</h2>
      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <p className="text-sm text-muted-foreground">Sign-in Provider</p>
          <div className="flex items-center gap-2">
            <Google className="h-4 w-4" />
            <p className="font-medium">Google Account</p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2"
          onClick={handleManageAccount}
        >
          <Shield className="h-4 w-4" />
          Manage Account Security
        </Button>
      </div>
    </Card>
  )
} 