import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LayoutContent } from './LayoutContent'
import { SoundProvider } from '@/components/SoundProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mind Mechanism',
  description:
    'Focused practice with nine celestial mandalas: timed sessions, notes, glossary, and optional group lobby.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SoundProvider>
            <LayoutContent>{children}</LayoutContent>
          </SoundProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

