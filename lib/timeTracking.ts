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
  FieldValue
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

interface TimeEntry {
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

export const startTimeTracking = async (userId: string, page: string) => {
  try {
    const currentUser = checkAuth();
    
    if (!userId || userId !== currentUser.uid) {
      throw new Error('Invalid user ID');
    }

    if (!isValidPage(page)) {
      throw new Error(`Invalid page. Must be one of: ${VALID_PAGES.join(', ')}`);
    }

    const timeEntry: TimeEntryInput = {
      userId,
      startTime: serverTimestamp(),
      page
    };

    validateTimeEntry(timeEntry);
    
    const docRef = await addDoc(collection(db, 'timeTracking'), timeEntry);
    return docRef.id;
  } catch (error) {
    console.error('Error starting time tracking:', error);
    throw error;
  }
};

export const endTimeTracking = async (entryId: string) => {
  try {
    const currentUser = checkAuth();

    if (!entryId) {
      throw new Error('Entry ID is required');
    }

    const entryRef = doc(db, 'timeTracking', entryId);
    
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
    
    if (!userId || userId !== currentUser.uid) {
      throw new Error('Invalid user ID');
    }

    const timeQuery = query(
      collection(db, 'timeTracking'),
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

  snapshot.forEach((doc) => {
    const data = doc.data();
    
    if (!isValidTimeEntry(data)) {
      console.warn('Invalid time entry found:', doc.id, data);
      return;
    }

    try {
      const startDate = data.startTime.toDate();
      let duration = 0;

      if (data.endTime?.toDate) {
        duration = data.endTime.toDate().getTime() - startDate.getTime();
      } else {
        // For active sessions, calculate duration up to now
        duration = now.getTime() - startDate.getTime();
      }

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
      }
    } catch (err) {
      console.warn('Error processing time entry:', doc.id, err);
    }
  });

  return {
    totalTime,
    monthlyTime,
    lastSignInTime
  };
} 