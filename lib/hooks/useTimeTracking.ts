import { useEffect, useState } from 'react';
import { startTimeTracking, endTimeTracking, cleanupOrphanedTimeEntries } from '@/lib/timeTracking';

export const useTimeTracking = (userId: string | undefined | null, page: string) => {
  const [timeEntryId, setTimeEntryId] = useState<string | null>(null);

  useEffect(() => {
    let entryId: string | null = null;
    let isCleanedUp = false;
    
    const startTracking = async () => {
      if (userId) {
        try {
          // Clean up any orphaned entries first
          await cleanupOrphanedTimeEntries(userId);
          
          // Start new tracking
          entryId = await startTimeTracking(userId, page);
          setTimeEntryId(entryId);
        } catch (error) {
          console.error('Error in time tracking:', error);
        }
      }
    };

    startTracking();

    const cleanup = async () => {
      if (entryId && !isCleanedUp) {
        try {
          await endTimeTracking(entryId);
          isCleanedUp = true;
        } catch (error) {
          console.error('Error ending time tracking:', error);
        }
      }
    };

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      cleanup();
    });

    // Handle page visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cleanup();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      cleanup();
      window.removeEventListener('beforeunload', cleanup);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, page]);

  return timeEntryId;
}; 