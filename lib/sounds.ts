import useSound from 'use-sound';

// Volume levels for different sound types
const VOLUMES = {
  click: 0.2,    // Subtle click for buttons
  start: 0.3,    // Slightly more noticeable for session start
  success: 0.3,  // Success sounds
  dialog: 0.2,   // Dialog interactions
};

export const useSoundEffects = () => {
  // Button click sound
  const [playClick] = useSound('/sounds/click.mp3', { 
    volume: VOLUMES.click,
    sprite: {
      short: [0, 100], // Short version for rapid clicks
      normal: [0, 200] // Normal version for regular clicks
    }
  });

  // Session start sound
  const [playStart] = useSound('/sounds/start.mp3', { 
    volume: VOLUMES.start 
  });

  // Success sound (for completing actions)
  const [playSuccess] = useSound('/sounds/success.mp3', { 
    volume: VOLUMES.success 
  });

  // Dialog open/close sound
  const [playDialog] = useSound('/sounds/dialog.mp3', { 
    volume: VOLUMES.dialog,
    sprite: {
      open: [0, 200],
      close: [200, 400]
    }
  });

  return {
    playClick: (type: 'short' | 'normal' = 'normal') => playClick({ id: type }),
    playStart,
    playSuccess,
    playDialog: (action: 'open' | 'close') => playDialog({ id: action }),
  };
}; 