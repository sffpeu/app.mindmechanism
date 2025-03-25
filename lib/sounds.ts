import useSound from 'use-sound';

// Volume levels for different sound types
const VOLUMES = {
  click: 0.15,    // Subtle click for buttons
  start: 0.25,    // Slightly more noticeable for session start
  success: 0.25,  // Success sounds
  dialog: 0.15,   // Dialog interactions
  step: 0.25,     // Step sounds
};

export const useSoundEffects = () => {
  // Button click sound
  const [playClick] = useSound('/click.wav', { 
    volume: VOLUMES.click
  });

  // Session start sound
  const [playStart] = useSound('/startsession.ogg', { 
    volume: VOLUMES.start 
  });

  // Step sounds
  const [playStep1] = useSound('/step1.wav', { 
    volume: VOLUMES.step 
  });

  const [playStep2] = useSound('/step2.wav', { 
    volume: VOLUMES.step 
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
    playClick,
    playStart,
    playStep1,
    playStep2,
    playSuccess,
    playDialog: (action: 'open' | 'close') => playDialog({ id: action }),
  };
}; 