'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useAuth, type AuthContextType } from '@/lib/FirebaseAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FcGoogle } from 'react-icons/fc'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignIn, setIsSignIn] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { signIn, signUp, signInWithGoogle } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      if (isSignIn) {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
      onClose()
    } catch (err) {
      setError('Failed to authenticate. Please check your credentials.')
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
      onClose()
    } catch (err) {
      setError('Failed to sign in with Google.')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-center">
            {isSignIn ? 'Sign In' : 'Sign Up'}
          </h2>
          
          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              {isSignIn ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
          >
            <FcGoogle className="mr-2 h-4 w-4" />
            Google
          </Button>

          <p className="text-sm text-center">
            {isSignIn ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={() => setIsSignIn(!isSignIn)}
              className="ml-1 text-primary hover:underline"
            >
              {isSignIn ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
} 