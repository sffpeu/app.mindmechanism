'use client';

import { Toaster } from 'sonner';
import { useTheme } from '@/app/ThemeContext';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useTheme();

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: isDarkMode ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)',
            color: isDarkMode ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          },
        }}
      />
      {children}
    </>
  );
} 