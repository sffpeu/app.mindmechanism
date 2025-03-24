import { useEffect } from 'react';
import { useSoundEffects } from '@/lib/sounds';

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const { playClick } = useSoundEffects();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Only play sound for left clicks on interactive elements
      if (e.button === 0) {
        const target = e.target as HTMLElement;
        const isInteractive = 
          target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.closest('button') ||
          target.closest('a') ||
          target.getAttribute('role') === 'button' ||
          target.closest('[role="button"]') ||
          target.closest('[role="tab"]') ||
          target.closest('[role="menuitem"]') ||
          target.closest('[role="option"]') ||
          target.closest('[role="switch"]') ||
          target.closest('[role="checkbox"]') ||
          target.closest('[role="radio"]');

        if (isInteractive) {
          playClick('short');
        }
      }
    };

    // Add click listener to document
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [playClick]);

  return <>{children}</>;
} 