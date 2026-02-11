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

// --- MOCK STORAGE HELPERS ---
const MOCK_STORAGE_KEY = 'mind_mechanism_mock_sessions';
const USE_MOCK_STORAGE = true; // Force mock storage for "Offline Mode"

function getMockSessions(): Session[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(MOCK_STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    // Convert string timestamps back to objects/dates if needed, 
    // but for simplicity in mock mode we might just let them be strings or recreate Timestamps
    return parsed.map((s: any) => ({
      ...s,
      start_time: s.start_time ? new Timestamp(s.start_time.seconds, s.start_time.nanoseconds) : Timestamp.now(),
      end_time: s.end_time ? new Timestamp(s.end_time.seconds, s.end_time.nanoseconds) : undefined,
      last_active_time: s.last_active_time ? new Timestamp(s.last_active_time.seconds, s.last_active_time.nanoseconds) : undefined
    }));
  } catch (e) {
    console.error("Failed to parse mock sessions", e);
    return [];
  }
}

function saveMockSessions(sessions: Session[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(sessions));
}

function addMockSession(session: Session) {
  const sessions = getMockSessions();
  sessions.push(session);
  saveMockSessions(sessions);
}

function updateMockSession(sessionId: string, updates: Partial<Session>) {
  let sessions = getMockSessions();
  const index = sessions.findIndex(s => s.id === sessionId);
  if (index !== -1) {
    sessions[index] = { ...sessions[index], ...updates };
    saveMockSessions(sessions);
  }
}
// -----------------------------

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
  is_public?: boolean;
  max_participants?: number;
  current_participants?: number;
  scheduled_start_time?: string;
  host_id?: string;
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
  // MOCK FALLBACK
  if (USE_MOCK_STORAGE) {
    const newSession: Session = {
      ...data,
      id: 'mock-session-' + Date.now(),
      start_time: Timestamp.now(),
      status: 'waiting',
      actual_duration: 0
    };
    addMockSession(newSession);
    console.log('Created mock session:', newSession);
    return newSession;
  }

  try {
    if (!db) throw new Error('Firestore is not initialized');

    validateSession(data);

    const sessionData = {
      ...data,
      start_time: Timestamp.now(),
      status: 'waiting' as const, // Default to waiting for public sessions
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
    console.warn('Error in createSession (falling back to mock?):', error);
    // Could optionally fall back here if USE_MOCK_STORAGE was false but failed
    throw error;
  }
}

export async function updateSession(
  sessionId: string,
  data: Partial<SessionData> & {
    status?: 'completed' | 'in_progress' | 'aborted' | 'waiting';
    actual_duration?: number;
    end_time?: string;
    last_active_time?: string;
    paused_duration?: number;
  }
): Promise<void> {
  if (USE_MOCK_STORAGE) {
    const sessions = getMockSessions();
    const existing = sessions.find(s => s.id === sessionId);
    if (!existing) throw new Error("Mock session not found");

    const now = new Date();
    let actualDuration = data.actual_duration ?? existing.actual_duration;

    // Calculate duration on completion
    if (existing.status === 'in_progress' && (data.status === 'completed' || data.status === 'aborted')) {
      const startTime = existing.start_time.toDate();
      const lastActive = existing.last_active_time ? existing.last_active_time.toDate() : startTime;
      const paused = existing.paused_duration || 0;
      actualDuration = now.getTime() - startTime.getTime() - paused;
    }

    const updates: any = {
      ...data,
      actual_duration: actualDuration,
      last_active_time: data.last_active_time ? Timestamp.fromDate(new Date(data.last_active_time)) : Timestamp.now()
    };
    if (data.end_time) updates.end_time = Timestamp.fromDate(new Date(data.end_time));

    updateMockSession(sessionId, updates);
    return;
  }

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
    let actualDuration = data.actual_duration ?? sessionData.actual_duration; // Use existing if not provided

    if (sessionData.status === 'in_progress' && (data.status === 'completed' || data.status === 'aborted')) {
      const lastActiveTime = sessionData.last_active_time?.toDate() || sessionData.start_time.toDate();
      const pausedDuration = sessionData.paused_duration || 0;
      actualDuration = now.getTime() - sessionData.start_time.toDate().getTime() - pausedDuration;
    }

    const updateData: any = {
      ...data,
      actual_duration: actualDuration,
      last_active_time: data.last_active_time ? Timestamp.fromDate(new Date(data.last_active_time)) : Timestamp.now()
    };

    if (data.end_time) {
      updateData.end_time = Timestamp.fromDate(new Date(data.end_time));
    }

    await updateDoc(sessionRef, updateData);
  } catch (error) {
    console.error('Error in updateSession:', error);
    throw error;
  }
}

export async function getUserSessions(userId: string, retryCount = 3): Promise<Session[]> {
  if (USE_MOCK_STORAGE) {
    const sessions = getMockSessions();
    // Filter by userId and sort desc
    return sessions
      .filter(s => s.user_id === userId)
      .sort((a, b) => b.start_time.toMillis() - a.start_time.toMillis());
  }

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
      // ... (existing retry logic skipped for brevity, but would remain in real impl) ...
      if (attempt < retryCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
    }
  }

  if (lastError) throw lastError;
  return [];
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
  // Use generic getter which handles mock/real
  const sessions = await getUserSessions(userId, retryCount);

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const completionRate = totalSessions ? (completedSessions.length / totalSessions) * 100 : 0;

  const now = new Date();
  const totalTime = sessions.reduce((acc, session) => {
    // (Similar calc logic as before)
    if (session.status === 'completed' || session.status === 'aborted') {
      return acc + (session.actual_duration || 0);
    }
    return acc;
  }, 0);

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
}

function calculateMonthlyTime(sessions: Session[]): number {
  return sessions.reduce((acc, session) => {
    if (session.status === 'completed' || session.status === 'aborted') {
      return acc + (session.actual_duration || 0);
    }
    return acc;
  }, 0);
}

export async function deleteSession(sessionId: string): Promise<void> {
  if (USE_MOCK_STORAGE) {
    let sessions = getMockSessions();
    sessions = sessions.filter(s => s.id !== sessionId);
    saveMockSessions(sessions);
    return;
  }

  try {
    if (!db) throw new Error('Firestore is not initialized');
    const sessionRef = doc(db, 'sessions', sessionId);
    await deleteDoc(sessionRef);
  } catch (error) {
    console.error('Error in deleteSession:', error);
    throw error;
  }
}

export async function updateSessionActivity(sessionId: string): Promise<void> {
  if (USE_MOCK_STORAGE) {
    updateMockSession(sessionId, { last_active_time: Timestamp.now() });
    return;
  }

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
  if (USE_MOCK_STORAGE) {
    const sessions = getMockSessions();
    const existing = sessions.find(s => s.id === sessionId);
    if (existing) {
      const lastActive = existing.last_active_time?.toDate() || existing.start_time.toDate();
      const now = new Date();
      const pausedDuration = (existing.paused_duration || 0) + (now.getTime() - lastActive.getTime());
      updateMockSession(sessionId, {
        paused_duration: pausedDuration,
        last_active_time: Timestamp.now()
      });
    }
    return;
  }
  // ... Real impl fallback would go here
}

export async function getPublicSessions(): Promise<Session[]> {
  if (USE_MOCK_STORAGE) {
    const sessions = getMockSessions();
    // Returns sessions that are public AND (waiting OR in_progress)
    return sessions.filter(s =>
      s.is_public === true &&
      (s.status === 'waiting' || s.status === 'in_progress')
    ).sort((a, b) => b.start_time.toMillis() - a.start_time.toMillis());
  }

  try {
    if (!db) throw new Error('Firestore is not initialized');

    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('is_public', '==', true),
      where('status', 'in', ['waiting', 'in_progress']),
      orderBy('start_time', 'desc')
    );

    const snapshot = await getDocs(sessionsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Session[];
  } catch (error) {
    console.error('Error fetching public sessions:', error);
    return [];
  }
}

export async function joinSession(sessionId: string): Promise<void> {
  if (USE_MOCK_STORAGE) {
    const sessions = getMockSessions();
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index === -1) throw new Error("Session not found");
    const session = sessions[index];

    if (session.current_participants && session.max_participants && session.current_participants >= session.max_participants) {
      throw new Error('Session is full');
    }

    updateMockSession(sessionId, {
      current_participants: (session.current_participants || 0) + 1
    });
    return;
  }

  try {
    if (!db) throw new Error('Firestore is not initialized');

    // Add transaction or atomic increment here ideally, but simple update for now
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) throw new Error('Session not found');

    const data = sessionDoc.data() as Session;
    if (data.current_participants && data.max_participants && data.current_participants >= data.max_participants) {
      throw new Error('Session is full');
    }

    await updateDoc(sessionRef, {
      current_participants: (data.current_participants || 0) + 1
    });
  } catch (error) {
    console.error('Error joining session:', error);
    throw error;
  }
}
