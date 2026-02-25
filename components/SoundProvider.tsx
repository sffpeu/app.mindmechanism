"use client";

import { useEffect } from 'react';
import { useSoundEffects } from '@/lib/sounds';
import { useSettings } from '@/lib/hooks/useSettings';

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const { playClick } = useSoundEffects();
  const { soundEnabled } = useSettings();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (soundEnabled) {
        playClick();
      }
    };

    // Add click listener to document
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [playClick, soundEnabled]);

  return <>{children}</>;
} 