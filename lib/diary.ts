import { db } from '@/lib/firebase';
import { 
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  FirestoreError,
  getDoc,
} from 'firebase/firestore';

export interface WeatherData {
  temperature: number;
  humidity: number;
  uvIndex: number;
  airPressure: number;
  wind: {
    speed: number;
    direction: string;
  };
}

export interface MoonData {
  phase: string;
  illumination: number;
  moonrise: string;
  moonset: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  weather: WeatherData;
  moon: MoonData;
  location: LocationData;
}

// Validation functions
const validateDiaryData = (
  title: string, 
  content: string, 
  weather: WeatherData, 
  moon: MoonData, 
  location: LocationData
): void => {
  if (!title || typeof title !== 'string' || title.length === 0 || title.length > 100) {
    throw new Error('Title must be between 1 and 100 characters');
  }
  if (!content || typeof content !== 'string' || content.length > 10000) {
    throw new Error('Content must not exceed 10000 characters');
  }
  if (!weather || !moon || !location) {
    throw new Error('Weather, moon, and location data are required');
  }
};

const handleFirestoreError = (error: FirestoreError, context: string): never => {
  switch (error.code) {
    case 'permission-denied':
      throw new Error(`You do not have permission to ${context}`);
    case 'not-found':
      throw new Error('Diary entry not found');
    case 'unavailable':
      throw new Error('Service is currently offline');
    default:
      throw new Error(`Failed to ${context}: ${error.message}`);
  }
};

export const createDiaryEntry = async (
  userId: string, 
  title: string, 
  content: string,
  weather: WeatherData,
  moon: MoonData,
  location: LocationData
): Promise<string> => {
  console.log('Creating diary entry:', { userId, title });
  
  try {
    if (!db) throw new Error('Firestore is not initialized');
    if (!userId) throw new Error('User ID is required');

    // Validate input data
    validateDiaryData(title, content, weather, moon, location);

    const entryData = {
      title: title.trim(),
      content: content.trim(),
      weather,
      moon,
      location,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, `users/${userId}/diary`), entryData);
    console.log('Diary entry created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating diary entry:', error);
    if (error instanceof FirestoreError) {
      handleFirestoreError(error, 'create diary entry');
    }
    throw error;
  }
};

export async function getUserDiaryEntries(userId: string): Promise<DiaryEntry[]> {
  console.log('Fetching diary entries for user:', userId);
  
  try {
    if (!db) throw new Error('Firestore is not initialized');
    if (!userId) throw new Error('User ID is required');

    const entriesQuery = query(
      collection(db, `users/${userId}/diary`),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(entriesQuery);
    console.log('Fetched diary entries count:', snapshot.size);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        content: data.content || '',
        weather: data.weather,
        moon: data.moon,
        location: data.location,
        createdAt: data.createdAt || Timestamp.now(),
        updatedAt: data.updatedAt || data.createdAt || Timestamp.now()
      };
    });
  } catch (error) {
    console.error('Error fetching diary entries:', error);
    if (error instanceof FirestoreError) {
      handleFirestoreError(error, 'fetch diary entries');
    }
    throw new Error('Failed to fetch diary entries');
  }
}

export const subscribeToDiaryEntries = (
  userId: string, 
  callback: (entries: DiaryEntry[]) => void
): (() => void) => {
  console.log('Setting up diary entries subscription for user:', userId);
  
  if (!db) {
    console.error('Firestore is not initialized');
    callback([]);
    return () => {};
  }

  if (!userId) {
    console.error('User ID is required');
    callback([]);
    return () => {};
  }

  const entriesQuery = query(
    collection(db, `users/${userId}/diary`),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(
    entriesQuery, 
    (snapshot) => {
      try {
        const entries = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || '',
            content: data.content || '',
            weather: data.weather,
            moon: data.moon,
            location: data.location,
            createdAt: data.createdAt || Timestamp.now(),
            updatedAt: data.updatedAt || data.createdAt || Timestamp.now()
          } as DiaryEntry;
        });
        console.log('Received diary entries update, count:', entries.length);
        callback(entries);
      } catch (error) {
        console.error('Error processing diary entries snapshot:', error);
        callback([]);
      }
    },
    (error: FirestoreError) => {
      console.error('Error in diary entries subscription:', error);
      handleFirestoreError(error, 'subscribe to diary entries');
    }
  );
};

export const updateDiaryEntry = async (
  userId: string, 
  entryId: string, 
  title: string, 
  content: string,
  weather: WeatherData,
  moon: MoonData,
  location: LocationData
): Promise<void> => {
  console.log('Updating diary entry:', { userId, entryId, title });
  
  try {
    if (!db) throw new Error('Firestore is not initialized');
    if (!userId) throw new Error('User ID is required');
    if (!entryId) throw new Error('Entry ID is required');

    // Validate input data
    validateDiaryData(title, content, weather, moon, location);

    // Verify the entry exists and belongs to the user
    const entryRef = doc(db, `users/${userId}/diary`, entryId);
    const entryDoc = await getDoc(entryRef);
    
    if (!entryDoc.exists()) {
      throw new Error('Diary entry not found');
    }

    await updateDoc(entryRef, {
      title: title.trim(),
      content: content.trim(),
      weather,
      moon,
      location,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating diary entry:', error);
    if (error instanceof FirestoreError) {
      handleFirestoreError(error, 'update diary entry');
    }
    throw error;
  }
};

export const deleteDiaryEntry = async (userId: string, entryId: string): Promise<void> => {
  try {
    if (!db) throw new Error('Firestore is not initialized');
    if (!userId) throw new Error('User ID is required');
    if (!entryId) throw new Error('Entry ID is required');

    // Verify the entry exists and belongs to the user
    const entryRef = doc(db, `users/${userId}/diary`, entryId);
    const entryDoc = await getDoc(entryRef);
    
    if (!entryDoc.exists()) {
      throw new Error('Diary entry not found');
    }

    await deleteDoc(entryRef);
  } catch (error) {
    console.error('Error deleting diary entry:', error);
    if (error instanceof FirestoreError) {
      handleFirestoreError(error, 'delete diary entry');
    }
    throw error;
  }
}; 