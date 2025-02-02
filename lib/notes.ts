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
  getDoc
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

// Validation functions
const validateNoteData = (title: string, content: string) => {
  if (!title || typeof title !== 'string' || title.length === 0 || title.length > 100) {
    throw new Error('Title must be between 1 and 100 characters');
  }
  if (!content || typeof content !== 'string' || content.length > 10000) {
    throw new Error('Content must not exceed 10000 characters');
  }
};

export const createNote = async (userId: string, title: string, content: string): Promise<string> => {
  console.log('Creating note:', { userId, title });
  
  try {
    // Validate input data
    validateNoteData(title, content);

    const noteData = {
      title: title.trim(),
      content: content.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, `users/${userId}/notes`), noteData);
    console.log('Note created with ID:', docRef.id);
    return docRef.id;
  } catch (error: unknown) {
    console.error('Error creating note:', error);
    if (error instanceof FirestoreError) {
      switch (error.code) {
        case 'permission-denied':
          throw new Error('You do not have permission to create notes');
        case 'unavailable':
          console.log('Note will be created when back online');
          throw new Error('Currently offline. Note will be saved when back online');
        default:
          throw new Error(`Failed to create note: ${error.message}`);
      }
    }
    throw error;
  }
};

export async function getUserNotes(userId: string): Promise<Note[]> {
  console.log('Fetching notes for user:', userId);
  
  try {
    const notesQuery = query(
      collection(db, `users/${userId}/notes`),
      orderBy('updatedAt', 'desc')
    );

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
      switch (error.code) {
        case 'permission-denied':
          throw new Error('You do not have permission to access these notes');
        case 'unavailable':
          throw new Error('Unable to fetch notes. Please check your connection');
        default:
          throw new Error(`Failed to fetch notes: ${error.message}`);
      }
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

  return onSnapshot(
    notesQuery, 
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
      if (error.code === 'permission-denied') {
        throw new Error('You do not have permission to access these notes');
      }
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
    // Validate input data
    validateNoteData(title, content);

    // Verify the note exists and belongs to the user
    const noteRef = doc(db, `users/${userId}/notes`, noteId);
    const noteDoc = await getDoc(noteRef);
    
    if (!noteDoc.exists()) {
      throw new Error('Note not found');
    }

    await updateDoc(noteRef, {
      title: title.trim(),
      content: content.trim(),
      updatedAt: serverTimestamp(),
    });
  } catch (error: unknown) {
    console.error('Error updating note:', error);
    if (error instanceof FirestoreError) {
      switch (error.code) {
        case 'permission-denied':
          throw new Error('You do not have permission to update this note');
        case 'not-found':
          throw new Error('Note not found');
        case 'unavailable':
          console.log('Note will be updated when back online');
          throw new Error('Currently offline. Changes will be saved when back online');
        default:
          throw new Error(`Failed to update note: ${error.message}`);
      }
    }
    throw error;
  }
};

export const deleteNote = async (userId: string, noteId: string): Promise<void> => {
  try {
    // Verify the note exists and belongs to the user
    const noteRef = doc(db, `users/${userId}/notes`, noteId);
    const noteDoc = await getDoc(noteRef);
    
    if (!noteDoc.exists()) {
      throw new Error('Note not found');
    }

    await deleteDoc(noteRef);
  } catch (error: unknown) {
    console.error('Error deleting note:', error);
    if (error instanceof FirestoreError) {
      switch (error.code) {
        case 'permission-denied':
          throw new Error('You do not have permission to delete this note');
        case 'not-found':
          throw new Error('Note not found');
        case 'unavailable':
          console.log('Note will be deleted when back online');
          throw new Error('Currently offline. Note will be deleted when back online');
        default:
          throw new Error(`Failed to delete note: ${error.message}`);
      }
    }
    throw error;
  }
};

// Helper function to check online status and enable network
export const checkOnlineStatus = async (): Promise<void> => {
  try {
    await enableNetwork(db);
    console.log('Back online, syncing data...');
  } catch (error) {
    console.error('Error checking online status:', error);
    throw new Error('Failed to check online status');
  }
}; 