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
  serverTimestamp
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
  const noteData = {
    userId,
    title,
    content,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, 'notes'), noteData);
  
  // Return the note with JavaScript Date objects
  return {
    id: docRef.id,
    userId,
    title,
    content,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export async function getUserNotes(userId: string): Promise<Note[]> {
  const notesQuery = query(
    collection(db, 'notes'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );

  const snapshot = await getDocs(notesQuery);
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
}

export async function updateNote(noteId: string, title: string, content: string): Promise<void> {
  const noteRef = doc(db, 'notes', noteId);
  await updateDoc(noteRef, {
    title,
    content,
    updatedAt: serverTimestamp()
  });
}

export async function deleteNote(noteId: string): Promise<void> {
  const noteRef = doc(db, 'notes', noteId);
  await deleteDoc(noteRef);
} 