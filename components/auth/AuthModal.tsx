'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { auth } from '@/lib/firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'signin' | 'signup'
}

export function AuthModal({ isOpen, onClose, mode }: AuthModalProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      if (!auth) {
        throw new Error('Firebase auth is not initialized')
      }

      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
      
      onClose()
      router.push('/dashboard')
    } catch (error) {
      console.error('Authentication error:', error)
      setError('Failed to authenticate. Please check your credentials.')
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      if (!auth) {
        throw new Error('Firebase auth is not initialized')
      }
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      onClose()
      router.push('/dashboard')
    } catch (error) {
      console.error('Error signing in with Google:', error)
      setError('Failed to sign in with Google.')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-black/90 border border-gray-200 dark:border-white/10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <Button type="submit" className="w-full">
            {mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-black/90 px-2 text-gray-500 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            className="w-full"
          >
            Continue with Google
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
} 