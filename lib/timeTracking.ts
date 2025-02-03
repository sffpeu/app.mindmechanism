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
  orderBy,
  DocumentData,
  onSnapshot,
  QuerySnapshot,
  FieldValue,
  Firestore,
  writeBatch
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

interface TimeEntry {
  id?: string;  // Make id optional since it comes from Firestore
  userId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  duration?: number; // in milliseconds
  page: string;
}

interface TimeEntryInput {
  userId: string;
  startTime: Timestamp | FieldValue;
  endTime?: Timestamp | FieldValue;
  duration?: number;
  page: string;
}

type TimeStats = {
  totalTime: number;
  monthlyTime: number;
  lastSignInTime: Date | null;
};

const VALID_PAGES = ['dashboard', 'clock', 'sessions', 'notes'] as const;
type ValidPage = typeof VALID_PAGES[number];

function isValidPage(page: string): page is ValidPage {
  return VALID_PAGES.includes(page as ValidPage);
}

function isValidTimeEntry(entry: any): entry is TimeEntry {
  return (
    entry &&
    typeof entry.userId === 'string' &&
    entry.startTime instanceof Timestamp &&
    (entry.endTime === undefined || entry.endTime instanceof Timestamp) &&
    typeof entry.page === 'string' &&
    isValidPage(entry.page)
  );
}

function validateTimeEntry(entry: Partial<TimeEntryInput>) {
  if (!entry.userId) {
    throw new Error('Invalid time entry: Missing user ID');
  }
  if (!entry.page) {
    throw new Error('Invalid time entry: Missing page');
  }
  if (!isValidPage(entry.page)) {
    throw new Error(`Invalid time entry: Invalid page. Must be one of: ${VALID_PAGES.join(', ')}`);
  }
  if (entry.startTime && !(entry.startTime instanceof Timestamp) && !(entry.startTime instanceof FieldValue)) {
    throw new Error('Invalid time entry: Invalid startTime format');
  }
  if (entry.endTime && !(entry.endTime instanceof Timestamp) && !(entry.endTime instanceof FieldValue)) {
    throw new Error('Invalid time entry: Invalid endTime format');
  }
}

function checkAuth() {
  const auth = getAuth();
  if (!auth.currentUser) {
    throw new Error('User not authenticated');
  }
  return auth.currentUser;
}

function checkDb(): Firestore {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }
  return db;
}

export const startTimeTracking = async (userId: string, page: string) => {
  try {
    const currentUser = checkAuth();
    const firestore = checkDb();
    
    if (!userId || userId !== currentUser.uid) {
      throw new Error('Invalid user ID');
    }

    if (!isValidPage(page)) {
      throw new Error(`Invalid page. Must be one of: ${VALID_PAGES.join(', ')}`);
    }

    // Check for existing active sessions for this user and page
    const activeSessionsQuery = query(
      collection(firestore, 'timeTracking'),
      where('userId', '==', userId),
      where('page', '==', page),
      where('endTime', '==', null)
    );

    const activeSessions = await getDocs(activeSessionsQuery);
    
    // End any existing active sessions
    const batch = writeBatch(firestore);
    activeSessions.forEach(doc => {
      batch.update(doc.ref, {
        endTime: serverTimestamp()
      });
    });
    await batch.commit();

    // Create new time entry
    const timeEntry: TimeEntryInput = {
      userId,
      startTime: serverTimestamp(),
      page
    };

    validateTimeEntry(timeEntry);
    
    const docRef = await addDoc(collection(firestore, 'timeTracking'), timeEntry);
    return docRef.id;
  } catch (error) {
    console.error('Error starting time tracking:', error);
    throw error;
  }
};

export const endTimeTracking = async (entryId: string) => {
  try {
    const currentUser = checkAuth();
    const firestore = checkDb();

    if (!entryId) {
      throw new Error('Entry ID is required');
    }

    const entryRef = doc(firestore, 'timeTracking', entryId);
    
    await updateDoc(entryRef, {
      endTime: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error ending time tracking:', error);
    throw error;
  }
};

export const calculateUserTimeStats = async (userId: string): Promise<TimeStats> => {
  try {
    const currentUser = checkAuth();
    const firestore = checkDb();
    
    if (!userId || userId !== currentUser.uid) {
      throw new Error('Invalid user ID');
    }

    const timeQuery = query(
      collection(firestore, 'timeTracking'),
      where('userId', '==', userId),
      orderBy('startTime', 'desc')
    );

    const snapshot = await getDocs(timeQuery);
    return processTimeEntries(snapshot);
  } catch (error) {
    console.error('Error calculating time stats:', error);
    return {
      totalTime: 0,
      monthlyTime: 0,
      lastSignInTime: null
    };
  }
};

function processTimeEntries(snapshot: QuerySnapshot<DocumentData>): TimeStats {
  const now = new Date();
  let totalTime = 0;
  let monthlyTime = 0;
  let lastSignInTime: Date | null = null;

  // Sort entries by start time to handle overlapping sessions
  const entries = snapshot.docs
    .map(doc => {
      const data = doc.data();
      if (!isValidTimeEntry(data)) {
        console.warn('Invalid time entry found:', doc.id, data);
        return null;
      }
      return {
        ...data,
        id: doc.id
      } as TimeEntry;
    })
    .filter((entry): entry is TimeEntry => entry !== null)
    .sort((a, b) => a.startTime.toDate().getTime() - b.startTime.toDate().getTime());

  let lastEndTime: Date | null = null;

  entries.forEach((entry) => {
    try {
      const startDate = entry.startTime.toDate();
      let endDate: Date;

      if (entry.endTime?.toDate) {
        endDate = entry.endTime.toDate();
      } else {
        // For active sessions, use current time
        endDate = now;
      }

      // Handle overlapping sessions
      if (lastEndTime && startDate < lastEndTime) {
        // If this session starts before the last one ended,
        // use the later time as the start time
        startDate = lastEndTime;
      }

      const duration = endDate.getTime() - startDate.getTime();

      if (duration > 0) {
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

        // Update lastEndTime for next iteration
        lastEndTime = endDate;
      }
    } catch (err) {
      console.warn('Error processing time entry:', entry.id, err);
    }
  });

  return {
    totalTime,
    monthlyTime,
    lastSignInTime
  };
}

export const getTimeStats = async (userId: string): Promise<TimeStats> => {
  try {
    const currentUser = checkAuth();
    const firestore = checkDb();
    
    if (!userId || userId !== currentUser.uid) {
      throw new Error('Invalid user ID');
    }

    const timeQuery = query(
      collection(firestore, 'timeTracking'),
      where('userId', '==', userId),
      orderBy('startTime', 'desc')
    );

    const snapshot = await getDocs(timeQuery);
    const entries = snapshot.docs
      .map(doc => {
        const data = doc.data();
        if (!isValidTimeEntry(data)) {
          console.warn('Invalid time entry found:', doc.id, data);
          return null;
        }
        return {
          ...data,
          id: doc.id
        } as TimeEntry;
      })
      .filter((entry): entry is TimeEntry => entry !== null);

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalTime = entries.reduce((acc, entry) => {
      if (entry.duration) {
        return acc + entry.duration;
      }
      return acc;
    }, 0);

    const monthlyTime = entries.reduce((acc, entry) => {
      if (entry.startTime && entry.duration) {
        const entryDate = entry.startTime.toDate();
        if (entryDate >= thisMonth) {
          return acc + entry.duration;
        }
      }
      return acc;
    }, 0);

    return {
      totalTime,
      monthlyTime,
      lastSignInTime: currentUser.metadata.lastSignInTime 
        ? new Date(currentUser.metadata.lastSignInTime) 
        : null
    };
  } catch (error) {
    console.error('Error getting time stats:', error);
    throw error;
  }
};

export const subscribeToTimeTracking = (
  userId: string,
  onUpdate: (entries: TimeEntry[]) => void,
  onError: (error: Error) => void
) => {
  try {
    const firestore = checkDb();
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    const timeQuery = query(
      collection(firestore, 'timeTracking'),
      where('userId', '==', userId),
      orderBy('startTime', 'desc')
    );

    return onSnapshot(
      timeQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const entries = snapshot.docs
          .map(doc => {
            const data = doc.data();
            if (!isValidTimeEntry(data)) {
              console.warn('Invalid time entry found:', doc.id, data);
              return null;
            }
            return {
              ...data,
              id: doc.id
            } as TimeEntry;
          })
          .filter((entry): entry is TimeEntry => entry !== null);
        onUpdate(entries);
      },
      error => {
        console.error('Error in time tracking subscription:', error);
        onError(error);
      }
    );
  } catch (error) {
    console.error('Error setting up time tracking subscription:', error);
    if (error instanceof Error) {
      onError(error);
    } else {
      onError(new Error('Unknown error occurred'));
    }
    // Return a no-op unsubscribe function
    return () => {};
  }
}; 