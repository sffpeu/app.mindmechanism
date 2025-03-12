'use client';

import { usePathname } from 'next/navigation';
import { ThemeProvider } from '@/lib/ThemeContext';
import { AuthProvider } from '@/lib/FirebaseAuthContext';
import { NotesProvider } from '@/lib/NotesContext';
import { TimeTrackingProvider } from '@/lib/TimeTrackingContext';
import { ToastProvider } from '@/components/ToastProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/sessions');

  return (
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
  );
} 