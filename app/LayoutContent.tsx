'use client';

import { usePathname } from 'next/navigation';
import { ThemeProvider } from '@/app/ThemeContext';
import { AuthProvider } from '@/lib/FirebaseAuthContext';
import { NotesProvider } from '@/lib/NotesContext';
import { TimeTrackingProvider } from '@/lib/TimeTrackingContext';
import { ToastProvider } from '@/components/ToastProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { EmailVerificationGate } from '@/components/auth/EmailVerificationGate';
import { AppDock } from '@/components/AppDock';
import { ResearchConsentTrigger } from '@/components/research/ResearchConsentTrigger';
import { PassportKeyProvider } from '@/components/passport/PassportKeyProvider';
import { Footer } from '@/components/layout/Footer';
import { PortalProvider } from '@/contexts/PortalContext';
import { DoormanBar } from '@/components/doorman/DoormanBar';

function isShellPublic(pathname: string): boolean {
  if (pathname === '/' || pathname === '/home' || pathname === '/home/') return true
  if (pathname === '/datenschutz' || pathname === '/datenschutz/') return true
  if (pathname === '/register' || pathname === '/register/') return true
  if (pathname.startsWith('/auth/')) return true
  return false
}

function LayoutContentInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/sessions') ||
    pathname.startsWith('/lobby') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/deck') ||
    pathname.startsWith('/record');

  const routed = isProtectedRoute ? (
    <ProtectedRoute>{children}</ProtectedRoute>
  ) : (
    children
  )

  const content = isShellPublic(pathname) ? routed : <EmailVerificationGate>{routed}</EmailVerificationGate>

  return (
    <>
      <div className="h-screen overflow-hidden flex flex-col">
        <DoormanBar />
        <div className="flex-1 min-h-0 overflow-auto">
          {content}
        </div>
        <Footer />
      </div>
      <AppDock />
      <ResearchConsentTrigger />
    </>
  );
}

export function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PortalProvider>
          <PassportKeyProvider>
            <TimeTrackingProvider>
              <NotesProvider>
                <ToastProvider>
                  <LayoutContentInner>{children}</LayoutContentInner>
                </ToastProvider>
              </NotesProvider>
            </TimeTrackingProvider>
          </PassportKeyProvider>
        </PortalProvider>
      </AuthProvider>
    </ThemeProvider>
  );
} 