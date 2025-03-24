import useSound from 'use-sound';

// Volume levels for different sound types
const VOLUMES = {
  click: 0.15,    // Subtle click for buttons
  start: 0.25,    // Slightly more noticeable for session start
  success: 0.25,  // Success sounds
  dialog: 0.15,   // Dialog interactions
};

export const useSoundEffects = () => {
  // Button click sound
  const [playClick] = useSound('/sounds/click.mp3', { 
    volume: VOLUMES.click,
    sprite: {
      short: [0, 50],  // Very short version for rapid clicks
      normal: [0, 100] // Normal version for regular clicks
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
      open: [0, 150],
      close: [150, 300]
    }
  });

  return {
    playClick: (type: 'short' | 'normal' = 'normal') => playClick({ id: type }),
    playStart,
    playSuccess,
    playDialog: (action: 'open' | 'close') => playDialog({ id: action }),
  };
}; 