import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from './ThemeContext'
import { AuthProvider } from './AuthContext'
import { NotesProvider } from '@/lib/NotesContext'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mind Mechanism',
  description: 'A meditation app for focused practice',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <NotesProvider>
              {children}
              <Toaster />
            </NotesProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

