import useSound from 'use-sound';

// Sound hooks for different UI interactions
export const useSoundEffects = () => {
  const [playClick] = useSound('/sounds/click.mp3', { volume: 0.5 });
  const [playStart] = useSound('/sounds/start.mp3', { volume: 0.4 });
  const [playSuccess] = useSound('/sounds/success.mp3', { volume: 0.4 });
  const [playDialog] = useSound('/sounds/dialog.mp3', { volume: 0.3 });

  return {
    playClick,    // For general button clicks
    playStart,    // For starting a session
    playSuccess,  // For completing actions
    playDialog,   // For dialog/modal interactions
  };
}; 