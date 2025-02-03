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
  getDoc
} from 'firebase/firestore';

interface SessionData {
  user_id: string
  clock_id: number
  duration: number
  words: string[]
  moon_phase: string
  moon_illumination: number
  moon_rise: string
  moon_set: string
  weather_condition: string
  temperature: number
  humidity: number
  uv_index: number
  pressure: number
  wind_speed: number
  city: string
  country: string
  elevation: number
  sea_level: number
  latitude: number
  longitude: number
}

interface Session extends SessionData {
  id: string;
  status: 'completed' | 'in_progress' | 'aborted';
  actual_duration: number;
  start_time: Timestamp;
  end_time?: Timestamp;
}

export async function createSession(data: SessionData) {
  try {
    const docRef = await addDoc(collection(db, 'sessions'), {
      ...data,
      start_time: Timestamp.now(),
      status: 'in_progress',
      actual_duration: 0
    });

    const docSnap = await getDoc(docRef);
    return {
      id: docRef.id,
      ...docSnap.data()
    };
  } catch (error) {
    console.error('Error in createSession:', error);
    throw error;
  }
}

export async function updateSession(sessionId: string, data: Partial<SessionData> & { status: 'completed' | 'aborted', end_time: string, actual_duration: number }) {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    await updateDoc(sessionRef, {
      ...data,
      end_time: Timestamp.now()
    });
  } catch (error) {
    console.error('Error in updateSession:', error);
    throw error;
  }
}

export async function getUserSessions(userId: string) {
  try {
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('user_id', '==', userId),
      orderBy('start_time', 'desc')
    );

    const snapshot = await getDocs(sessionsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      start_time: doc.data().start_time,
      end_time: doc.data().end_time
    })) as Session[];
  } catch (error) {
    console.error('Error in getUserSessions:', error);
    return [];
  }
}

export async function getUserStats(userId: string) {
  try {
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('user_id', '==', userId)
    );

    const snapshot = await getDocs(sessionsQuery);
    const sessions = snapshot.docs.map(doc => doc.data());
    
    // Count all sessions (including in_progress)
    const totalSessions = sessions.length;
    
    // Calculate completion rate including in_progress sessions
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const completionRate = totalSessions ? (completedSessions.length / totalSessions) * 100 : 0;

    // Calculate total time from all sessions
    const totalTime = sessions.reduce((acc, session) => {
      if (session.status === 'completed') {
        return acc + (session.actual_duration || 0);
      } else if (session.status === 'in_progress') {
        // For in-progress sessions, calculate time from start until now
        const startTime = session.start_time.toDate();
        const now = new Date();
        return acc + (now.getTime() - startTime.getTime());
      }
      return acc;
    }, 0);

    // Calculate monthly progress
    const now = new Date();
    const thisMonth = sessions.filter(session => {
      const sessionDate = session.start_time.toDate();
      return sessionDate.getMonth() === now.getMonth() && 
             sessionDate.getFullYear() === now.getFullYear();
    });

    const monthlyProgress = {
      totalSessions: thisMonth.length,
      totalTime: thisMonth.reduce((acc, session) => {
        if (session.status === 'completed') {
          return acc + (session.actual_duration || 0);
        } else if (session.status === 'in_progress') {
          const startTime = session.start_time.toDate();
          const now = new Date();
          return acc + (now.getTime() - startTime.getTime());
        }
        return acc;
      }, 0),
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