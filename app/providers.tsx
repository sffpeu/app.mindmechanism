'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from './ThemeContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </ClerkProvider>
  )
} 