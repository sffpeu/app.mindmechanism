'use client'

import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs'

export function AuthButtons() {
  const { isSignedIn } = useAuth()

  if (isSignedIn) {
    return (
      <div className="flex items-center">
        <UserButton 
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "h-8 w-8"
            }
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="modal">
        <button className="px-3 py-1.5 text-sm rounded-lg bg-white/10 dark:bg-black/10 backdrop-blur-lg border border-black/10 dark:border-white/20 text-black dark:text-white hover:bg-white/20 dark:hover:bg-black/20 transition-all">
          Sign In
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="px-3 py-1.5 text-sm rounded-lg bg-black dark:bg-white backdrop-blur-lg text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 transition-all">
          Sign Up
        </button>
      </SignUpButton>
    </div>
  )
} 