'use client';

import { Toaster } from 'sonner';
import { useTheme } from '@/app/ThemeContext';
import { useSettings } from '@/lib/hooks/useSettings';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useTheme();
  const { accessibilityEnabled, accessibilityMode } = useSettings();
  const hearingBoost = accessibilityEnabled && accessibilityMode === 'hearing';
  const visualBoost = accessibilityEnabled && accessibilityMode === 'visual';

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: isDarkMode ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)',
            color: isDarkMode ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
            border: hearingBoost
              ? '2px solid rgba(147, 197, 253, 0.7)'
              : isDarkMode
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid rgba(0, 0, 0, 0.1)',
            fontSize: hearingBoost ? '1.05rem' : visualBoost ? '1rem' : '0.95rem',
            fontWeight: hearingBoost ? 600 : 500,
          },
        }}
      />
      {children}
    </>
  );
} 