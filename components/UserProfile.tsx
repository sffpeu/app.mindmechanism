'use client'

import { useAuth } from '@/lib/FirebaseAuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'

export default function UserProfile() {
  const { user, signOut } = useAuth()

  if (!user) {
    return null
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-white dark:bg-black/40 backdrop-blur-lg border border-black/5 dark:border-white/10">
      <Avatar>
        <AvatarImage src={user.photoURL || undefined} />
        <AvatarFallback>
          <User className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <h3 className="font-medium text-black dark:text-white">{user.displayName}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => signOut()}
        className="hover:bg-gray-100 dark:hover:bg-white/5"
      >
        <LogOut className="h-5 w-5" />
      </Button>
    </div>
  )
} 