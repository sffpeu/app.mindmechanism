import { db } from '@/lib/firebase';
import { 
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  setLogLevel
} from 'firebase/firestore';

// Enable debug logging in development
if (process.env.NODE_ENV === 'development') {
  setLogLevel('debug');
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function createNote(userId: string, title: string, content: string): Promise<Note> {
  console.log('Creating note:', { userId, title });
  
  const noteData = {
    userId,
    title,
    content,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    const docRef = await addDoc(collection(db, 'notes'), noteData);
    console.log('Note created with ID:', docRef.id);
    
    // Return the note with JavaScript Date objects
    return {
      id: docRef.id,
      userId,
      title,
      content,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error creating note:', error);
    throw new Error('Failed to create note: ' + error.message);
  }
}

export async function getUserNotes(userId: string): Promise<Note[]> {
  console.log('Fetching notes for user:', userId);
  
  const notesQuery = query(
    collection(db, 'notes'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );

  try {
    const snapshot = await getDocs(notesQuery);
    console.log('Fetched notes count:', snapshot.size);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        title: data.title,
        content: data.content,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw new Error('Failed to fetch notes: ' + error.message);
  }
}

export function subscribeToUserNotes(userId: string, callback: (notes: Note[]) => void) {
  console.log('Setting up notes subscription for user:', userId);
  
  const notesQuery = query(
    collection(db, 'notes'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(
    notesQuery,
    (snapshot) => {
      console.log('Received notes update, count:', snapshot.size);
      const notes = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          title: data.title,
          content: data.content,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      });
      callback(notes);
    },
    (error) => {
      console.error('Notes subscription error:', error);
      // Call callback with empty array on error to prevent UI from hanging
      callback([]);
    }
  );
}

export async function updateNote(noteId: string, title: string, content: string): Promise<void> {
  console.log('Updating note:', { noteId, title });
  
  try {
    const noteRef = doc(db, 'notes', noteId);
    await updateDoc(noteRef, {
      title,
      content,
      updatedAt: serverTimestamp()
    });
    console.log('Note updated successfully');
  } catch (error) {
    console.error('Error updating note:', error);
    throw new Error('Failed to update note: ' + error.message);
  }
}

export async function deleteNote(noteId: string): Promise<void> {
  console.log('Deleting note:', noteId);
  
  try {
    const noteRef = doc(db, 'notes', noteId);
    await deleteDoc(noteRef);
    console.log('Note deleted successfully');
  } catch (error) {
    console.error('Error deleting note:', error);
    throw new Error('Failed to delete note: ' + error.message);
  }
} 