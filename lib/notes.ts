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
  orderBy
} from 'firebase/firestore';

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function createNote(userId: string, title: string, content: string): Promise<Note> {
  const now = new Date();
  const noteData = {
    userId,
    title,
    content,
    createdAt: now,
    updatedAt: now
  };

  const docRef = await addDoc(collection(db, 'notes'), noteData);
  return {
    id: docRef.id,
    ...noteData
  };
}

export async function getUserNotes(userId: string): Promise<Note[]> {
  const notesQuery = query(
    collection(db, 'notes'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );

  const snapshot = await getDocs(notesQuery);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate()
  })) as Note[];
}

export async function updateNote(noteId: string, title: string, content: string): Promise<void> {
  const noteRef = doc(db, 'notes', noteId);
  await updateDoc(noteRef, {
    title,
    content,
    updatedAt: new Date()
  });
}

export async function deleteNote(noteId: string): Promise<void> {
  const noteRef = doc(db, 'notes', noteId);
  await deleteDoc(noteRef);
} 