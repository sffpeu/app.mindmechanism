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

function isShellPublic(pathname: string): boolean {
  if (pathname === '/' || pathname === '/home' || pathname === '/home/') return true
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
    pathname.startsWith('/deck');

  const routed = isProtectedRoute ? (
    <ProtectedRoute>{children}</ProtectedRoute>
  ) : (
    children
  )

  const content = isShellPublic(pathname) ? routed : <EmailVerificationGate>{routed}</EmailVerificationGate>

  return (
    <>
      <div className="h-screen overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          {content}
        </div>
      </div>
      <AppDock />
    </>
  );
}

export function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TimeTrackingProvider>
          <NotesProvider>
            <ToastProvider>
              <LayoutContentInner>{children}</LayoutContentInner>
            </ToastProvider>
          </NotesProvider>
        </TimeTrackingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
} 