import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LayoutContent } from './LayoutContent'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mind Mechanism',
  description: 'A meditation app for focused practice',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <LayoutContent>{children}</LayoutContent>
      </body>
    </html>
  );
}

