import useSound from 'use-sound';
import { useSettings } from '@/lib/hooks/useSettings';

// ─── Wheel ambient slot paths ────────────────────────────────────────────────
// Drop the commissioned audio files here when ready.
// Naming convention: wheel_0.mp3 … wheel_8.mp3, grand_clock.mp3
// Soundscape loops: soundscape_0.mp3 … soundscape_8.mp3
// Files are served from /public/sounds/

export const WHEEL_AMBIENT_PATHS: Record<number, string> = {
  0: '/sounds/wheel_0.mp3',
  1: '/sounds/wheel_1.mp3',
  2: '/sounds/wheel_2.mp3',
  3: '/sounds/wheel_3.mp3',
  4: '/sounds/wheel_4.mp3',
  5: '/sounds/wheel_5.mp3',
  6: '/sounds/wheel_6.mp3',
  7: '/sounds/wheel_7.mp3',
  8: '/sounds/wheel_8.mp3',
}

export const SOUNDSCAPE_PATHS: Record<number, string> = {
  0: '/sounds/soundscape_0.mp3',
  1: '/sounds/soundscape_1.mp3',
  2: '/sounds/soundscape_2.mp3',
  3: '/sounds/soundscape_3.mp3',
  4: '/sounds/soundscape_4.mp3',
  5: '/sounds/soundscape_5.mp3',
  6: '/sounds/soundscape_6.mp3',
  7: '/sounds/soundscape_7.mp3',
  8: '/sounds/soundscape_8.mp3',
}

export const GRAND_CLOCK_PATH = '/sounds/grand_clock.mp3'

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