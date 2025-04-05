import useSound from 'use-sound';
import { useSettings } from '@/lib/hooks/useSettings';

// Single consistent volume for all click sounds
const VOLUME = 0.15;

export const useSoundEffects = () => {
  const { soundEnabled } = useSettings();

  // Single unified click sound for all interactions
  const [playClick] = useSound('/sounds/click.wav', { 
    volume: VOLUME,
    enabled: soundEnabled
  });

  return {
    playClick,
    // Alias all other sound functions to use the same click sound
    playStart: playClick,
    playStep1: playClick,
    playStep2: playClick,
    playSuccess: playClick,
    playDialog: () => playClick(),
  };
}; 