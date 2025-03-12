import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from './ThemeContext'
import { AuthProvider } from './AuthContext'
import { NotesProvider } from '@/lib/NotesContext'
import { Toaster } from 'sonner'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { usePathname } from '@/hooks/usePathname'
import { TimeTrackingProvider } from '@/lib/TimeTrackingContext'
import { ToastProvider } from '@/components/ToastProvider'

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
  const pathname = usePathname();
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/sessions');

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <TimeTrackingProvider>
              <NotesProvider>
                <ToastProvider>
                  {isProtectedRoute ? (
                    <ProtectedRoute>{children}</ProtectedRoute>
                  ) : (
                    children
                  )}
                </ToastProvider>
              </NotesProvider>
            </TimeTrackingProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

