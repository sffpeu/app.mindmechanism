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
  deleteDoc,
  increment
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
  progress: number;
  /** Public lobby fields */
  is_public?: boolean;
  max_participants?: number;
  current_participants?: number;
  host_id?: string;
  scheduled_start_time?: string;
}

export interface Session extends SessionData {
  id: string;
  status: 'completed' | 'in_progress' | 'aborted' | 'waiting';
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

export async function getUserSessions(userId: string, retryCount = 3): Promise<Session[]> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      if (!db) throw new Error('Firestore is not initialized');
      if (!userId) throw new Error('User ID is required');

      console.log(`Fetching sessions for user ${userId} (attempt ${attempt + 1}/${retryCount})`);

      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('user_id', '==', userId),
        orderBy('start_time', 'desc')
      );

      const snapshot = await getDocs(sessionsQuery);
      const sessions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          start_time: data.start_time,
          end_time: data.end_time,
          last_active_time: data.last_active_time
        } as Session;
      });

      console.log(`Successfully loaded ${sessions.length} sessions`);
      return sessions;

    } catch (error) {
      console.error(`Error in getUserSessions (attempt ${attempt + 1}):`, error);
      lastError = error instanceof Error ? error : new Error(String(error));

      if (error instanceof FirestoreError) {
        switch (error.code) {
          case 'permission-denied':
            throw new Error('You do not have permission to access these sessions');
          case 'unavailable':
            // Only retry on unavailable error
            if (attempt < retryCount - 1) {
              console.log('Service unavailable, retrying...');
              await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
              continue;
            }
            throw new Error('Service is currently offline');
          default:
            throw new Error(`Failed to fetch sessions: ${error.message}`);
        }
      }

      // If we're not on the last attempt, continue to retry
      if (attempt < retryCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
    }
  }

  // If we've exhausted all retries, throw the last error
  if (lastError) {
    throw lastError;
  }

  return [];
}

export async function getPublicSessions(): Promise<Session[]> {
  try {
    if (!db) throw new Error('Firestore is not initialized');

    const q = query(
      collection(db, 'sessions'),
      where('is_public', '==', true)
    );
    const snapshot = await getDocs(q);
    const sessions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        start_time: data.start_time,
        end_time: data.end_time,
        last_active_time: data.last_active_time
      } as Session;
    });
    sessions.sort((a, b) => {
      const aTime = a.start_time?.toDate?.()?.getTime() ?? (a.scheduled_start_time ? new Date(a.scheduled_start_time).getTime() : 0);
      const bTime = b.start_time?.toDate?.()?.getTime() ?? (b.scheduled_start_time ? new Date(b.scheduled_start_time).getTime() : 0);
      return bTime - aTime;
    });
    return sessions;
  } catch (error) {
    console.error('Error in getPublicSessions:', error);
    if (error instanceof FirestoreError) {
      if (error.code === 'permission-denied') return [];
      throw new Error(`Failed to fetch public sessions: ${error.message}`);
    }
    throw error;
  }
}

export async function joinSession(sessionId: string): Promise<void> {
  try {
    if (!db) throw new Error('Firestore is not initialized');
    if (!sessionId) throw new Error('Session ID is required');

    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      throw new Error('Session not found');
    }

    const data = sessionDoc.data() as Session;
    const current = data.current_participants ?? 0;
    const max = data.max_participants ?? 1;
    if (current >= max) {
      throw new Error('Session is full');
    }

    await updateDoc(sessionRef, {
      current_participants: increment(1)
    });
  } catch (error) {
    console.error('Error in joinSession:', error);
    if (error instanceof FirestoreError) {
      switch (error.code) {
        case 'permission-denied':
          throw new Error('You do not have permission to join this session');
        case 'not-found':
          throw new Error('Session not found');
        default:
          throw new Error(`Failed to join session: ${error.message}`);
      }
    }
    throw error;
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

export async function getUserStats(userId: string, retryCount = 3): Promise<UserStats> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      if (!db) throw new Error('Firestore is not initialized');
      if (!userId) throw new Error('User ID is required');

      console.log(`Fetching stats for user ${userId} (attempt ${attempt + 1}/${retryCount})`);

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
        if (!session.start_time) return acc;
        
        if (session.status === 'completed') {
          return acc + (session.actual_duration || 0);
        } else if (session.status === 'aborted') {
          return acc + (session.actual_duration || 0);
        } else if (session.status === 'in_progress') {
          const startTime = session.start_time.toDate();
          const lastActiveTime = session.last_active_time?.toDate() || startTime;
          const pausedDuration = session.paused_duration || 0;
          
          const activeTime = lastActiveTime.getTime() - startTime.getTime() - pausedDuration;
          return acc + activeTime;
        }
        return acc;
      }, 0);

      console.log(`Successfully calculated stats for ${totalSessions} sessions`);

      const thisMonth = sessions.filter(session => {
        if (!session.start_time) return false;
        const sessionDate = session.start_time.toDate();
        return sessionDate.getMonth() === now.getMonth() && 
               sessionDate.getFullYear() === now.getFullYear();
      });

      return {
        totalTime,
        totalSessions,
        completionRate,
        monthlyProgress: {
          totalSessions: thisMonth.length,
          totalTime: calculateMonthlyTime(thisMonth),
          completionRate: thisMonth.length ? 
            (thisMonth.filter(s => s.status === 'completed').length / thisMonth.length) * 100 : 0
        }
      };

    } catch (error) {
      console.error(`Error in getUserStats (attempt ${attempt + 1}):`, error);
      lastError = error instanceof Error ? error : new Error(String(error));

      if (error instanceof FirestoreError) {
        switch (error.code) {
          case 'permission-denied':
            throw new Error('You do not have permission to access these stats');
          case 'unavailable':
            if (attempt < retryCount - 1) {
              console.log('Service unavailable, retrying...');
              await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
              continue;
            }
            throw new Error('Service is currently offline');
          default:
            throw new Error(`Failed to fetch stats: ${error.message}`);
        }
      }

      if (attempt < retryCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

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

function calculateMonthlyTime(sessions: Session[]): number {
  return sessions.reduce((acc, session) => {
    if (session.status === 'completed') {
      return acc + (session.actual_duration || 0);
    } else if (session.status === 'aborted') {
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