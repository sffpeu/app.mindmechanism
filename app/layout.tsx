import type { Metadata } from 'next'
import { Inter, Montserrat, Lora, IBM_Plex_Sans } from 'next/font/google'
import './globals.css'
import { LayoutContent } from './LayoutContent'
import { SoundProvider } from '@/components/SoundProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { FontProvider } from '@/components/FontProvider'
import { AccessibilityProvider } from '@/components/AccessibilityProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' })
const lora = Lora({ subsets: ['latin'], variable: '--font-lora' })
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex',
})

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
  const fontVars = [inter.variable, montserrat.variable, lora.variable, ibmPlexSans.variable].join(' ')
  return (
    <html lang="en" suppressHydrationWarning className={fontVars}>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FontProvider>
            <AccessibilityProvider>
              <SoundProvider>
                <LayoutContent>{children}</LayoutContent>
              </SoundProvider>
            </AccessibilityProvider>
          </FontProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

