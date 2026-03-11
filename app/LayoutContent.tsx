'use client';

import { usePathname } from 'next/navigation';
import { ThemeProvider } from '@/app/ThemeContext';
import { AuthProvider } from '@/lib/FirebaseAuthContext';
import { NotesProvider } from '@/lib/NotesContext';
import { TimeTrackingProvider } from '@/lib/TimeTrackingContext';
import { ToastProvider } from '@/components/ToastProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppDock } from '@/components/AppDock';

function LayoutContentInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/sessions');

  return (
    <>
      <div className="min-h-screen pb-24">
        {isProtectedRoute ? (
          <ProtectedRoute>{children}</ProtectedRoute>
        ) : (
          children
        )}
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