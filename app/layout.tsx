import './globals.css'
import { ThemeProvider } from './ThemeContext'
import { FirebaseAuthProvider } from '@/lib/FirebaseAuthContext'
import { Toaster } from '@/components/ui/toaster'

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
            {children}
            <Toaster />
          </FirebaseAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

