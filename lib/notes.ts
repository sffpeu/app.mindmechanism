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
  DocumentData
} from 'firebase/firestore';

// Enable debug logging in development
if (process.env.NODE_ENV === 'development') {
  setLogLevel('debug');
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const createNote = async (userId: string, title: string, content: string): Promise<void> => {
  console.log('Creating note:', { userId, title });
  
  try {
    const noteData = {
      title,
      content,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await addDoc(collection(db, `users/${userId}/notes`), noteData);
  } catch (error: unknown) {
    console.error('Error creating note:', error);
    // If offline, the operation will be queued
    if (error instanceof FirestoreError && error.code === 'unavailable') {
      console.log('Note will be created when back online');
    }
    throw error;
  }
};

export async function getUserNotes(userId: string): Promise<Note[]> {
  console.log('Fetching notes for user:', userId);
  
  const notesQuery = query(
    collection(db, `users/${userId}/notes`),
    orderBy('updatedAt', 'desc')
  );

  try {
    const snapshot = await getDocs(notesQuery);
    console.log('Fetched notes count:', snapshot.size);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        content: data.content,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    if (error instanceof FirestoreError) {
      throw new Error(`Failed to fetch notes: ${error.message}`);
    }
    throw new Error('Failed to fetch notes: An unexpected error occurred');
  }
}

export const subscribeToUserNotes = (userId: string, callback: (notes: Note[]) => void) => {
  console.log('Setting up notes subscription for user:', userId);
  
  const notesQuery = query(
    collection(db, `users/${userId}/notes`),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(notesQuery, 
    (snapshot) => {
      const notes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Note[];
      console.log('Received notes update, count:', notes.length);
      callback(notes);
    },
    (error: FirestoreError) => {
      console.error('Error in notes subscription:', error);
      // If we're offline, we'll still get cached data
      if (error.code === 'unavailable') {
        console.log('Operating in offline mode');
        // Optionally disable network to force offline mode
        disableNetwork(db).then(() => {
          console.log('Network disabled, using cached data');
        });
      }
    }
  );
};

export const updateNote = async (userId: string, noteId: string, title: string, content: string): Promise<void> => {
  console.log('Updating note:', { userId, noteId, title });
  
  try {
    const noteRef = doc(db, `users/${userId}/notes`, noteId);
    await updateDoc(noteRef, {
      title,
      content,
      updatedAt: serverTimestamp(),
    });
  } catch (error: unknown) {
    console.error('Error updating note:', error);
    // If offline, the operation will be queued
    if (error instanceof FirestoreError && error.code === 'unavailable') {
      console.log('Note will be updated when back online');
    }
    throw error;
  }
};

export const deleteNote = async (userId: string, noteId: string): Promise<void> => {
  try {
    const noteRef = doc(db, `users/${userId}/notes`, noteId);
    await deleteDoc(noteRef);
  } catch (error: unknown) {
    console.error('Error deleting note:', error);
    // If offline, the operation will be queued
    if (error instanceof FirestoreError && error.code === 'unavailable') {
      console.log('Note will be deleted when back online');
    }
    throw error;
  }
};

// Helper function to check online status
export const checkOnlineStatus = async (): Promise<void> => {
  try {
    await enableNetwork(db);
    console.log('Back online, syncing data...');
  } catch (error) {
    console.error('Error checking online status:', error);
  }
}; 