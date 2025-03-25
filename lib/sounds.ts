import useSound from 'use-sound';
import { useSettings } from '@/lib/hooks/useSettings';

// Volume levels for different sound types
const VOLUMES = {
  click: 0.15,    // Subtle click for buttons
  start: 0.25,    // Slightly more noticeable for session start
  success: 0.25,  // Success sounds
  dialog: 0.15,   // Dialog interactions
  step: 0.25,     // Step sounds
};

export const useSoundEffects = () => {
  const { soundEnabled } = useSettings();

  // Button click sound
  const [playClick] = useSound('/sounds/click.wav', { 
    volume: VOLUMES.click,
    enabled: soundEnabled
  });

  // Session start sound
  const [playStart] = useSound('/sounds/startsession.ogg', { 
    volume: VOLUMES.start,
    enabled: soundEnabled
  });

  // Step sounds
  const [playStep1] = useSound('/sounds/step1.wav', { 
    volume: VOLUMES.step,
    enabled: soundEnabled
  });

  const [playStep2] = useSound('/sounds/step2.wav', { 
    volume: VOLUMES.step,
    enabled: soundEnabled
  });

  // Success sound (for completing actions)
  const [playSuccess] = useSound('/sounds/step2.wav', { 
    volume: VOLUMES.success,
    enabled: soundEnabled
  });

  // Dialog open/close sound
  const [playDialog] = useSound('/sounds/step1.wav', { 
    volume: VOLUMES.dialog,
    enabled: soundEnabled,
    sprite: {
      open: [0, 150],
      close: [150, 300]
    }
  });

  return {
    playClick,
    playStart,
    playStep1,
    playStep2,
    playSuccess,
    playDialog: (action: 'open' | 'close') => playDialog({ id: action }),
  };
}; 