import React from 'react';
import { Pause, Play } from 'lucide-react';

interface TimerProps {
  remainingTime: number | null;
  isPaused: boolean;
  onPauseResume: () => void;
  className?: string;
}

// Helper function to format time
const formatTime = (ms: number) => {
  if (!ms) return "00:00";
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default function Timer({ remainingTime, isPaused, onPauseResume, className = '' }: TimerProps) {
  return (
    <div className={`flex items-center gap-2 bg-white/10 dark:bg-black/20 backdrop-blur-sm rounded-lg px-3 py-1.5 ${className}`}>
      <span className="font-medium text-black/70 dark:text-white/70">
        {formatTime(remainingTime || 0)}
      </span>
      <button
        onClick={onPauseResume}
        className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        aria-label={isPaused ? "Resume session" : "Pause session"}
      >
        {isPaused ? (
          <Play className="w-3.5 h-3.5 text-black/50 dark:text-white/50" />
        ) : (
          <Pause className="w-3.5 h-3.5 text-black/50 dark:text-white/50" />
        )}
      </button>
    </div>
  );
} 