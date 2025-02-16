import './globals.css'
import { ThemeProvider } from './ThemeContext'
import { AuthProvider } from '@/lib/FirebaseAuthContext'
import { Toaster } from '@/components/ui/toaster'
import { NotesProvider } from '@/lib/NotesContext'
import { DiaryProvider } from '@/lib/DiaryContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <DiaryProvider>
              <NotesProvider>
                {children}
              </NotesProvider>
            </DiaryProvider>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

