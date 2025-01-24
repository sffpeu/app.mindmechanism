'use client'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { getServerSession } from 'next-auth'
import { Providers } from './providers'
import { useEffect, useState } from 'react'
import { ThemeContext } from './ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mind Mechanism',
  description: 'Mind Mechanism - A new way to meditate',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme')
    if (storedTheme) {
      setIsDarkMode(storedTheme === 'dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDarkMode(prefersDark)
      localStorage.setItem('theme', prefersDark ? 'dark' : 'light')
    }
  }, [])

  // Update document class and localStorage when dark mode changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDarkMode])

  return (
    <html lang="en" className={isDarkMode ? 'dark' : ''}>
      <body className={inter.className}>
        <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode }}>
          <Providers session={session}>
            {children}
          </Providers>
        </ThemeContext.Provider>
      </body>
    </html>
  )
}

