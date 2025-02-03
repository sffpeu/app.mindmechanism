import { db } from '@/lib/firebase';
import { 
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp,
  doc,
  updateDoc,
  orderBy
} from 'firebase/firestore';

interface TimeEntry {
  userId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  duration?: number; // in milliseconds
  page: string;
}

export const startTimeTracking = async (userId: string, page: string) => {
  try {
    const timeEntry = {
      userId,
      startTime: serverTimestamp(),
      page
    };
    
    const docRef = await addDoc(collection(db, 'timeTracking'), timeEntry);
    return docRef.id;
  } catch (error) {
    console.error('Error starting time tracking:', error);
    throw error;
  }
};

export const endTimeTracking = async (entryId: string) => {
  try {
    const endTime = serverTimestamp();
    const entryRef = doc(db, 'timeTracking', entryId);
    
    await updateDoc(entryRef, {
      endTime,
    });
  } catch (error) {
    console.error('Error ending time tracking:', error);
    throw error;
  }
};

export const calculateUserTimeStats = async (userId: string) => {
  try {
    const timeQuery = query(
      collection(db, 'timeTracking'),
      where('userId', '==', userId),
      orderBy('startTime', 'desc')
    );

    const snapshot = await getDocs(timeQuery);
    const now = new Date();
    let totalTime = 0;
    let monthlyTime = 0;
    let lastSignInTime = null;

    snapshot.forEach((doc) => {
      const data = doc.data() as TimeEntry;
      const startDate = data.startTime.toDate();
      let duration;

      if (data.endTime) {
        duration = data.endTime.toDate().getTime() - startDate.getTime();
      } else {
        // For active sessions, calculate duration up to now
        duration = now.getTime() - startDate.getTime();
      }

      totalTime += duration;

      // Update last sign in time
      if (!lastSignInTime || startDate > lastSignInTime) {
        lastSignInTime = startDate;
      }

      // Check if the entry is from the current month
      if (startDate.getMonth() === now.getMonth() && 
          startDate.getFullYear() === now.getFullYear()) {
        monthlyTime += duration;
      }
    });

    return {
      totalTime,
      monthlyTime,
      lastSignInTime
    };
  } catch (error) {
    console.error('Error calculating time stats:', error);
    return {
      totalTime: 0,
      monthlyTime: 0,
      lastSignInTime: null
    };
  }
}; 