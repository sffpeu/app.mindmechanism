import React from 'react';
import { Card } from "@/components/ui/card";
import { Timer as TimerIcon, Pause, Play } from 'lucide-react';

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
    <Card className={`p-4 flex items-center justify-between bg-white/80 dark:bg-black/80 backdrop-blur-sm ${className}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-900">
          <TimerIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </div>
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Time Remaining</div>
          <div className="text-2xl font-medium text-gray-900 dark:text-white">
            {formatTime(remainingTime || 0)}
          </div>
        </div>
      </div>
      <button
        onClick={onPauseResume}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
        aria-label={isPaused ? "Resume session" : "Pause session"}
      >
        {isPaused ? (
          <Play className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        ) : (
          <Pause className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        )}
      </button>
    </Card>
  );
} 