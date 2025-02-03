import { useEffect, useState } from 'react';
import { startTimeTracking, endTimeTracking } from '@/lib/timeTracking';

export const useTimeTracking = (userId: string | undefined | null, page: string) => {
  const [timeEntryId, setTimeEntryId] = useState<string | null>(null);

  useEffect(() => {
    let entryId: string | null = null;
    
    const startTracking = async () => {
      if (userId) {
        entryId = await startTimeTracking(userId, page);
        setTimeEntryId(entryId);
      }
    };

    startTracking();

    return () => {
      if (entryId) {
        endTimeTracking(entryId);
      }
    };
  }, [userId, page]);

  return timeEntryId;
}; 