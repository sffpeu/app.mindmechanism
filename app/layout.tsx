import './globals.css'
import { ThemeProvider } from './ThemeContext'
import { FirebaseAuthProvider } from '@/lib/FirebaseAuthContext'
import { Toaster } from '@/components/ui/toaster'
import { NotesProvider } from '@/lib/NotesContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <FirebaseAuthProvider>
            <NotesProvider>
              {children}
            </NotesProvider>
            <Toaster />
          </FirebaseAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

