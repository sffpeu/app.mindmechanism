import { useEffect, useState } from "react";
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 5000; // 5 seconds

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(Math.floor((elapsed / duration) * 100), 99);
      setProgress(newProgress);

      if (elapsed < duration) {
        requestAnimationFrame(updateProgress);
      }
    };

    requestAnimationFrame(updateProgress);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={cn(
        "animate-spin rounded-full border-2 border-gray-200 dark:border-gray-700 border-t-gray-900 dark:border-t-white",
        sizeClasses[size]
      )} />
      <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
        {progress}
      </div>
    </div>
  )
} 