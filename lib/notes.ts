import { db } from './firebase';
import { 
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  DocumentData
} from 'firebase/firestore';

export interface Note {
  id?: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = await addDoc(collection(db, 'notes'), {
      ...note,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
}

export async function updateNote(id: string, note: Partial<Omit<Note, 'id' | 'userId' | 'createdAt'>>) {
  try {
    const noteRef = doc(db, 'notes', id);
    await updateDoc(noteRef, {
      ...note,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
}

export async function deleteNote(id: string) {
  try {
    const noteRef = doc(db, 'notes', id);
    await deleteDoc(noteRef);
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
}

export async function getUserNotes(userId: string): Promise<Note[]> {
  try {
    const q = query(collection(db, 'notes'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    })) as Note[];
  } catch (error) {
    console.error('Error getting user notes:', error);
    throw error;
  }
} 