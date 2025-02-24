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
  setLogLevel,
  FirestoreError,
  enableNetwork,
  disableNetwork,
  DocumentData,
  getDoc,
  Firestore
} from 'firebase/firestore';

// Enable debug logging in development
if (process.env.NODE_ENV === 'development') {
  setLogLevel('debug');
}

export interface WeatherSnapshot {
  temperature: number;
  humidity: number;
  uvIndex: number;
  airPressure: number;
  wind: {
    speed: number;
    direction: string;
  };
  moon: {
    phase: string;
    illumination: number;
    moonrise: string;
    moonset: string;
  };
  location: {
    name: string;
    country: string;
    coordinates: {
      lat: number;
      lon: number;
    };
  };
  timestamp: Timestamp;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  weatherSnapshot?: WeatherSnapshot;
}

// Validation functions
const validateNoteData = (title: string, content: string): void => {
  if (!title || typeof title !== 'string' || title.length === 0 || title.length > 100) {
    throw new Error('Title must be between 1 and 100 characters');
  }
  if (!content || typeof content !== 'string' || content.length > 10000) {
    throw new Error('Content must not exceed 10000 characters');
  }
};

const handleFirestoreError = (error: FirestoreError, context: string): never => {
  switch (error.code) {
    case 'permission-denied':
      throw new Error(`You do not have permission to ${context}`);
    case 'not-found':
      throw new Error('Note not found');
    case 'unavailable':
      throw new Error('Service is currently offline');
    default:
      throw new Error(`Failed to ${context}: ${error.message}`);
  }
};

export const createNote = async (
  userId: string, 
  title: string, 
  content: string,
  weatherSnapshot?: WeatherSnapshot,
  sessionId?: string | null
): Promise<string> => {
  console.log('Creating note:', { userId, title });
  
  try {
    if (!db) throw new Error('Firestore is not initialized');
    if (!userId) throw new Error('User ID is required');

    // Validate input data
    validateNoteData(title, content);

    const noteData = {
      title: title.trim(),
      content: content.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      weatherSnapshot,
      sessionId: sessionId || null,
    };
    
    const docRef = await addDoc(collection(db, `users/${userId}/notes`), noteData);
    console.log('Note created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating note:', error);
    if (error instanceof FirestoreError) {
      handleFirestoreError(error, 'create note');
    }
    throw error;
  }
};

export async function getUserNotes(userId: string): Promise<Note[]> {
  console.log('Fetching notes for user:', userId);
  
  try {
    if (!db) throw new Error('Firestore is not initialized');
    if (!userId) throw new Error('User ID is required');

    const notesQuery = query(
      collection(db, `users/${userId}/notes`),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(notesQuery);
    console.log('Fetched notes count:', snapshot.size);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Handle potentially null timestamps
      const createdAt = data.createdAt || Timestamp.now();
      const updatedAt = data.updatedAt || createdAt;
      
      return {
        id: doc.id,
        title: data.title || '',
        content: data.content || '',
        createdAt,
        updatedAt,
        weatherSnapshot: data.weatherSnapshot,
      };
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    if (error instanceof FirestoreError) {
      handleFirestoreError(error, 'fetch notes');
    }
    throw new Error('Failed to fetch notes: An unexpected error occurred');
  }
}

export const subscribeToUserNotes = (
  userId: string, 
  callback: (notes: Note[]) => void
): (() => void) => {
  console.log('Setting up notes subscription for user:', userId);
  
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

  const notesQuery = query(
    collection(db, `users/${userId}/notes`),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(
    notesQuery, 
    (snapshot) => {
      try {
        const notes = snapshot.docs.map(doc => {
          const data = doc.data();
          // Handle potentially null timestamps
          const createdAt = data.createdAt || Timestamp.now();
          const updatedAt = data.updatedAt || createdAt;
          
          return {
            id: doc.id,
            title: data.title || '',
            content: data.content || '',
            createdAt,
            updatedAt,
            weatherSnapshot: data.weatherSnapshot,
          } as Note;
        });
        console.log('Received notes update, count:', notes.length);
        callback(notes);
      } catch (error) {
        console.error('Error processing notes snapshot:', error);
        callback([]);
      }
    },
    (error: FirestoreError) => {
      console.error('Error in notes subscription:', error);
      handleFirestoreError(error, 'subscribe to notes');
    }
  );
};

export const updateNote = async (
  userId: string,
  noteId: string,
  title: string,
  content: string,
  weatherSnapshot?: WeatherSnapshot,
  sessionId?: string | null
): Promise<void> => {
  try {
    if (!db) throw new Error('Firestore is not initialized');
    if (!userId) throw new Error('User ID is required');
    if (!noteId) throw new Error('Note ID is required');

    // Validate input data
    validateNoteData(title, content);

    const noteRef = doc(db, `users/${userId}/notes/${noteId}`);
    const updateData = {
      title: title.trim(),
      content: content.trim(),
      updatedAt: serverTimestamp(),
      weatherSnapshot,
      sessionId: sessionId || null,
    };

    await updateDoc(noteRef, updateData);
  } catch (error) {
    console.error('Error updating note:', error);
    if (error instanceof FirestoreError) {
      handleFirestoreError(error, 'update note');
    }
    throw error;
  }
};

export const deleteNote = async (userId: string, noteId: string): Promise<void> => {
  try {
    if (!db) throw new Error('Firestore is not initialized');
    if (!userId) throw new Error('User ID is required');
    if (!noteId) throw new Error('Note ID is required');

    // Verify the note exists and belongs to the user
    const noteRef = doc(db, `users/${userId}/notes`, noteId);
    const noteDoc = await getDoc(noteRef);
    
    if (!noteDoc.exists()) {
      throw new Error('Note not found');
    }

    await deleteDoc(noteRef);
  } catch (error) {
    console.error('Error deleting note:', error);
    if (error instanceof FirestoreError) {
      handleFirestoreError(error, 'delete note');
    }
    throw error;
  }
};

// Helper function to check online status and enable network
export const checkOnlineStatus = async (): Promise<void> => {
  try {
    if (!db) throw new Error('Firestore is not initialized');
    
    await enableNetwork(db);
    console.log('Back online, syncing data...');
  } catch (error) {
    console.error('Error checking online status:', error);
    throw new Error('Failed to check online status');
  }
}; 