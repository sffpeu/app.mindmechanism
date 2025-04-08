'use client';

import { usePathname } from 'next/navigation';
import { ThemeProvider } from '@/app/ThemeContext';
import { AuthProvider } from '@/lib/FirebaseAuthContext';
import { NotesProvider } from '@/lib/NotesContext';
import { TimeTrackingProvider } from '@/lib/TimeTrackingContext';
import { ToastProvider } from '@/components/ToastProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SheetWrapper } from '@/components/ui/sheet';
import { MenuProvider, useMenu } from '@/app/MenuContext';

function LayoutContentInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/sessions');
  const { isMenuOpen } = useMenu();

  return (
    <SheetWrapper isOpen={isMenuOpen}>
      {isProtectedRoute ? (
        <ProtectedRoute>{children}</ProtectedRoute>
      ) : (
        children
      )}
    </SheetWrapper>
  );
}

export function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TimeTrackingProvider>
          <NotesProvider>
            <ToastProvider>
              <MenuProvider>
                <LayoutContentInner>{children}</LayoutContentInner>
              </MenuProvider>
            </ToastProvider>
          </NotesProvider>
        </TimeTrackingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
} 