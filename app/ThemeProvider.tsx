'use client'

import { useState, useEffect } from 'react'
import { ThemeContext } from './ThemeContext'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('system')

  useEffect(() => {
    // Load saved preference from localStorage
    const savedPreference = localStorage.getItem('themePreference') as 'light' | 'dark' | 'system' | null
    if (savedPreference) {
      setThemePreference(savedPreference)
    }
  }, [])

  useEffect(() => {
    // Save preference to localStorage
    localStorage.setItem('themePreference', themePreference)

    // Apply theme based on preference
    if (themePreference === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDarkMode(prefersDark)
    } else {
      setIsDarkMode(themePreference === 'dark')
    }
  }, [themePreference])

  useEffect(() => {
    // Update document class when dark mode changes
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  return (
    <ThemeContext.Provider 
      value={{ 
        isDarkMode, 
        setIsDarkMode,
        theme: isDarkMode ? 'dark' : 'light',
        themePreference,
        setThemePreference
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}