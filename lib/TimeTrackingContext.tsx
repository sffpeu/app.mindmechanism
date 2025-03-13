'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/app/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TimeTrackingContextType {
  timeTracking: Record<string, number>;
  updateTimeSpent: (page: string) => void;
}

const TimeTrackingContext = createContext<TimeTrackingContextType>({
  timeTracking: {},
  updateTimeSpent: () => {},
});

export function TimeTrackingProvider({ children }: { children: React.ReactNode }) {
  const [timeTracking, setTimeTracking] = useState<Record<string, number>>({});
  const { user } = useAuth();

  useEffect(() => {
    if (user && db) {
      const loadTimeTracking = async () => {
        try {
          if (!db) return;
          const docRef = doc(db, 'timeTracking', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setTimeTracking(docSnap.data() as Record<string, number>);
          }
        } catch (error) {
          console.error('Error loading time tracking:', error);
        }
      };
      loadTimeTracking();
    }
  }, [user]);

  const updateTimeSpent = async (page: string) => {
    if (!user || !db) return;

    try {
      const updatedTracking = {
        ...timeTracking,
        [page]: (timeTracking[page] || 0) + 1,
      };

      setTimeTracking(updatedTracking);
      await setDoc(doc(db, 'timeTracking', user.uid), updatedTracking);
    } catch (error) {
      console.error('Error updating time tracking:', error);
    }
  };

  return (
    <TimeTrackingContext.Provider value={{ timeTracking, updateTimeSpent }}>
      {children}
    </TimeTrackingContext.Provider>
  );
}

export function useTimeTracking() {
  return useContext(TimeTrackingContext);
} 