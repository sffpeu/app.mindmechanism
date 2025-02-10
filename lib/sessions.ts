import { db } from '@/lib/firebase';
import { 
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  addDoc,
  updateDoc,
  doc,
  orderBy,
  getDoc,
  FirestoreError,
  DocumentData,
  deleteDoc
} from 'firebase/firestore';

export interface SessionData {
  user_id: string;
  clock_id: number;
  duration: number;
  words: string[];
  moon_phase: string;
  moon_illumination: number;
  moon_rise: string;
  moon_set: string;
  weather_condition: string;
  temperature: number;
  humidity: number;
  uv_index: number;
  pressure: number;
  wind_speed: number;
  city: string;
  country: string;
  elevation: number;
  sea_level: number;
  latitude: number;
  longitude: number;
}

export interface Session extends SessionData {
  id: string;
  status: 'completed' | 'in_progress' | 'aborted';
  actual_duration: number;
  start_time: Timestamp;
  end_time?: Timestamp;
  last_active_time?: Timestamp;
  paused_duration?: number;
}

function validateSession(data: Partial<SessionData>): void {
  if (!data.user_id) {
    throw new Error('user_id is required');
  }
  if (typeof data.clock_id !== 'number') {
    throw new Error('clock_id must be a number');
  }
  if (typeof data.duration !== 'number' || data.duration <= 0) {
    throw new Error('duration must be a positive number');
  }
}

export async function createSession(data: SessionData): Promise<Session> {
  try {
    if (!db) throw new Error('Firestore is not initialized');
    
    validateSession(data);

    const sessionData = {
      ...data,
      start_time: Timestamp.now(),
      status: 'in_progress' as const,
      actual_duration: 0
    };

    const docRef = await addDoc(collection(db, 'sessions'), sessionData);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Failed to create session');
    }

    return {
      id: docRef.id,
      ...docSnap.data()
    } as Session;
  } catch (error) {
    console.error('Error in createSession:', error);
    if (error instanceof FirestoreError) {
      switch (error.code) {
        case 'permission-denied':
          throw new Error('You do not have permission to create sessions');
        case 'unavailable':
          throw new Error('Service is currently offline');
        default:
          throw new Error(`Failed to create session: ${error.message}`);
      }
    }
    throw error;
  }
}

export async function updateSession(
  sessionId: string, 
  data: Partial<SessionData> & { 
    status: 'completed' | 'in_progress' | 'aborted';
    actual_duration: number;
    end_time?: string;
    last_active_time?: string;
    paused_duration?: number;
  }
): Promise<void> {
  try {
    if (!db) throw new Error('Firestore is not initialized');
    if (!sessionId) throw new Error('Session ID is required');

    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      throw new Error('Session not found');
    }

    const sessionData = sessionDoc.data() as Session;
    const now = new Date();
    let actualDuration = data.actual_duration;

    if (sessionData.status === 'in_progress' && (data.status === 'completed' || data.status === 'aborted')) {
      const lastActiveTime = sessionData.last_active_time?.toDate() || sessionData.start_time.toDate();
      const pausedDuration = sessionData.paused_duration || 0;
      actualDuration = now.getTime() - sessionData.start_time.toDate().getTime() - pausedDuration;
    }

    const updateData = {
      ...data,
      actual_duration: actualDuration,
      end_time: data.end_time ? Timestamp.fromDate(new Date(data.end_time)) : Timestamp.now(),
      last_active_time: data.last_active_time ? Timestamp.fromDate(new Date(data.last_active_time)) : Timestamp.now()
    };

    await updateDoc(sessionRef, updateData);
  } catch (error) {
    console.error('Error in updateSession:', error);
    throw error;
  }
}

export async function getUserSessions(userId: string): Promise<Session[]> {
  try {
    if (!db) throw new Error('Firestore is not initialized');
    if (!userId) throw new Error('User ID is required');

    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('user_id', '==', userId),
      orderBy('start_time', 'desc')
    );

    const snapshot = await getDocs(sessionsQuery);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        start_time: data.start_time,
        end_time: data.end_time
      } as Session;
    });
  } catch (error) {
    console.error('Error in getUserSessions:', error);
    if (error instanceof FirestoreError) {
      switch (error.code) {
        case 'permission-denied':
          throw new Error('You do not have permission to access these sessions');
        case 'unavailable':
          throw new Error('Service is currently offline');
        default:
          throw new Error(`Failed to fetch sessions: ${error.message}`);
      }
    }
    return [];
  }
}

interface UserStats {
  totalTime: number;
  totalSessions: number;
  completionRate: number;
  monthlyProgress: {
    totalSessions: number;
    totalTime: number;
    completionRate: number;
  };
}

export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    if (!db) throw new Error('Firestore is not initialized');
    if (!userId) throw new Error('User ID is required');

    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('user_id', '==', userId)
    );

    const snapshot = await getDocs(sessionsQuery);
    const sessions = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Session[];
    
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const completionRate = totalSessions ? (completedSessions.length / totalSessions) * 100 : 0;

    const now = new Date();
    const totalTime = sessions.reduce((acc, session) => {
      if (session.status === 'completed') {
        return acc + (session.actual_duration || 0);
      } else if (session.status === 'in_progress' && session.start_time) {
        const startTime = session.start_time.toDate();
        const lastActiveTime = session.last_active_time?.toDate() || startTime;
        const pausedDuration = session.paused_duration || 0;
        
        const activeTime = lastActiveTime.getTime() - startTime.getTime() - pausedDuration;
        return acc + activeTime;
      }
      return acc;
    }, 0);

    const thisMonth = sessions.filter(session => {
      if (!session.start_time) return false;
      const sessionDate = session.start_time.toDate();
      return sessionDate.getMonth() === now.getMonth() && 
             sessionDate.getFullYear() === now.getFullYear();
    });

    const monthlyProgress = {
      totalSessions: thisMonth.length,
      totalTime: calculateMonthlyTime(thisMonth),
      completionRate: thisMonth.length ? 
        (thisMonth.filter(s => s.status === 'completed').length / thisMonth.length) * 100 : 0
    };

    return {
      totalTime,
      totalSessions,
      completionRate,
      monthlyProgress
    };
  } catch (error) {
    console.error('Error in getUserStats:', error);
    return {
      totalTime: 0,
      totalSessions: 0,
      completionRate: 0,
      monthlyProgress: {
        totalSessions: 0,
        totalTime: 0,
        completionRate: 0
      }
    };
  }
}

function calculateMonthlyTime(sessions: Session[]): number {
  const now = new Date();
  return sessions.reduce((acc, session) => {
    if (session.status === 'completed') {
      return acc + (session.actual_duration || 0);
    } else if (session.status === 'in_progress' && session.start_time) {
      const startTime = session.start_time.toDate();
      const lastActiveTime = session.last_active_time?.toDate() || startTime;
      const pausedDuration = session.paused_duration || 0;
      
      const activeTime = lastActiveTime.getTime() - startTime.getTime() - pausedDuration;
      return acc + activeTime;
    }
    return acc;
  }, 0);
}

export async function deleteSession(sessionId: string): Promise<void> {
  try {
    if (!db) throw new Error('Firestore is not initialized');
    if (!sessionId) throw new Error('Session ID is required');

    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      throw new Error('Session not found');
    }

    await deleteDoc(sessionRef);
  } catch (error) {
    console.error('Error in deleteSession:', error);
    if (error instanceof FirestoreError) {
      switch (error.code) {
        case 'permission-denied':
          throw new Error('You do not have permission to delete this session');
        case 'not-found':
          throw new Error('Session not found');
        case 'unavailable':
          throw new Error('Service is currently offline');
        default:
          throw new Error(`Failed to delete session: ${error.message}`);
      }
    }
    throw error;
  }
}

export async function updateSessionActivity(sessionId: string): Promise<void> {
  try {
    if (!db) throw new Error('Firestore is not initialized');
    
    const sessionRef = doc(db, 'sessions', sessionId);
    await updateDoc(sessionRef, {
      last_active_time: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating session activity:', error);
    throw error;
  }
}

export async function pauseSession(sessionId: string): Promise<void> {
  try {
    if (!db) throw new Error('Firestore is not initialized');
    
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      throw new Error('Session not found');
    }

    const sessionData = sessionDoc.data() as Session;
    const lastActiveTime = sessionData.last_active_time?.toDate() || sessionData.start_time.toDate();
    const now = new Date();
    const pausedDuration = (sessionData.paused_duration || 0) + (now.getTime() - lastActiveTime.getTime());

    await updateDoc(sessionRef, {
      paused_duration: pausedDuration,
      last_active_time: Timestamp.now()
    });
  } catch (error) {
    console.error('Error pausing session:', error);
    throw error;
  }
} 